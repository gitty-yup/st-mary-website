import { query } from '@/lib/db';
import { officeRoute } from '@/lib/office/api';
import { recordAudit } from '@/lib/office/audit';
import { RecordError } from '@/lib/office/records';
import { StorageError, archiveKey, downloadLink, storageReady, storedSize } from '@/lib/storage/r2';

/** At most this many photos in one zip. */
const MAX_PHOTOS = 500;
/** The links last an hour, so a large zip can finish. */
const LINK_SECONDS = 3600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST { ids } → { files: [{ id, name, url, size }], missing }: links to the full-size
 * originals of several photos, which the browser fetches straight from the private
 * storage (R2) and puts in one zip. Names are made unique. Photos without an original in
 * storage are counted in `missing`.
 */
export default officeRoute(
  ['POST'],
  async (req, res, session) => {
    const raw = req.body?.ids;
    if (!Array.isArray(raw) || !raw.length) throw new RecordError('Choose at least one photo.', 400);
    const ids = Array.from(new Set(raw.filter((v): v is string => typeof v === 'string' && UUID.test(v))));
    if (ids.length > MAX_PHOTOS) throw new RecordError(`Choose at most ${MAX_PHOTOS} photos at a time.`, 400);
    if (!storageReady()) throw new RecordError('The private photo storage isn’t set up on this website.', 503);
    const rows = await query(
      `select id, src, source, original_key, original_name, files_removed_at is not null as files_removed, taken_on::text as taken_on
       from gallery_photos where id = any($1::uuid[]) order by taken_on, src`,
      [ids],
    );
    const used = new Set<string>();
    const unique = (name: string) => {
      const dot = name.lastIndexOf('.');
      const [stem, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
      let candidate = name;
      for (let k = 2; used.has(candidate.toLowerCase()); k++) candidate = `${stem} (${k})${ext}`;
      used.add(candidate.toLowerCase());
      return candidate;
    };
    try {
      // Check each one is really in storage (a few at a time).
      const found: { id: string; key: string; name: string; size: number | null }[] = [];
      const queue = [...rows];
      await Promise.all(
        Array.from({ length: 8 }, async () => {
          for (let r = queue.shift(); r; r = queue.shift()) {
            const key = r.files_removed ? null : r.source === 'site' ? archiveKey(r.src) : r.original_key;
            const size = key ? await storedSize(key) : null;
            if (key && size !== null) {
              const name = String((r.source === 'upload' ? r.original_name : r.src.split('/').pop()) || 'photo.jpg').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_');
              found.push({ id: r.id, key, name, size });
            }
          }
        }),
      );
      const order = new Map(rows.map((r, i) => [r.id, i]));
      found.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
      const files = [];
      for (const f of found) {
        const name = unique(f.name);
        files.push({ id: f.id, name, size: f.size, url: await downloadLink(f.key, name, LINK_SECONDS) });
      }
      await recordAudit(null, session.email, 'gallery', { what: 'download originals', photos: files.length, missing: ids.length - files.length });
      res.status(200).json({ files, missing: ids.length - files.length });
    } catch (err) {
      if (err instanceof StorageError) throw new RecordError(err.message, err.status);
      throw err;
    }
  },
  'gallery',
);
