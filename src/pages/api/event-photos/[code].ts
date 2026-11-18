import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyTurnstile } from '@/lib/forms/spam';
import { sameOrigin } from '@/lib/office/auth';
import { RecordError } from '@/lib/office/records';
import { closedMessage, linkByCode, linkSender, passCookie, startPass } from '@/lib/gallery/links';
import { finishUpload, startUpload } from '@/lib/gallery/sharing';

// Preparing a large photo (download from storage, resize twice, upload two copies) takes a few seconds.
export const config = { maxDuration: 60 };

/**
 * Sending photos with an event link (no sign-in; every photo waits for review):
 *   POST { action: 'begin', name, turnstileToken } → { name }, and sets the pass cookie;
 *   POST { action: 'start', name, size, type, batchId, caption? } → { id, url, contentType }
 *     then PUT the file to `url` with that Content-Type (straight to storage);
 *   POST { action: 'finish', id } → { id, status: 'pending', thumb }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Cross-site request refused.' });
  const code = String(req.query.code ?? '');
  const body = req.body ?? {};
  try {
    if (body.action === 'begin') {
      const link = await linkByCode(code);
      if (!link) return res.status(404).json({ error: 'This link doesn’t work. Check it was copied in full.' });
      if (link.state !== 'open') return res.status(410).json({ error: closedMessage(link) });
      // People never see this field; bots fill it in.
      if (typeof body.website === 'string' && body.website.trim()) return res.status(400).json({ error: 'Please try again.' });
      if (!(await verifyTurnstile(body.turnstileToken, req))) {
        return res.status(400).json({ error: 'Please complete the “verify you are human” check and try again.', turnstile: true });
      }
      const pass = await startPass(link, body.name);
      res.setHeader('Set-Cookie', passCookie(pass.token, pass.seconds));
      return res.status(200).json({ name: pass.name });
    }

    const found = await linkSender(code, req.headers.cookie);
    if (!found) return res.status(401).json({ error: 'This page has been open a long time. Reload it to keep sending photos.' });
    if (body.action === 'start') {
      if (found.link.state !== 'open') return res.status(410).json({ error: closedMessage(found.link) });
      return res.status(200).json(await startUpload(found.sender, body));
    }
    if (body.action === 'finish') return res.status(200).json(await finishUpload(found.sender, body.id));
    return res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    if (err instanceof RecordError) return res.status(err.status).json({ error: err.message });
    console.error('[event photos]', err instanceof Error ? err.message : err);
    if (!res.headersSent) res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
