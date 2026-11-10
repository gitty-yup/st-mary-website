import { cleanOfficeData, findUnsupportedCharacters } from '@/certificates';
import { officeRoute } from '@/lib/office/api';
import { getAudit, getRecord, updateRecord } from '@/lib/office/records';

export default officeRoute(['GET', 'PUT'], async (req, res, session) => {
  const id = String(req.query.id);
  const record = await getRecord(id);
  if (!record) return res.status(404).json({ error: 'Record not found.' });

  if (req.method === 'GET') return res.status(200).json({ record, audit: await getAudit(id) });

  const version = Number(req.body?.version);
  const { data, errors } = cleanOfficeData(record.type, req.body?.data);
  const unsupported = await findUnsupportedCharacters(record.type, data);
  if (errors.length || unsupported.length) return res.status(400).json({ error: errors[0] ?? 'Unsupported characters.', errors, unsupported });
  const updated = await updateRecord(id, data, version, session.email);
  return res.status(200).json({ record: updated, audit: await getAudit(id) });
});
