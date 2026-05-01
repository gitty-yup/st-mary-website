import type { NextApiRequest, NextApiResponse } from 'next';
import TurndownService from 'turndown';
import { parse as parseHtml } from 'node-html-parser';

const MC_KEY = process.env.MAILCHIMP_API_KEY!;
const MC_SERVER = MC_KEY?.split('-')[1] ?? 'us18';
const GH_TOKEN = process.env.GITHUB_PAT!;
const REPO = 'gitty-yup/st-mary-website';
const WEBHOOK_SECRET = process.env.MAILCHIMP_WEBHOOK_SECRET;

// Turndown: HTML → Markdown
const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
td.remove(['style', 'script', 'head', 'meta', 'link']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Mailchimp sends a GET to verify the endpoint is reachable
  if (req.method === 'GET') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Verify webhook secret
  if (WEBHOOK_SECRET && req.query.secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body;
  const type = body?.type;
  const data = extractData(body);

  if (type !== 'campaign' || data?.status !== 'sent') {
    return res.status(200).json({ skipped: true, type, status: data?.status });
  }

  const campaignId = data.id;
  if (!campaignId) return res.status(400).json({ error: 'Missing campaign ID' });

  try {
    // Fetch campaign metadata
    const campaign = await mcFetch(`/campaigns/${campaignId}`);
    const title = campaign.settings?.subject_line ?? 'Newsletter';
    const sendTime: string = campaign.send_time ?? new Date().toISOString();
    const date = sendTime.slice(0, 10);
    const slug = slugify(title);
    const filename = `${date}_${slug}`;

    // Build the canonical archive URL up front — used as a fallback link in the post
    // body if content extraction fails, so the user always has a way to read the email.
    const archiveUrl = campaign.archive_url
      ?? `https://${MC_SERVER}.campaign-archive.com/?u=c597aa31e06253c792039198a&id=${campaign.web_id}`;

    // Try to fetch HTML from: 1) content API, 2) public archive URL.
    // Total time budget ≤ 8s so we fit within Vercel Hobby's 10s timeout.
    let html = '';

    try {
      const content = await mcFetch(`/campaigns/${campaignId}/content`);
      html = content.html ?? content.archive_html ?? '';
    } catch { /* fall through */ }

    if (!html) {
      try {
        const archiveRes = await fetch(archiveUrl);
        if (archiveRes.ok) html = await archiveRes.text();
      } catch { /* ignore */ }
    }

    // Extract markdown + images if we got HTML, otherwise build a fallback post
    let finalMarkdown: string;
    const imageMap: Record<string, string> = {};

    if (html) {
      const { markdown, imageUrls } = extractContent(html);

      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        const ext = (url.split('.').pop()?.split('?')[0] ?? 'jpg').toLowerCase();
        const localName = `${slug}_${i + 1}.${ext}`;
        const repoPath = `public/media/uploads/newsletters/${localName}`;
        const localPath = `/media/uploads/newsletters/${localName}`;

        const imageBuffer = await fetchBinary(url);
        if (imageBuffer) {
          await githubPut(repoPath, imageBuffer, `Add newsletter image: ${localName}`);
          imageMap[url] = localPath;
        }
      }

      finalMarkdown = markdown;
      for (const [remote, local] of Object.entries(imageMap)) {
        finalMarkdown = finalMarkdown.split(remote).join(local);
      }
    } else {
      // Content not yet available — leave a placeholder with the archive link so
      // the user can manually fix the post (or it auto-resolves on next webhook retry).
      finalMarkdown = `_Content not yet available._\n\n[Read the full email on Mailchimp](${archiveUrl})\n`;
      console.error(`[mailchimp-webhook] No HTML available for campaign ${campaignId}, posting placeholder`);
    }

    // Build the full markdown file with frontmatter
    const fileContent = [
      '---',
      `title: "${title.replace(/"/g, '\\"')}"`,
      `date: "${date}"`,
      `author: St. Mary`,
      `category: Parish News`,
      '---',
      '',
      finalMarkdown,
    ].join('\n');

    // Commit the markdown file to GitHub
    await githubPut(
      `content/blog/${filename}.md`,
      Buffer.from(fileContent, 'utf-8'),
      `Add newsletter post: ${title}`,
    );

    return res.status(200).json({
      ok: true,
      filename,
      images: Object.keys(imageMap).length,
      hasContent: !!html,
    });
  } catch (err: any) {
    console.error('[mailchimp-webhook] Error:', err);
    return res.status(500).json({ error: err?.message ?? 'Internal error' });
  }
}

// ── Body parsing helper ───────────────────────────────────────────────────────

function extractData(body: any): Record<string, string> {
  if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return body.data;
  }
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(body ?? {})) {
    const match = key.match(/^data\[(.+)\]$/);
    if (match) data[match[1]] = String(value);
  }
  return data;
}

// ── Mailchimp API helper ──────────────────────────────────────────────────────

async function mcFetch(path: string) {
  const res = await fetch(`https://${MC_SERVER}.api.mailchimp.com/3.0${path}`, {
    headers: { Authorization: `apikey ${MC_KEY}` },
  });
  if (!res.ok) throw new Error(`Mailchimp API error ${res.status} for ${path}`);
  return res.json();
}

// ── HTML → Markdown extraction ────────────────────────────────────────────────

function extractContent(html: string): { markdown: string; imageUrls: string[] } {
  // Strip all Mailchimp merge tags: *|MC:SUBJECT|*, *|MC_PREVIEW_TEXT|*, etc.
  html = html.replace(/\*\|[^|]+\|\*/g, '');

  const root = parseHtml(html);

  // Remove Mailchimp chrome: social follow, share, preheader
  ['.mcnFollowContent', '.mcnShareContent', '[class*="preheader"]'].forEach(sel => {
    root.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Remove nodes containing boilerplate text (unsubscribe, footer, view-in-browser).
  const boilerplatePhrases = [
    'unsubscribe from this list',
    'update subscription preferences',
    'update your preferences',
    'view this email in your browser',
    'view in browser',
    'why did i get this',
    'this email was sent to',
    'copyright ©',
    'all rights reserved',
    'our mailing address',
    'want to change how you receive',
  ];
  root.querySelectorAll('td, div, p, span').forEach(el => {
    const text = el.innerText.toLowerCase().trim();
    if (text && boilerplatePhrases.some(phrase => text.includes(phrase))) {
      el.remove();
    }
  });

  // Collect content images (user-uploaded to Mailchimp CDN only)
  const imageUrls: string[] = [];
  root.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') ?? '';
    if (isContentImage(src)) imageUrls.push(src);
  });

  // Convert cleaned HTML to markdown
  const markdown = cleanMarkdown(td.turndown(root.innerHTML));

  return { markdown, imageUrls: Array.from(new Set(imageUrls)) };
}

function isContentImage(src: string): boolean {
  if (!src || !src.startsWith('http')) return false;
  if (!src.includes('mcusercontent.com')) return false;
  if (/\/track\/|open\.php|beacon|pixel/i.test(src)) return false;
  if (/facebook|twitter|instagram|youtube|linkedin|tiktok|pinterest/i.test(src)) return false;
  return true;
}

function cleanMarkdown(md: string): string {
  return md
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\[!\[\]\([^)]+\)\]\([^)]+\)/g, '')
    + '\n';
}

// ── Utility helpers ───────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/-$/, '');
}

async function fetchBinary(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function githubPut(path: string, content: Buffer, message: string): Promise<void> {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `token ${GH_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  let sha: string | undefined;
  const existing = await fetch(url, { headers });
  if (existing.ok) {
    const data = await existing.json();
    sha = data.sha;
  }

  const putRes = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message, content: content.toString('base64'), ...(sha ? { sha } : {}) }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(`GitHub PUT failed for ${path}: ${JSON.stringify(err)}`);
  }
}
