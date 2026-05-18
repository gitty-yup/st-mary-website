import TurndownService from 'turndown';
import { parse as parseHtml } from 'node-html-parser';

const MC_KEY = process.env.MAILCHIMP_API_KEY!;
const MC_SERVER = MC_KEY?.split('-')[1] ?? 'us18';
const GH_TOKEN = process.env.GITHUB_PAT!;
const REPO = 'gitty-yup/st-mary-website';
const LIST_U_PARAM = 'c597aa31e06253c792039198a';

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
td.remove(['style', 'script', 'head', 'meta', 'link']);

// Heuristic: how many body characters does a "real" blog post need? Below this we
// consider the post empty and will overwrite it.
const MIN_BODY_LENGTH = 80;

export interface ProcessResult {
  ok: boolean;
  filename?: string;
  skipped?: 'already-filled' | 'wrong-status' | 'no-id';
  hasContent?: boolean;
  images?: number;
  error?: string;
}

/** Process a single campaign by ID. Creates/updates the blog post unless the post
 *  already exists with substantive content. */
export async function processCampaign(
  campaignId: string,
  opts: { skipIfHasContent?: boolean } = {},
): Promise<ProcessResult> {
  try {
    const campaign = await mcFetch(`/campaigns/${campaignId}`);
    if (campaign.status !== 'sent') return { ok: true, skipped: 'wrong-status' };

    const title = campaign.settings?.subject_line ?? 'Newsletter';
    const sendTime: string = campaign.send_time ?? new Date().toISOString();
    const date = sendTime.slice(0, 10);
    const slug = slugify(title);
    const filename = `${date}_${slug}`;
    const blogPath = `content/blog/${filename}.md`;

    const archiveUrl = campaign.archive_url
      ?? `https://${MC_SERVER}.campaign-archive.com/?u=${LIST_U_PARAM}&id=${campaign.web_id}`;

    // If the post already exists with real content, skip — don't overwrite user edits
    if (opts.skipIfHasContent) {
      const existing = await githubGetFile(blogPath);
      if (existing) {
        const bodyOnly = existing.text.replace(/^---[\s\S]*?---/, '').trim();
        if (bodyOnly.length >= MIN_BODY_LENGTH) {
          return { ok: true, filename, skipped: 'already-filled' };
        }
      }
    }

    // Fetch HTML — try content API first, then archive URL
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
      finalMarkdown = `_Content not yet available._\n\n[Read the full email on Mailchimp](${archiveUrl})\n`;
    }

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

    await githubPut(blogPath, Buffer.from(fileContent, 'utf-8'), `Add newsletter post: ${title}`);

    return { ok: true, filename, hasContent: !!html, images: Object.keys(imageMap).length };
  } catch (err: any) {
    console.error('[mailchimp-sync] processCampaign error:', err);
    return { ok: false, error: err?.message ?? 'Internal error' };
  }
}

/** Fetch recent sent campaigns and process any whose blog post is missing/empty. */
export async function syncRecentCampaigns(opts: { sinceHours?: number; max?: number } = {}) {
  const sinceHours = opts.sinceHours ?? 72;
  const max = opts.max ?? 10;
  const since = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();

  const list = await mcFetch(
    `/campaigns?status=sent&since_send_time=${encodeURIComponent(since)}&count=${max}&sort_field=send_time&sort_dir=DESC`,
  );

  const results: { id: string; result: ProcessResult }[] = [];
  for (const c of list.campaigns ?? []) {
    const result = await processCampaign(c.id, { skipIfHasContent: true });
    results.push({ id: c.id, result });
  }
  return results;
}

// ── HTML → Markdown extraction ────────────────────────────────────────────────

export function extractContent(html: string): { markdown: string; imageUrls: string[] } {
  // Strip Mailchimp merge tags
  html = html.replace(/\*\|[^|]+\|\*/g, '');

  const root = parseHtml(html);

  // Class/id-based removal only — never remove based on descendant text, because
  // that catches outer wrappers whose footer content is deep inside.
  [
    '.mcnFollowContent', '.mcnShareContent',
    '[class*="preheader"]', '[id*="preheader"]',
  ].forEach(sel => {
    root.querySelectorAll(sel).forEach(el => el.remove());
  });

  const imageUrls: string[] = [];
  root.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') ?? '';
    if (isContentImage(src)) imageUrls.push(src);
  });

  let markdown = td.turndown(root.innerHTML);

  // Strip Mailchimp's "View this email in your browser" preheader line from the top.
  // It appears as a standalone line near the top of every campaign — remove it
  // wherever it appears (as a line, link, or short paragraph).
  markdown = markdown
    .split('\n')
    .filter(line => !/^\s*(\[)?view (this email )?in (your )?browser/i.test(line.trim()))
    .join('\n');

  // Strip footer at the markdown level. Only use markers that ONLY appear in the
  // footer — "view this email in your browser" is NOT included because Mailchimp
  // puts that link as a preheader at the very top of emails, which would cause
  // us to cut at position 0 and lose all content.
  const footerMarkers = [
    /unsubscribe from this list/i,
    /update subscription preferences/i,
    /update your preferences/i,
    /want to change how you receive/i,
    /why did i get this/i,
    /this email was sent to/i,
    /copyright ©/i,
    /our mailing address/i,
  ];
  let cutAt = markdown.length;
  for (const marker of footerMarkers) {
    const m = markdown.search(marker);
    if (m >= 0 && m < cutAt) cutAt = m;
  }
  markdown = markdown.slice(0, cutAt);

  return { markdown: cleanMarkdown(markdown), imageUrls: Array.from(new Set(imageUrls)) };
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

// ── Mailchimp + GitHub helpers ────────────────────────────────────────────────

export async function mcFetch(path: string) {
  const res = await fetch(`https://${MC_SERVER}.api.mailchimp.com/3.0${path}`, {
    headers: { Authorization: `apikey ${MC_KEY}` },
  });
  if (!res.ok) throw new Error(`Mailchimp API error ${res.status} for ${path}`);
  return res.json();
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

async function githubGetFile(path: string): Promise<{ text: string; sha: string } | null> {
  const url = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) return null;
  const data: any = await res.json();
  const text = Buffer.from(data.content, 'base64').toString('utf-8');
  return { text, sha: data.sha };
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
    const data: any = await existing.json();
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

export function extractDataField(body: any): Record<string, string> {
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
