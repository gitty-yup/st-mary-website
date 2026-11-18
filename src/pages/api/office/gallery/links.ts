import { officeRoute } from '@/lib/office/api';
import { RecordError } from '@/lib/office/records';
import { createLink, endLink } from '@/lib/gallery/links';

/**
 * Event links (office only):
 *   POST { action: 'create', eventId, days, maxPhotos } → { link }
 *   POST { action: 'end', id }                         → { link }
 */
export default officeRoute(
  ['POST'],
  async (req, res, session) => {
    const body = req.body ?? {};
    if (body.action === 'create') return res.status(200).json({ link: await createLink(body, session.email) });
    if (body.action === 'end') return res.status(200).json({ link: await endLink(body.id, session.email) });
    throw new RecordError('Unknown action.', 400);
  },
  'people',
);
