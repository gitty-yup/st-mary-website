import type { NextApiRequest, NextApiResponse } from 'next';
import { clientIpHash, verifyTurnstile } from '@/lib/forms/spam';
import { sameOrigin } from '@/lib/office/auth';
import { SAME_DAY_CUTOFF_LABEL, cleanRequiem, parishToday, sameDayOpen, serviceDateProblem } from '@/lib/requiem/rules';
import { isSameDayToken, requiemNow } from '@/lib/requiem/sameDay';
import { recentRequiemCount } from '@/lib/requiem/store';
import { submitRequiem } from '@/lib/requiem/submit';

const MAX_PER_HOUR = 5;
/** With the office's same-day link: families at church share the parish Wi-Fi's one address. */
const MAX_PER_HOUR_SAME_DAY = 20;

export const config = { api: { bodyParser: { sizeLimit: '32kb' } } };

/**
 * Public Hokihankist (Requiem Service) request form. Saves the request, then emails Hayr
 * Eremia and the office and sends the family a receipt. With the office's same-day link
 * (`sameDay`), today may also be chosen on a Sunday or Merelots day until 1:00 pm.
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
    const now = requiemNow(req);
    const today = parishToday(now);
    const link = await isSameDayToken(req.body?.sameDay);
    const open = link && sameDayOpen(now) === today;
    const { data, errors } = cleanRequiem(req.body?.data, today, { sameDay: open });
    // Refused only because same-day requests are closed (after 1:00 pm)? Say so; other reasons (a feast) stand.
    if (link && !open && data.serviceDate === today && errors.serviceDate && !serviceDateProblem(today, today, { sameDay: true })) {
      errors.serviceDate = `Same-day requests can be made on Sundays and Merelots days until ${SAME_DAY_CUTOFF_LABEL}. Please see the parish office, or choose another day.`;
    }
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: errors.serviceDate ?? 'Please check the highlighted fields.', errors });
    }
    const ipHash = clientIpHash(req);
    if (ipHash && (await recentRequiemCount(ipHash)) >= (link ? MAX_PER_HOUR_SAME_DAY : MAX_PER_HOUR)) {
      return res.status(429).json({ error: 'Too many requests from this connection. Please try again later or call the parish office at 949.650.8367.' });
    }
    const sameDay = data.serviceDate === today;
    await submitRequiem(data, { source: 'online', sameDay, ipHash, by: 'website' });
    return res.status(200).json({ ok: true, serviceDate: data.serviceDate, sameDay });
  } catch (err) {
    console.error('[requiem]', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Something went wrong sending your request. Please try again, or call the parish office at 949.650.8367.' });
  }
}
