import { officeRoute } from '@/lib/office/api';
import { recordAudit } from '@/lib/office/audit';
import { replaceSameDayToken, sameDayUrl } from '@/lib/requiem/sameDay';

/**
 * POST: replaces the same-day QR code's secret. Every printed sign and shared link stops
 * working; the office prints a new sign. Office only.
 */
export default officeRoute(['POST'], async (_req, res, session) => {
  const url = sameDayUrl(await replaceSameDayToken());
  await recordAudit(null, session.email, 'requiem', { what: 'replace same-day QR code' });
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, url });
});
