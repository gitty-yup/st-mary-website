import type { NextApiRequest, NextApiResponse } from 'next';
import { processCampaign, extractDataField } from '@/lib/mailchimp-sync';

const WEBHOOK_SECRET = process.env.MAILCHIMP_WEBHOOK_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Mailchimp sends a GET to verify the endpoint is reachable
  if (req.method === 'GET') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  if (WEBHOOK_SECRET && req.query.secret !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const data = extractDataField(req.body);
  const type = req.body?.type;

  if (type !== 'campaign' || data?.status !== 'sent') {
    return res.status(200).json({ skipped: true, type, status: data?.status });
  }

  const campaignId = data.id;
  if (!campaignId) return res.status(400).json({ error: 'Missing campaign ID' });

  // Best-effort first attempt — if content isn't ready yet, the cron job will pick
  // it up within ~5 minutes and overwrite the placeholder with real content.
  const result = await processCampaign(campaignId);
  return res.status(200).json(result);
}
