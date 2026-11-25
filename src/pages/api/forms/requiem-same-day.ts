import type { NextApiRequest, NextApiResponse } from 'next';
import { SAME_DAY_CUTOFF_LABEL, sameDayOpen } from '@/lib/requiem/rules';
import { isSameDayToken, requiemNow } from '@/lib/requiem/sameDay';

/**
 * GET ?t= : whether the office's same-day link is valid, and if so whether a request for today
 * can be made right now. { valid, today (or null), cutoff }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Cache-Control', 'no-store');
  try {
    const valid = await isSameDayToken(req.query.t);
    return res.status(200).json({ valid, today: valid ? sameDayOpen(requiemNow(req)) : null, cutoff: SAME_DAY_CUTOFF_LABEL });
  } catch (err) {
    console.error('[requiem same-day]', err instanceof Error ? err.message : err);
    return res.status(200).json({ valid: false, today: null, cutoff: SAME_DAY_CUTOFF_LABEL });
  }
}
