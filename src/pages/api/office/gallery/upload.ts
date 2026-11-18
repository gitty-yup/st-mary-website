import { officeRoute } from '@/lib/office/api';
import { RecordError } from '@/lib/office/records';
import { refreshGallery } from '@/lib/gallery/refresh';
import { finishUpload, senderFor, startUpload } from '@/lib/gallery/sharing';

// Preparing a large photo (download from storage, resize twice, upload two copies) takes a few seconds.
export const config = { maxDuration: 60 };

/**
 * Sending one photo, in two steps:
 *   POST { action: 'start', name, size, type, batchId, eventId?, caption? } → { id, url, contentType }
 *     then PUT the file to `url` with that Content-Type (straight to storage);
 *   POST { action: 'finish', id } → { id, status: 'pending' | 'published', thumb }
 */
export default officeRoute(
  ['POST'],
  async (req, res, session) => {
    const body = req.body ?? {};
    const sender = await senderFor(session);
    if (body.action === 'start') return res.status(200).json(await startUpload(sender, body));
    if (body.action !== 'finish') throw new RecordError('Unknown action.', 400);
    const photo = await finishUpload(sender, body.id);
    if (photo.status === 'published') await refreshGallery(res);
    res.status(200).json(photo);
  },
  'share',
);
