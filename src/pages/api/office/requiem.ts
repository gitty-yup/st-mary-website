import { officeRoute } from '@/lib/office/api';
import { recordAudit } from '@/lib/office/audit';
import { RecordError } from '@/lib/office/records';
import { deleteRequiemRequest } from '@/lib/requiem/store';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** DELETE ?id= : removes a request (for example, spam or a duplicate). Office only. */
export default officeRoute(['DELETE'], async (req, res, session) => {
  const id = req.query.id;
  if (typeof id !== 'string' || !UUID.test(id)) throw new RecordError('Unknown request.', 400);
  const gone = await deleteRequiemRequest(id);
  if (!gone) throw new RecordError('That request was already deleted. Reload the page.', 404);
  await recordAudit(null, session.email, 'requiem', {
    what: 'delete',
    id,
    serviceDate: gone.serviceDate,
    requestedBy: gone.name,
    names: gone.names.map((n) => n.name),
  });
  res.status(200).json({ ok: true });
});
