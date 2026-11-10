import type { NextApiRequest, NextApiResponse } from 'next';
import { endSession, sameOrigin } from '@/lib/office/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Cross-site request refused.' });
  try {
    await endSession(req, res);
  } catch (err) {
    console.error('[office logout]', err instanceof Error ? err.message : err);
  }
  return res.status(200).json({ ok: true });
}
