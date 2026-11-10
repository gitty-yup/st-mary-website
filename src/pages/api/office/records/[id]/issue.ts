import { findUnsupportedCharacters } from '@/certificates';
import { officeRoute } from '@/lib/office/api';
import { getAudit, getRecord, issueRecord } from '@/lib/office/records';

export default officeRoute(['POST'], async (req, res, session) => {
  const id = String(req.query.id);
  const record = await getRecord(id);
  if (!record) return res.status(404).json({ error: 'Record not found.' });
  const unsupported = await findUnsupportedCharacters(record.type, record.officeData);
  if (unsupported.length) return res.status(400).json({ error: 'Unsupported characters.', unsupported });
  const issued = await issueRecord(id, Number(req.body?.version), session.email);
  return res.status(200).json({ record: issued, audit: await getAudit(id) });
});
