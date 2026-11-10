import { cleanOfficeData, renderCertificate, toCertificateData, type CertificateType } from '@/certificates';
import { officeRoute, sendPdf } from '@/lib/office/api';
import { getRecord, parishToday } from '@/lib/office/records';

/** Watermarked preview of unsaved form data. Nothing is stored. */
export default officeRoute(['POST'], async (req, res) => {
  const type = req.body?.type as CertificateType;
  if (type !== 'baptism' && type !== 'marriage') return res.status(400).json({ error: 'Unknown certificate type.' });
  const { data } = cleanOfficeData(type, req.body?.data);
  const record = typeof req.body?.id === 'string' ? await getRecord(req.body.id) : null;
  const bytes = await renderCertificate(
    type,
    toCertificateData(type, data, {
      registryNumber: record?.registryNumber,
      certificateDate: record?.certificateDate ?? parishToday(),
    }),
    { preview: true },
  );
  sendPdf(res, bytes, 'Certificate preview.pdf', false);
});
