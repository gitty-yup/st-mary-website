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

/**
 * `place`: what they're signing in to ("certificate office", "photo gallery" for gallery
 * editors, "photo review" for leaders), or null for people who only share photos.
 */
export async function sendLoginEmail(to: string, link: string, place: string | null = 'certificate office'): Promise<void> {
  const subject = place ? `Sign in to the St. Mary ${place}` : 'Sign in to share photos with St. Mary';
  const heading = place ? `${place[0].toUpperCase()}${place.slice(1)} sign-in` : 'Share photos';
  const lead = place ? 'Click the button to sign in.' : 'Click the button to sign in and send your photos.';
  await send({
    to: [to],
    subject,
    html: layout(
      heading,
      `<p style="margin:0 0 24px;">${lead}</p>
       ${button(link, 'Sign in')}
       <p style="margin:0;font-size:13px;color:#888;">The link works once and expires in <strong>${LOGIN_LINK_MINUTES} minutes</strong>. If you didn't ask to sign in, you can ignore this email.</p>`,
    ),
    text: `${place ? `Use this link to sign in to the St. Mary ${place}` : 'Use this link to sign in and share photos with St. Mary'}:\n\n${link}\n\nThe link works once and expires in ${LOGIN_LINK_MINUTES} minutes. If you didn't ask to sign in, you can ignore this email.`,
  });
}

// --- Photo sharing ---------------------------------------------------------------------

const testPrefix = () => (process.env.VERCEL_ENV === 'production' ? '' : '[TEST] ');

/** To someone the office added on Photos → People: what they can do and where. */
export async function sendPhotoInvitation(to: string, name: string, role: 'uploader' | 'leader'): Promise<void> {
  const share = `${siteBaseUrl()}/share-photos`;
  const review = `${siteBaseUrl()}/office/gallery/review`;
  const hello = `Dear ${name},`;
  const signIn = `To sign in, enter this email address (${to}) and we'll email you a link. There's no password.`;
  if (role === 'leader') {
    await send({
      to: [to],
      replyTo: OFFICE_ADDRESS,
      subject: `${testPrefix()}You're invited to review photos for St. Mary`,
      html: layout(
        'Review shared photos',
        `<p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
         <p style="margin:0 0 16px;">St. Mary Armenian Apostolic Church invites you to help look after the photo gallery on its website. When parishioners share photos, you can approve them for the gallery or turn them down. You can also share your own photos, which go straight into the gallery.</p>
         ${button(review, 'Review photos')}
         <p style="margin:0 0 16px;">To share photos, go to <a href="${escapeHtml(share)}">${escapeHtml(share.replace(/^https?:\/\//, ''))}</a>.</p>
         <p style="margin:0 0 16px;">${escapeHtml(signIn)} On days when photos are waiting, you'll get a short email.</p>
         <p style="margin:0;font-size:13px;color:#888;">Questions? Reply to this email or call the parish office at ${OFFICE_PHONE}.</p>`,
      ),
      text: `${hello}\n\nSt. Mary Armenian Apostolic Church invites you to help look after the photo gallery on its website. When parishioners share photos, you can approve them for the gallery or turn them down. You can also share your own photos, which go straight into the gallery.\n\nReview photos: ${review}\nShare photos: ${share}\n\n${signIn} On days when photos are waiting, you'll get a short email.\n\nQuestions? Reply to this email or call the parish office at ${OFFICE_PHONE}.`,
    });
    return;
  }
  await send({
    to: [to],
    replyTo: OFFICE_ADDRESS,
    subject: `${testPrefix()}You're invited to share photos with St. Mary`,
    html: layout(
      'Share your photos',
      `<p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
       <p style="margin:0 0 16px;">St. Mary Armenian Apostolic Church invites you to share your photos of parish life for the photo gallery on its website. You can send them straight from your phone.</p>
       ${button(share, 'Share photos')}
       <p style="margin:0 0 16px;">${escapeHtml(signIn)} The parish office looks at each photo before it appears in the gallery.</p>
       <p style="margin:0;font-size:13px;color:#888;">Questions? Reply to this email or call the parish office at ${OFFICE_PHONE}.</p>`,
    ),
    text: `${hello}\n\nSt. Mary Armenian Apostolic Church invites you to share your photos of parish life for the photo gallery on its website. You can send them straight from your phone:\n\n${share}\n\n${signIn} The parish office looks at each photo before it appears in the gallery.\n\nQuestions? Reply to this email or call the parish office at ${OFFICE_PHONE}.`,
  });
}

/** The daily note to reviewers when shared photos are waiting. */
export async function sendReviewDigest(to: string[], waiting: { from: string; photos: number }[]): Promise<void> {
  const total = waiting.reduce((n, w) => n + w.photos, 0);
  const url = `${siteBaseUrl()}/office/gallery/review`;
  const lines = waiting.map((w) => `${w.from}: ${w.photos} ${w.photos === 1 ? 'photo' : 'photos'}`);
  const what = total === 1 ? '1 shared photo is' : `${total} shared photos are`;
  await send({
    to,
    subject: `${testPrefix()}${total === 1 ? '1 photo' : `${total} photos`} waiting for review`,
    html: layout(
      'Photos waiting for review',
      `<p style="margin:0 0 16px;">${what} waiting for someone to approve them for the gallery or turn them down.</p>
       <ul style="margin:0 0 24px;padding-left:20px;">${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>
       ${button(url, 'Review photos')}
       <p style="margin:0;font-size:13px;color:#888;">Any one reviewer is enough; this email comes on days when photos are waiting.</p>`,
    ),
    text: `${what} waiting for someone to approve them for the gallery or turn them down.\n\n${lines.join('\n')}\n\nReview photos: ${url}\n\nAny one reviewer is enough; this email comes on days when photos are waiting.`,
  });
}

// --- Backups --------------------------------------------------------------------------

/** To the parish office when the nightly backup fails. */
export async function sendBackupFailureEmail(error: string): Promise<void> {
  const url = `${siteBaseUrl()}/office/backup`;
  await send({
    to: [OFFICE_ADDRESS],
    subject: 'Certificate records backup failed',
    html: layout(
      'Backup failed',
      `<p style="margin:0 0 16px;">Last night's backup of the certificate records to Google Sheets did not complete:</p>
       <p style="margin:0 0 24px;padding:12px 16px;background:#faf7f5;border-left:3px solid #C84B2F;">${escapeHtml(error)}</p>
       ${button(url, 'Open backup page')}
       <p style="margin:0;font-size:13px;color:#888;">The records themselves are safe in the database. You can retry from the backup page.</p>`,
    ),
    text: `Last night's backup of the certificate records to Google Sheets did not complete:\n\n${error}\n\nRetry from the backup page: ${url}\n\nThe records themselves are safe in the database.`,
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
 * From the office to the family: what's still needed. The message is written
 * by signed-in office staff. Outside production it goes to the office address
 * instead (preview databases can hold copies of real families' records).
 */
export async function sendNeedsInfoEmail(r: {
  type: CertificateType;
  sacramentDate: string;
  contactName: string | null;
  contactEmail: string;
  message: string;
}): Promise<{ to: string; test: boolean }> {
  const test = process.env.VERCEL_ENV !== 'production';
  const to = test ? OFFICE_ADDRESS : r.contactEmail;
  const kind = KIND[r.type];
  const date = formatCertificateDate(r.sacramentDate);
  const about = `your ${kind} information${date ? ` (${kind} on ${date})` : ''}`;
  const greeting = r.contactName ? `Dear ${r.contactName},` : 'Hello,';
  const testNote = test ? `[Test site: this would have gone to the family's address.]\n\n` : '';
  const paragraphs = r.message.split(/\n{2,}/).map((p) => `<p style="margin:0 0 16px;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
  await send({
    to: [to],
    replyTo: OFFICE_ADDRESS,
    subject: `${test ? '[TEST] ' : ''}About ${about}`,
    html: layout(
      'A little more information, please',
      `${test ? `<p style="margin:0 0 16px;color:#C84B2F;">${escapeHtml(testNote.trim())}</p>` : ''}
       <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
       <p style="margin:0 0 16px;">Thank you for submitting ${escapeHtml(about)}. Before we can prepare the church records and certificate, we need the following:</p>
       <div style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #C84B2F;background:#faf7f5;">${paragraphs}</div>
       <p style="margin:0;">Please reply to this email or call the parish office at ${OFFICE_PHONE}.</p>`,
    ),
    text: `${testNote}${greeting}\n\nThank you for submitting ${about}. Before we can prepare the church records and certificate, we need the following:\n\n${r.message}\n\nPlease reply to this email or call the parish office at ${OFFICE_PHONE}.`,
  });
  return { to, test };
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
      `<p style="margin:0 0 16px;">We received the ${kind} information you submitted${escapeHtml(when)}. Hayr Eremia and the parish office will use it to prepare the church records and certificate.</p>
       <p style="margin:0 0 16px;">If anything needs to change, or if you have questions, reply to this email or call the parish office at ${OFFICE_PHONE}.</p>
       <p style="margin:0;font-size:13px;color:#888;">If you didn't submit this, please let us know by replying to this email.</p>`,
    ),
    text: `We received the ${kind} information you submitted${when}. Hayr Eremia and the parish office will use it to prepare the church records and certificate.\n\nIf anything needs to change, or if you have questions, reply to this email or call the parish office at ${OFFICE_PHONE}.\n\nIf you didn't submit this, please let us know by replying to this email.`,
  });
}

// --- Hokihankist (Requiem Service) requests ---------------------------------------------

export interface RequiemSummary {
  serviceDate: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  others: string;
  names: { name: string; relationship: string; occasion: string; anniversary: string; details: string }[];
  newsletter: boolean;
  hokijash: boolean;
  fellowship: boolean;
  arrangements: string;
  offering: string;
}

/** "a Hokijash (memorial meal) and sponsoring the fellowship hour", or '' if neither. */
function requiemArrangements(r: RequiemSummary): string {
  const wanted = [r.hokijash && 'a Hokijash (memorial meal)', r.fellowship && 'sponsoring the Sunday fellowship hour'].filter(Boolean);
  return wanted.join(' and ');
}

/**
 * Who hears about a new request: Hayr Eremia and the parish office. Outside production only
 * the office address (marked [TEST]), so trying the form on a preview never emails Hayr Eremia.
 */
function requiemRecipients(): { to: string[]; test: boolean } {
  const production = process.env.VERCEL_ENV === 'production';
  const fallback = production ? `freremia@gmail.com,${OFFICE_ADDRESS}` : OFFICE_ADDRESS;
  return { to: (process.env.REQUIEM_NOTIFY_TO ?? fallback).split(',').map((s) => s.trim()).filter(Boolean), test: !production };
}

/** To Hayr Eremia and the office: the whole request (replying writes to the family). Returns who it went to. */
export async function sendRequiemNotice(
  r: RequiemSummary,
  when: string,
  occasion: (n: RequiemSummary['names'][number]) => string,
): Promise<string[]> {
  const { to, test } = requiemRecipients();
  const first = r.names[0]?.name ?? '';
  const more = r.names.length > 1 ? ` and ${r.names.length - 1} more` : '';
  const arrange = requiemArrangements(r);
  const subject = `${test ? '[TEST] ' : ''}Hokihankist request for ${when}: ${first}${more}${arrange ? ' (arrangements requested)' : ''}`;
  const url = `${siteBaseUrl()}/office/requiem`;
  const td = (v: string, style = '') => `<td style="padding:4px 12px 4px 0;vertical-align:top;${style}">${escapeHtml(v)}</td>`;
  const names = r.names
    .map((n) => `<tr>${td(n.name, 'font-weight:600;')}${td(n.relationship)}${td(occasion(n), 'color:#666;')}</tr>`)
    .join('');
  const offering = r.offering === 'online' ? 'Online (shown the giving link)' : r.offering === 'church' ? 'At church on Sunday' : 'Not mentioned';
  const rows: [string, string][] = [
    ['Requested by', r.name],
    ['Phone', r.phone],
    ['Email', r.email],
    ['Address', `${r.address}, ${r.city}, ${r.state} ${r.zip}`],
    ...(r.others ? ([['Others requesting', r.others]] as [string, string][]) : []),
    ['Memorial offering', offering],
    ['Newsletter', r.newsletter ? 'Yes, please add them' : 'No'],
  ];
  const arrangeHtml = arrange
    ? `<div style="margin:0 0 20px;padding:12px 16px;background:#FFF5F2;border-left:4px solid #C84B2F;">
         <p style="margin:0;"><strong>Please contact the family</strong> to arrange ${escapeHtml(arrange)}.</p>
         ${r.arrangements ? `<p style="margin:8px 0 0;color:#555;">“${escapeHtml(r.arrangements)}”</p>` : ''}
       </div>`
    : '';
  const arrangeText = arrange ? `PLEASE CONTACT THE FAMILY to arrange ${arrange}.${r.arrangements ? `\nTheir note: ${r.arrangements}` : ''}\n\n` : '';
  const table = rows
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#888;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`)
    .join('');
  await send({
    to,
    replyTo: r.email,
    subject,
    html: layout(
      'Hokihankist request',
      `<p style="margin:0 0 8px;">A Hokihankist was requested through the website for <strong>${escapeHtml(when)}</strong>, in memory of:</p>
       <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;font-size:15px;">${names}</table>
       ${arrangeHtml}
       <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;font-size:15px;">${table}</table>
       ${button(url, 'See all requests')}
       <p style="margin:0;font-size:13px;color:#888;">Reply to this email to write to ${escapeHtml(r.name)}.</p>`,
    ),
    text: `A Hokihankist was requested through the website for ${when}, in memory of:\n\n${r.names
      .map((n) => `- ${n.name} (${n.relationship}), ${occasion(n)}`)
      .join('\n')}\n\n${arrangeText}${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nSee all requests (sign-in required):\n${url}\n\nReply to this email to write to ${r.name}.`,
  });
  return to;
}

/** To the family: we received it (and, if they chose to give online, the link). */
export async function sendRequiemReceipt(r: RequiemSummary, when: string, giveUrl: string): Promise<void> {
  const list = r.names.map((n) => n.name).join(', ');
  const arrange = requiemArrangements(r);
  const arrangeLine = arrange ? `Someone from the church will contact you to arrange ${arrange}.` : '';
  const giveLine = r.offering === 'online' ? 'If you haven’t yet, you can make your memorial offering online:' : '';
  await send({
    to: [r.email],
    replyTo: OFFICE_ADDRESS,
    subject: `We received your Hokihankist request for ${when}`,
    html: layout(
      'Thank you',
      `<p style="margin:0 0 16px;">We received your request for a Hokihankist (Requiem Service) on <strong>${escapeHtml(when)}</strong>, at the conclusion of the Divine Liturgy, in memory of ${escapeHtml(list)}.</p>
       ${arrangeLine ? `<p style="margin:0 0 16px;">${escapeHtml(arrangeLine)}</p>` : ''}
       ${giveLine ? `<p style="margin:0 0 12px;">${escapeHtml(giveLine)}</p>${button(giveUrl, 'Give online')}` : ''}
       <p style="margin:0 0 16px;">If anything needs to change, reply to this email or call the parish office at ${OFFICE_PHONE}.</p>
       <p style="margin:0 0 16px;font-style:italic;">May God grant light to their souls.</p>
       <p style="margin:0;font-size:13px;color:#888;">If you didn't send this request, please let us know by replying to this email.</p>`,
    ),
    text: `We received your request for a Hokihankist (Requiem Service) on ${when}, at the conclusion of the Divine Liturgy, in memory of ${list}.\n\n${
      arrangeLine ? `${arrangeLine}\n\n` : ''
    }${giveLine ? `${giveLine} ${giveUrl}\n\n` : ''}If anything needs to change, reply to this email or call the parish office at ${OFFICE_PHONE}.\n\nMay God grant light to their souls.\n\nIf you didn't send this request, please let us know by replying to this email.`,
  });
}
