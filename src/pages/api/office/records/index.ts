import { cleanOfficeData, emptyOfficeData, findUnsupportedCharacters, type CertificateType } from '@/certificates';
import { officeRoute } from '@/lib/office/api';
import { createRecord, listRecords } from '@/lib/office/records';

export default officeRoute(['GET', 'POST'], async (req, res, session) => {
  if (req.method === 'GET') return res.status(200).json({ records: await listRecords() });

  const type = req.body?.type as CertificateType;
  if (type !== 'baptism' && type !== 'marriage') return res.status(400).json({ error: 'Unknown certificate type.' });
  // Fields left out entirely get the parish defaults (officiant, church, city…).
  const input = req.body?.data && typeof req.body.data === 'object' ? req.body.data : {};
  const { data, errors } = cleanOfficeData(type, { ...emptyOfficeData(type), ...input });
  const unsupported = await findUnsupportedCharacters(type, data);
  if (errors.length || unsupported.length) return res.status(400).json({ error: errors[0] ?? 'Unsupported characters.', errors, unsupported });
  const record = await createRecord(type, data, session.email);
  return res.status(201).json({ record });
});
