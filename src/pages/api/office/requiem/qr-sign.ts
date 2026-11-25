import { officeRoute, sendPdf } from '@/lib/office/api';
import { renderSameDaySign } from '@/lib/requiem/pdf';
import { sameDayToken, sameDayUrl } from '@/lib/requiem/sameDay';

/** GET: the sign with the same-day QR code, to print and put up in the office. Office only. */
export default officeRoute(['GET'], async (_req, res) => {
  sendPdf(res, await renderSameDaySign(sameDayUrl(await sameDayToken())), 'Same-day Hokihankist sign.pdf', false);
});
