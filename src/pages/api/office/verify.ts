import type { NextApiRequest, NextApiResponse } from 'next';
import { redeemLoginToken, sameOrigin } from '@/lib/office/auth';

// POST only: email security scanners follow GET links, which would use up a
// single-use token before the person clicks it.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Cross-site request refused.' });
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  try {
    const session = await redeemLoginToken(token, res);
    if (!session) {
      return res.status(401).json({ error: 'This sign-in link has expired or was already used. Please request a new one.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[office verify]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
