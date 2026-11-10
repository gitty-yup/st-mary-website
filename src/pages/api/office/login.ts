import type { NextApiRequest, NextApiResponse } from 'next';
import { createLoginLink, sameOrigin } from '@/lib/office/auth';
import { sendLoginEmail } from '@/lib/office/email';

// Same answer whether or not the address is allowed, so the allowlist can't be probed.
const GENERIC_OK = { message: 'If that address is allowed to use the certificate office, a sign-in link is on its way.' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Cross-site request refused.' });
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email || email.length > 200 || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  try {
    const link = await createLoginLink(email);
    if (link) await sendLoginEmail(email, link);
    return res.status(200).json(GENERIC_OK);
  } catch (err) {
    console.error('[office login]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
