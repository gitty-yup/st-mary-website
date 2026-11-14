import { officeRoute } from '@/lib/office/api';
import { refreshGallery } from '@/lib/gallery/refresh';
import { deleteEvent, saveEvent, setEventCover } from '@/lib/gallery/store';

/**
 * POST { title, eventDate, description } adds an event; with { id, … } edits one.
 * POST { id, coverPhotoId } sets (or, with null, clears) its cover photo.
 * DELETE ?id= deletes one (its photos stay, without an event).
 */
export default officeRoute(
  ['POST', 'DELETE'],
  async (req, res, session) => {
    if (req.method === 'DELETE') {
      await deleteEvent(req.query.id, session.email);
      await refreshGallery(res);
      return res.status(200).json({ deleted: true });
    }
    const body = req.body ?? {};
    if ('coverPhotoId' in body) {
      await setEventCover(body.id, body.coverPhotoId, session.email);
      await refreshGallery(res);
      return res.status(200).json({ ok: true });
    }
    const event = await saveEvent(body, session.email);
    await refreshGallery(res);
    res.status(200).json({ event });
  },
  'gallery',
);
