import { Resend } from 'resend';
import { formatCertificateDate } from '@/certificates/fields';
import type { CertificateType } from '@/certificates/types';
import { LOGIN_LINK_MINUTES, siteBaseUrl } from '@/lib/office/auth';

const FROM = 'St. Mary Armenian Apostolic Church <info@stmaryarmenianchurch.com>';
const OFFICE_ADDRESS = 'info@stmaryarmenianchurch.com';
const OFFICE_PHONE = '949.650.8367';

interface Message {
  to: string[];
  cc?: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

async function send(message: Message): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email] RESEND_API_KEY not set; would send "${message.subject}" to ${message.to.join(', ')}${message.cc ? ` cc ${message.cc.join(', ')}` : ''}\n${message.text}`);
      return;
    }
    throw new Error('RESEND_API_KEY is not configured.');
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM, ...message });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Shared branded layout (same look as the "update my info" emails). Body HTML must be pre-escaped. */
function layout(heading: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#1B2A4A;padding:28px 32px;">
          <p style="margin:0;color:#C84B2F;font-style:italic;font-size:14px;">St. Mary Armenian Apostolic Church</p>
          <h1 style="margin:4px 0 0;color:#fff;font-size:22px;">${escapeHtml(heading)}</h1>
        </td></tr>
        <tr><td style="padding:32px;font-size:15px;color:#333;line-height:1.6;">${bodyHtml}</td></tr>
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

function button(href: string, label: string): string {
  return `<p style="margin:0 0 24px"><a href="${escapeHtml(href)}" style="display:inline-block;background:#C84B2F;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">${escapeHtml(label)}</a></p>`;
}

// --- Office sign-in ----------------------------------------------------------------

export async function sendLoginEmail(to: string, link: string): Promise<void> {
  await send({
    to: [to],
    subject: 'Sign in to the St. Mary certificate office',
    html: layout(
      'Certificate office sign-in',
      `<p style="margin:0 0 24px;">Click the button to sign in.</p>
       ${button(link, 'Sign in')}
       <p style="margin:0;font-size:13px;color:#888;">The link works once and expires in <strong>${LOGIN_LINK_MINUTES} minutes</strong>. If you didn't ask to sign in, you can ignore this email.</p>`,
    ),
    text: `Use this link to sign in to the St. Mary certificate office:\n\n${link}\n\nThe link works once and expires in ${LOGIN_LINK_MINUTES} minutes. If you didn't ask to sign in, you can ignore this email.`,
  });
}

// --- Online submissions -------------------------------------------------------------

export interface SubmissionSummary {
  id: string;
  type: CertificateType;
  name: string;
  sacramentDate: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

const KIND: Record<CertificateType, string> = { baptism: 'baptism', marriage: 'marriage' };

/**
 * Recipients for new-submission notices. Only production emails the priest
 * and parish council; preview/test deployments notify the office address
 * alone (override with CERTIFICATE_NOTIFY_TO / CERTIFICATE_NOTIFY_CC).
 */
function noticeRecipients(): { to: string[]; cc: string[]; test: boolean } {
  const list = (v: string | undefined, fallback: string) =>
    (v ?? fallback).split(',').map((s) => s.trim()).filter(Boolean);
  const production = process.env.VERCEL_ENV === 'production';
  return {
    to: list(process.env.CERTIFICATE_NOTIFY_TO, production ? 'freremia@gmail.com' : OFFICE_ADDRESS),
    cc: list(process.env.CERTIFICATE_NOTIFY_CC, production ? OFFICE_ADDRESS : ''),
    test: !production,
  };
}

/** To the priest, CC the parish council: a short summary and a link to the record. */
export async function sendSubmissionNotice(s: SubmissionSummary): Promise<string[]> {
  const { to, cc, test } = noticeRecipients();
  const url = `${siteBaseUrl()}/office/records/${s.id}`;
  const date = formatCertificateDate(s.sacramentDate);
  const kind = KIND[s.type];
  const subject = `${test ? '[TEST] ' : ''}New ${kind} information: ${s.name}${date ? ` (${date})` : ''}`;
  const rows: [string, string][] = [
    [s.type === 'marriage' ? 'Couple' : 'Name', s.name],
    [`Date of ${kind}`, date || 'not given'],
    ['Submitted by', s.contactName],
    ['Email', s.contactEmail],
    ['Phone', s.contactPhone],
  ];
  const table = rows
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#888;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`)
    .join('');
  await send({
    to,
    cc: cc.length ? cc : undefined,
    replyTo: s.contactEmail || undefined,
    subject,
    html: layout(
      `New ${kind} information`,
      `<p style="margin:0 0 16px;">A family submitted ${kind} information through the website.</p>
       <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;font-size:15px;">${table}</table>
       ${button(url, 'Review in the certificate office')}
       <p style="margin:0;font-size:13px;color:#888;">Full details (dates and places of birth, parents, addresses) are in the certificate office, which requires signing in. Reply to this email to write to the family.</p>`,
    ),
    text: `A family submitted ${kind} information through the website.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nReview in the certificate office (sign-in required):\n${url}\n\nReply to this email to write to the family.`,
  });
  return [...to, ...cc];
}

/**
 * To the family: receipt only. Deliberately echoes nothing they typed except
 * the date, so the form can't be used to send arbitrary text to arbitrary
 * addresses.
 */
export async function sendSubmissionConfirmation(s: SubmissionSummary): Promise<void> {
  const kind = KIND[s.type];
  const date = formatCertificateDate(s.sacramentDate);
  const when = date ? ` for the ${kind} on ${date}` : '';
  await send({
    to: [s.contactEmail],
    replyTo: OFFICE_ADDRESS,
    subject: `We received your ${kind} information`,
    html: layout(
      'Thank you',
      `<p style="margin:0 0 16px;">We received the ${kind} information you submitted${escapeHtml(when)}. Father Eremia and the parish office will use it to prepare the church records and certificate.</p>
       <p style="margin:0 0 16px;">If anything needs to change, or if you have questions, reply to this email or call the parish office at ${OFFICE_PHONE}.</p>
       <p style="margin:0;font-size:13px;color:#888;">If you didn't submit this, please let us know by replying to this email.</p>`,
    ),
    text: `We received the ${kind} information you submitted${when}. Father Eremia and the parish office will use it to prepare the church records and certificate.\n\nIf anything needs to change, or if you have questions, reply to this email or call the parish office at ${OFFICE_PHONE}.\n\nIf you didn't submit this, please let us know by replying to this email.`,
  });
}
