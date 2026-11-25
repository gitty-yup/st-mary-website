import type { NextApiRequest, NextApiResponse } from 'next';
import { clientIpHash, verifyTurnstile } from '@/lib/forms/spam';
import { sameOrigin } from '@/lib/office/auth';
import { recordAudit } from '@/lib/office/audit';
import { sendRequiemNotice, sendRequiemReceipt } from '@/lib/office/email';
import { GIVE_ONLINE_URL, cleanRequiem, longDate, remembranceLabel } from '@/lib/requiem/rules';
import { createRequiemRequest, recentRequiemCount } from '@/lib/requiem/store';

const MAX_PER_HOUR = 5;

export const config = { api: { bodyParser: { sizeLimit: '32kb' } } };

/**
 * Public Hokihankist (Requiem Service) request form. Saves the request, then emails Hayr
 * Eremia and the office and sends the family a receipt. Email failures never lose a request:
 * it's already in the office list.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Cross-site request refused.' });
  res.setHeader('Cache-Control', 'no-store');

  // Honeypot: people never see this field; bots fill it. Pretend success.
  if (typeof req.body?.website === 'string' && req.body.website.trim()) return res.status(200).json({ ok: true });

  try {
    if (!(await verifyTurnstile(req.body?.turnstileToken, req))) {
      return res.status(400).json({ error: 'Please complete the “verify you are human” check and try again.', turnstile: true });
    }
    const { data, errors } = cleanRequiem(req.body?.data);
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: errors.serviceDate ?? 'Please check the highlighted fields.', errors });
    }
    const ipHash = clientIpHash(req);
    if (ipHash && (await recentRequiemCount(ipHash)) >= MAX_PER_HOUR) {
      return res.status(429).json({ error: 'Too many requests from this connection. Please try again later or call the parish office at 949.650.8367.' });
    }

    const request = await createRequiemRequest(data, ipHash);
    const when = longDate(data.serviceDate);
    const [notice, receipt] = await Promise.allSettled([
      sendRequiemNotice(data, when, remembranceLabel),
      sendRequiemReceipt(data, when, GIVE_ONLINE_URL),
    ]);
    for (const [label, r] of [['notice', notice], ['receipt', receipt]] as const) {
      if (r.status === 'rejected') console.error(`[requiem] ${label} email failed:`, r.reason instanceof Error ? r.reason.message : r.reason);
    }
    await recordAudit(null, 'website', 'requiem', {
      what: 'request',
      id: request.id,
      serviceDate: data.serviceDate,
      names: data.names.length,
      hokijash: data.hokijash,
      fellowship: data.fellowship,
      offering: data.offering,
      notice: notice.status === 'fulfilled' ? { sent: true, to: notice.value } : { sent: false },
      receipt: { sent: receipt.status === 'fulfilled' },
    });
    return res.status(200).json({ ok: true, serviceDate: data.serviceDate });
  } catch (err) {
    console.error('[requiem]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Something went wrong sending your request. Please try again, or call the parish office at 949.650.8367.' });
  }
}
