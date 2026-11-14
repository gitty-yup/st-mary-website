import { officeRoute } from '@/lib/office/api';
import { refreshGallery } from '@/lib/gallery/refresh';
import { deleteTag, saveTag } from '@/lib/gallery/store';

/** POST { group, label } adds a tag; POST { id, label } renames one; DELETE ?id= deletes one. */
export default officeRoute(
  ['POST', 'DELETE'],
  async (req, res, session) => {
    if (req.method === 'DELETE') {
      await deleteTag(req.query.id, session.email);
      await refreshGallery(res);
      return res.status(200).json({ deleted: true });
    }
    const tag = await saveTag(req.body ?? {}, session.email);
    await refreshGallery(res);
    res.status(200).json({ tag });
  },
  'gallery',
);
