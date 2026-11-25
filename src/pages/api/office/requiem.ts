import { officeRoute } from '@/lib/office/api';
import { recordAudit } from '@/lib/office/audit';
import { RecordError } from '@/lib/office/records';
import { cleanRequiem, parishToday } from '@/lib/requiem/rules';
import { requiemNow } from '@/lib/requiem/sameDay';
import { deleteRequiemRequest } from '@/lib/requiem/store';
import { submitRequiem } from '@/lib/requiem/submit';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const config = { api: { bodyParser: { sizeLimit: '32kb' } } };

/**
 * Office only.
 *  POST { data }  : saves a paper request typed in by the office (today allowed; phone or
 *                   email needed), with the same emails as an online request.
 *  DELETE ?id=    : removes a request (for example, spam or a duplicate).
 */
export default officeRoute(['POST', 'DELETE'], async (req, res, session) => {
  if (req.method === 'POST') {
    const today = parishToday(requiemNow(req));
    const { data, errors } = cleanRequiem(req.body?.data, today, { office: true });
    if (Object.keys(errors).length) {
      return res.status(400).json({ error: errors.serviceDate ?? 'Please check the highlighted fields.', errors });
    }
    const sameDay = data.serviceDate === today;
    const { request, receipt } = await submitRequiem(data, { source: 'paper', sameDay, ipHash: null, by: session.email });
    return res.status(200).json({ ok: true, id: request.id, sameDay, receipt });
  }

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
