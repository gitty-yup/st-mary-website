import { officeRoute } from '@/lib/office/api';
import { photoFile } from '@/lib/gallery/store';
import { RecordError } from '@/lib/office/records';
import { StorageError, archiveKey, downloadLink, storedSize } from '@/lib/storage/r2';

/**
 * GET ?id=<photo id> → { url, filename, size }: a link, good for a few minutes, that
 * downloads the photo's full-size original from the private storage (R2).
 */
export default officeRoute(
  ['GET'],
  async (req, res) => {
    const photo = await photoFile(req.query.id);
    if (!photo) throw new RecordError('That photo isn’t in the gallery.', 404);
    const key = photo.source === 'site' ? archiveKey(photo.src) : null;
    try {
      const size = key ? await storedSize(key) : null;
      if (!key || size === null) throw new RecordError('There’s no full-size original of this photo in storage.', 404);
      const filename = photo.src.split('/').pop() || 'photo.jpg';
      res.status(200).json({ url: await downloadLink(key, filename), filename, size });
    } catch (err) {
      if (err instanceof StorageError) throw new RecordError(err.message, err.status);
      throw err;
    }
  },
  'gallery',
);
