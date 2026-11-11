import type { NextApiRequest, NextApiResponse } from 'next';
import { backupConfigured, runBackup } from '@/lib/office/backup';
import { sendBackupFailureEmail } from '@/lib/office/email';

/**
 * Nightly certificate backup, triggered by Vercel Cron (vercel.json). Vercel
 * sends "Authorization: Bearer <CRON_SECRET>"; without CRON_SECRET set, the
 * route refuses every request.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' });

  // Not set up yet: nothing to do (the office backup page explains the setup).
  if (!backupConfigured()) return res.status(200).json({ ok: true, skipped: 'not configured' });

  const result = await runBackup('nightly backup');
  if (!result.ok) {
    console.error('[certificate-backup]', result.error);
    await sendBackupFailureEmail(result.error ?? 'Unknown error').catch((err) =>
      console.error('[certificate-backup] failure email failed:', err instanceof Error ? err.message : err),
    );
  }
  return res.status(result.ok ? 200 : 500).json({ ok: result.ok, counts: result.counts });
}
