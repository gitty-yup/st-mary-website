import type { NextApiRequest, NextApiResponse } from 'next';
import { syncRecentCampaigns } from '@/lib/mailchimp-sync';

// Triggered by Vercel Cron (see vercel.json). Polls Mailchimp for recent campaigns
// and fills in any blog posts that are missing or have empty bodies. Acts as a
// safety net if the immediate webhook attempt didn't capture content.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vercel adds an Authorization: Bearer <CRON_SECRET> header to cron requests.
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const results = await syncRecentCampaigns({ sinceHours: 72, max: 10 });
    return res.status(200).json({ ok: true, processed: results.length, results });
  } catch (err: any) {
    console.error('[sync-mailchimp] Error:', err);
    return res.status(500).json({ error: err?.message ?? 'Internal error' });
  }
}
