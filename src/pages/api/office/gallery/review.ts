import { officeRoute } from '@/lib/office/api';
import { refreshGallery } from '@/lib/gallery/refresh';
import { pendingCount, reviewPhotos } from '@/lib/gallery/sharing';

/**
 * GET → { waiting }: how many shared photos wait for review.
 * POST { ids, decision: 'approve' | 'turn_down' } → { reviewed, events, refreshed }
 *   (events: new events the approved photos named, now created)
 */
export default officeRoute(
  ['GET', 'POST'],
  async (req, res, session) => {
    if (req.method === 'GET') return res.status(200).json({ waiting: await pendingCount() });
    const result = await reviewPhotos(req.body?.ids, req.body?.decision, session.email);
    const refreshed = req.body?.decision === 'approve' ? await refreshGallery(res) : true;
    res.status(200).json({ ...result, refreshed });
  },
  'review',
);
