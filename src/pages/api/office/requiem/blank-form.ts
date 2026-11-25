import { officeRoute, sendPdf } from '@/lib/office/api';
import { renderBlankRequiemForm } from '@/lib/requiem/pdf';

/** GET: the blank paper Hokihankist request form, to print. Office only. */
export default officeRoute(['GET'], async (_req, res) => {
  sendPdf(res, await renderBlankRequiemForm(), 'Hokihankist request form.pdf', false);
});
