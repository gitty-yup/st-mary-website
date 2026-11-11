import { officeRoute } from '@/lib/office/api';
import { recordAudit } from '@/lib/office/audit';
import { parishDateTime, recordsTable, toCsv } from '@/lib/office/export';

/** GET ?type=baptism|marriage → every record of that type as a CSV file. */
export default officeRoute(['GET'], async (req, res, session) => {
  const type = req.query.type;
  if (type !== 'baptism' && type !== 'marriage') return res.status(400).json({ error: 'Unknown type.' });
  const table = await recordsTable(type);
  await recordAudit(null, session.email, 'export', { type, rows: table.rows.length });
  const day = parishDateTime(new Date()).slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="St Mary ${type === 'marriage' ? 'marriages' : 'baptisms'} ${day}.csv"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).send(toCsv(table));
});
