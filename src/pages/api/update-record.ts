import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/magicLink';
import { getRecord, updateRecord } from '@/lib/sheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token, data } = req.body ?? {};
  if (!token || !data) return res.status(400).json({ error: 'Missing token or data.' });

  let payload: ReturnType<typeof verifyToken>;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Link has expired or is invalid. Please request a new one.' });
  }

  // Verify the row's email still matches the token — prevents row-index tampering
  const current = await getRecord(payload.rowIndex);
  if (!current || current.Email.toLowerCase().trim() !== payload.email.toLowerCase().trim()) {
    return res.status(403).json({ error: 'Record mismatch. Please request a new link.' });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    await updateRecord(payload.rowIndex, { ...data, Last_Verified: today });
    return res.status(200).json({ message: 'Your information has been updated.' });
  } catch (err) {
    console.error('[update-record]', err);
    return res.status(500).json({ error: 'Update failed. Please try again.' });
  }
}
