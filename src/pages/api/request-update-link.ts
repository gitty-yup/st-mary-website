import type { NextApiRequest, NextApiResponse } from 'next';
import { findByEmail } from '@/lib/sheets';
import { signToken } from '@/lib/magicLink';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const SITE_URL = process.env.SITE_URL ?? 'https://www.stmaryarmenianchurch.com';
const FROM = 'St. Mary Armenian Apostolic Church <info@stmaryarmenianchurch.com>';

function buildEmailHtml(links: { name: string; url: string }[]): string {
  const linkRows = links.map(({ name, url }) =>
    links.length === 1
      ? `<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#C84B2F;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Update My Information</a></p>`
      : `<p style="margin:0 0 16px;font-size:15px;color:#1a1a2e;"><strong>${name}</strong><br>
         <a href="${url}" style="color:#C84B2F;font-weight:600;">Update ${name.split(' ')[0]}'s information →</a></p>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1B2A4A;padding:28px 32px;">
          <p style="margin:0;color:#C84B2F;font-style:italic;font-size:14px;">St. Mary Armenian Apostolic Church</p>
          <h1 style="margin:4px 0 0;color:#fff;font-size:22px;">Update Your Parish Information</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 20px;font-size:15px;color:#333;line-height:1.6;">
            We received a request to update parish records for this email address.
            ${links.length > 1
              ? 'We found <strong>multiple records</strong> associated with your email. Please click the link next to your name:'
              : 'Click the button below to open your pre-filled information form.'}
          </p>
          ${linkRows}
          <p style="margin:0 0 8px;font-size:13px;color:#888;">This link expires in <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="background:#f9f9f9;padding:20px 32px;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
            St. Mary Armenian Apostolic Church · 148 22nd Street, Costa Mesa, CA 92627
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const email = (req.body?.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Always return the same response — don't reveal whether the email exists
  const GENERIC_OK = { message: 'If this email is registered, you will receive a link shortly.' };

  try {
    const records = await findByEmail(email);
    if (records.length === 0) return res.status(200).json(GENERIC_OK);

    const links = records.map((r) => ({
      name: [r.First_Name, r.Last_Name].filter(Boolean).join(' ') || 'Parishioner',
      url: `${SITE_URL}/update-my-info/form?token=${signToken({ email: r.Email, rowIndex: r.rowIndex })}`,
    }));

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Update your St. Mary parish information',
      html: buildEmailHtml(links),
    });

    return res.status(200).json(GENERIC_OK);
  } catch (err) {
    console.error('[request-update-link]', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
