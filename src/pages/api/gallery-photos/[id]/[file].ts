import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { sessionFromCookie } from '@/lib/office/auth';
import { getObject } from '@/lib/storage/r2';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FILES = { 'web.jpg': { column: 'web_key', type: 'image/jpeg' }, 'thumb.webp': { column: 'thumb_key', type: 'image/webp' } } as const;

/**
 * A shared photo's web copy or thumbnail: /api/gallery-photos/<id>/web.jpg or
 * …/thumb.webp, read from storage. Anyone may see a photo that's in the gallery
 * (cached for an hour); one that's waiting for review, hidden or deleted is shown
 * only to the office and reviewers, and to the person who sent it.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }
  const notFound = () => {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).end();
  };
  const id = String(req.query.id ?? '');
  const file = FILES[String(req.query.file ?? '') as keyof typeof FILES];
  if (!file || !UUID.test(id)) return notFound();
  try {
    const [photo] = await query(
      `select status, deleted_at, files_removed_at, uploaded_by, ${file.column} as key
       from gallery_photos where id = $1 and source = 'upload'`,
      [id],
    );
    if (!photo?.key || photo.files_removed_at) return notFound();
    const inGallery = photo.status === 'published' && !photo.deleted_at;
    if (!inGallery) {
      const session = await sessionFromCookie(req.headers.cookie);
      const allowed =
        session && (session.areas.includes('gallery') || session.areas.includes('review') || photo.uploaded_by === session.email);
      if (!allowed) return notFound();
    }
    const body = await getObject(photo.key);
    if (!body) return notFound();
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', body.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // A photo taken out of the gallery may stay in the CDN's copy for up to an hour.
    res.setHeader('Cache-Control', inGallery ? 'public, max-age=3600, s-maxage=3600' : 'private, no-store');
    return res.status(200).send(req.method === 'HEAD' ? '' : body);
  } catch (err) {
    console.error('[gallery photo]', err instanceof Error ? err.message : err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).end();
  }
}
