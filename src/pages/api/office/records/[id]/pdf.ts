import { certificateFilename, renderCertificate, toCertificateData } from '@/certificates';
import { officeRoute, sendPdf } from '@/lib/office/api';
import { recordAudit } from '@/lib/office/audit';
import { getRecord, parishToday } from '@/lib/office/records';

/**
 * The saved record as a PDF. Issued records print clean (unless ?preview=1);
 * anything not yet issued always carries the PREVIEW watermark.
 * ?download=1 sends it as a file instead of opening it in the browser.
 */
export default officeRoute(['GET'], async (req, res, session) => {
  const record = await getRecord(String(req.query.id));
  if (!record) return res.status(404).json({ error: 'Record not found.' });
  const issued = record.status === 'issued' && !!record.registryNumber;
  const preview = !issued || req.query.preview === '1';
  const data = toCertificateData(record.type, record.officeData, {
    registryNumber: record.registryNumber,
    certificateDate: record.certificateDate ?? parishToday(),
  });
  const voided = record.status === 'voided';
  const bytes = await renderCertificate(record.type, data, { preview, watermark: voided ? 'VOID - NOT VALID' : undefined });
  if (!preview) await recordAudit(record.id, session.email, 'download');
  sendPdf(res, bytes, (voided ? 'VOID - ' : preview ? 'PREVIEW - ' : '') + certificateFilename(record.type, data), req.query.download === '1');
});
