import { officeRoute } from '@/lib/office/api';
import { refreshGallery } from '@/lib/gallery/refresh';
import { updatePhotos } from '@/lib/gallery/store';

/** POST { ids, change: { addTagIds?, removeTagIds?, eventId?, status?, caption? } } */
export default officeRoute(
  ['POST'],
  async (req, res, session) => {
    const updated = await updatePhotos(req.body?.ids, req.body?.change ?? {}, session.email);
    const refreshed = await refreshGallery(res);
    res.status(200).json({ updated, refreshed });
  },
  'gallery',
);
