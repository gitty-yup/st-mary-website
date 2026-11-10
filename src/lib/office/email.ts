import { Resend } from 'resend';
import { LOGIN_LINK_MINUTES } from '@/lib/office/auth';

const FROM = 'St. Mary Armenian Apostolic Church <info@stmaryarmenianchurch.com>';

export async function sendLoginEmail(to: string, link: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[office] RESEND_API_KEY not set; sign-in link for local development:\n${link}`);
      return;
    }
    throw new Error('RESEND_API_KEY is not configured.');
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Sign in to the St. Mary certificate office',
    html: loginEmailHtml(link),
    text: `Use this link to sign in to the St. Mary certificate office:\n\n${link}\n\nThe link works once and expires in ${LOGIN_LINK_MINUTES} minutes. If you didn't ask to sign in, you can ignore this email.`,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

function loginEmailHtml(link: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1B2A4A;padding:28px 32px;">
          <p style="margin:0;color:#C84B2F;font-style:italic;font-size:14px;">St. Mary Armenian Apostolic Church</p>
          <h1 style="margin:4px 0 0;color:#fff;font-size:22px;">Certificate office sign-in</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.6;">Click the button to sign in.</p>
          <p style="margin:0 0 24px"><a href="${link}" style="display:inline-block;background:#C84B2F;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Sign in</a></p>
          <p style="margin:0;font-size:13px;color:#888;">The link works once and expires in <strong>${LOGIN_LINK_MINUTES} minutes</strong>. If you didn't ask to sign in, you can ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
