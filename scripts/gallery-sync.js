/**
 * Keeps the gallery's database in step with the photos in public/media/YYYY/MM.
 * Runs as part of `npm run build`, after the migrations.
 *
 * - Makes any missing thumbnail (public/gallery-thumbs/YYYY/MM/<file>.webp).
 *   Thumbnails are committed, so this normally only happens for new photos.
 * - Adds new photos to the gallery (published), dated by the camera's date
 *   taken, or else the folder's month.
 * - Marks photos whose file is gone as missing (hidden from the gallery; their
 *   tags and captions are kept in case the file comes back).
 * Captions, tags, events and hidden/published status set in the office are
 * never changed here.
 *
 *   npm run gallery:sync     (thumbnails only, without a database)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Client } = require('pg');

const PUBLIC = path.join(__dirname, '..', 'public');
const MEDIA = path.join(PUBLIC, 'media');
const THUMBS = path.join(PUBLIC, 'gallery-thumbs');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const THUMB_SIZE = 480; // shortest side, px: sharp on high-density screens at the grid's tile size

function sitePhotos() {
  const out = [];
  for (const year of fs.readdirSync(MEDIA).filter((d) => /^\d{4}$/.test(d))) {
    for (const month of fs.readdirSync(path.join(MEDIA, year)).filter((d) => /^\d{2}$/.test(d))) {
      for (const file of fs.readdirSync(path.join(MEDIA, year, month))) {
        if (!IMAGE_EXT.has(path.extname(file).toLowerCase())) continue;
        out.push({ year, month, file, src: `/media/${year}/${month}/${file}`, thumbSrc: `/gallery-thumbs/${year}/${month}/${file}.webp` });
      }
    }
  }
  return out;
}

/** DateTimeOriginal from a raw EXIF block ("YYYY:MM:DD HH:MM:SS"), or null. */
function dateTaken(exif) {
  try {
    const t = exif.indexOf('Exif\0\0') === 0 ? 6 : 0;
    const le = exif.toString('ascii', t, t + 2) === 'II';
    const u16 = (o) => (le ? exif.readUInt16LE(t + o) : exif.readUInt16BE(t + o));
    const u32 = (o) => (le ? exif.readUInt32LE(t + o) : exif.readUInt32BE(t + o));
    const find = (ifd, tag) => {
      for (let i = 0, n = u16(ifd); i < n; i++) {
        const e = ifd + 2 + i * 12;
        if (u16(e) === tag) return e;
      }
      return null;
    };
    const exifPtr = find(u32(4), 0x8769);
    const entry = exifPtr && find(u32(exifPtr + 8), 0x9003);
    if (!entry) return null;
    const count = u32(entry + 4);
    const at = count > 4 ? u32(entry + 8) : entry + 8;
    const m = /^(\d{4}):(\d{2}):(\d{2})/.exec(exif.toString('ascii', t + at, t + at + count));
    return m && Number(m[1]) >= 1990 && m[2] !== '00' ? `${m[1]}-${m[2]}-${m[3] === '00' ? '01' : m[3]}` : null;
  } catch {
    return null;
  }
}

async function describe(photo) {
  const file = path.join(MEDIA, photo.year, photo.month, photo.file);
  const meta = await sharp(file).metadata();
  const turned = (meta.orientation ?? 1) >= 5; // shown rotated a quarter turn
  const thumb = path.join(THUMBS, photo.year, photo.month, `${photo.file}.webp`);
  let made = false;
  if (!fs.existsSync(thumb)) {
    fs.mkdirSync(path.dirname(thumb), { recursive: true });
    await sharp(file)
      .rotate()
      .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: 'outside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(thumb);
    made = true;
  }
  return {
    ...photo,
    width: turned ? meta.height : meta.width,
    height: turned ? meta.width : meta.height,
    takenOn: (meta.exif && dateTaken(meta.exif)) || `${photo.year}-${photo.month}-01`,
    made,
  };
}

async function main() {
  const photos = [];
  for (const p of sitePhotos()) photos.push(await describe(p));
  const made = photos.filter((p) => p.made).length;
  console.log(`[gallery-sync] ${photos.length} site photos; ${made} new thumbnail(s).`);

  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return console.log('[gallery-sync] No DATABASE_URL; database not updated.');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('begin');
    const existing = new Map(
      (await client.query("select src, width, height, thumb_src, file_missing from gallery_photos where source = 'site'")).rows.map((r) => [r.src, r]),
    );
    let added = 0;
    let changed = 0;
    for (const p of photos) {
      const row = existing.get(p.src);
      if (!row) {
        await client.query(
          `insert into gallery_photos (source, src, thumb_src, width, height, taken_on) values ('site', $1, $2, $3, $4, $5)`,
          [p.src, p.thumbSrc, p.width, p.height, p.takenOn],
        );
        added++;
      } else if (row.width !== p.width || row.height !== p.height || row.thumb_src !== p.thumbSrc || row.file_missing) {
        await client.query(
          `update gallery_photos set width = $2, height = $3, thumb_src = $4, file_missing = false, updated_at = now() where src = $1`,
          [p.src, p.width, p.height, p.thumbSrc],
        );
        changed++;
      }
    }
    const present = new Set(photos.map((p) => p.src));
    const gone = [...existing.values()].filter((r) => !present.has(r.src) && !r.file_missing).map((r) => r.src);
    // An empty or partial checkout must not hide the whole gallery.
    if (gone.length && gone.length > existing.size / 2) {
      console.warn(`[gallery-sync] ${gone.length} of ${existing.size} photo files are missing; not marking them (check public/media).`);
    } else if (gone.length) {
      await client.query("update gallery_photos set file_missing = true, updated_at = now() where source = 'site' and src = any($1)", [gone]);
    }
    await client.query('commit');
    console.log(`[gallery-sync] database: ${added} added, ${changed} updated, ${gone.length} missing.`);
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[gallery-sync] failed:', err.message);
  process.exit(1);
});
