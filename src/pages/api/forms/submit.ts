import type { NextApiRequest, NextApiResponse } from 'next';
import { SACRAMENT_DATE_FIELD, displayName, findUnsupportedCharacters, type CertificateType } from '@/certificates';
import { cleanIntake, intakeLabel, intakeToOfficeData, printedIntakeKeys } from '@/certificates/intake';
import { clientIpHash, verifyTurnstile } from '@/lib/forms/spam';
import { sameOrigin } from '@/lib/office/auth';
import { recordAudit } from '@/lib/office/audit';
import { sendSubmissionConfirmation, sendSubmissionNotice, type SubmissionSummary } from '@/lib/office/email';
import { createSubmission, recentSubmissionCount } from '@/lib/office/records';

const MAX_PER_HOUR = 5;

export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };

/**
 * Public baptism/marriage information form. Saves the submission, then emails
 * the priest (CC parish council) and sends the family a receipt. Email
 * failures never lose a submission: it is already in the office list.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Cross-site request refused.' });
  res.setHeader('Cache-Control', 'no-store');

  const type = req.body?.type as CertificateType;
  if (type !== 'baptism' && type !== 'marriage') return res.status(400).json({ error: 'Unknown form.' });

  // Honeypot: people never see this field; bots fill it. Pretend success.
  if (typeof req.body?.website === 'string' && req.body.website.trim()) return res.status(200).json({ ok: true });

  try {
    if (!(await verifyTurnstile(req.body?.turnstileToken, req))) {
      return res.status(400).json({ error: 'Please complete the “verify you are human” check and try again.', turnstile: true });
    }

    const { data, errors } = cleanIntake(type, req.body?.data);
    const printed = Object.fromEntries(printedIntakeKeys(type).map((k) => [k, data[k] ?? '']));
    for (const u of await findUnsupportedCharacters(type, printed)) {
      errors[u.key] ??= `These characters can’t be printed on the certificate: ${u.characters.join(' ')}`;
    }
    if (Object.keys(errors).length) {
      const first = Object.keys(errors)[0];
      return res.status(400).json({ error: `Please check ${intakeLabel(type, first).toLowerCase()}.`, errors });
    }

    const ipHash = clientIpHash(req);
    if (ipHash && (await recentSubmissionCount(ipHash)) >= MAX_PER_HOUR) {
      return res.status(429).json({ error: 'Too many submissions from this connection. Please try again later or call the parish office.' });
    }

    const officeData = intakeToOfficeData(type, data);
    const record = await createSubmission(type, data, officeData, ipHash);

    const summary: SubmissionSummary = {
      id: record.id,
      type,
      name: displayName(type, officeData),
      sacramentDate: data[SACRAMENT_DATE_FIELD[type]] ?? '',
      contactName: data.contact_name,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
    };
    const [notice, receipt] = await Promise.allSettled([sendSubmissionNotice(summary), sendSubmissionConfirmation(summary)]);
    for (const [label, r] of [['notice', notice], ['receipt', receipt]] as const) {
      if (r.status === 'rejected') console.error(`[forms submit] ${label} email failed:`, r.reason instanceof Error ? r.reason.message : r.reason);
    }
    await recordAudit(record.id, 'website', 'notify', {
      notice: notice.status === 'fulfilled' ? { sent: true, to: notice.value } : { sent: false },
      receipt: { sent: receipt.status === 'fulfilled' },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[forms submit]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Something went wrong saving your information. Please try again, or call the parish office at 949.650.8367.' });
  }
}
