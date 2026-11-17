import type { NextApiRequest, NextApiResponse } from 'next';
import { sendReviewDigest } from '@/lib/office/email';
import { dailyPhotoJob } from '@/lib/gallery/sharing';

/**
 * Daily photo job, triggered by Vercel Cron (vercel.json): removes the files of shared
 * photos deleted over 30 days ago (or turned down), clears uploads that never finished,
 * and emails reviewers when shared photos are waiting. Outside production the email
 * goes to the parish office only. Needs "Authorization: Bearer <CRON_SECRET>".
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await dailyPhotoJob();
    let emailed: string[] = [];
    if (result.waiting.length) {
      emailed = process.env.VERCEL_ENV === 'production' ? result.reviewers : ['info@stmaryarmenianchurch.com'];
      await sendReviewDigest(emailed, result.waiting).catch((err) => {
        emailed = [];
        console.error('[photo job] reminder email failed:', err instanceof Error ? err.message : err);
      });
    }
    return res.status(200).json({ ok: true, removed: result.removed, cleared: result.cleared, waiting: result.waiting, emailed, reviewers: result.reviewers });
  } catch (err) {
    console.error('[photo job]', err instanceof Error ? err.message : err);
    return res.status(500).json({ ok: false });
  }
}
