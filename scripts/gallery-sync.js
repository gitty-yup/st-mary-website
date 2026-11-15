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
 * - Notes which blog posts and pages show each photo (for the office).
 * - Photos deleted in the office: on Vercel, leaves their photo and thumbnail
 *   files out of the deployment (they stay in the repository until someone
 *   removes them there; the build log lists them). A file that a blog post or
 *   page still shows is kept. Anywhere else (a local build) files are never
 *   deleted; the log only says what a deployment would leave out.
 * Captions, tags, events and hidden/published status set in the office are
 * never changed here.
 *
 *   npm run gallery:sync     (thumbnails only, without a database)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const matter = require('gray-matter');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const MEDIA = path.join(PUBLIC, 'media');
const THUMBS = path.join(PUBLIC, 'gallery-thumbs');
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const THUMB_SIZE = 480; // shortest side, px: sharp on high-density screens at the grid's tile size
const TEXT_EXT = new Set(['.md', '.mdx', '.html', '.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml']);
const MEDIA_REF = /\/media\/\d{4}\/\d{2}\/[^\s"'()<>?#\\]+/g;

function textFilesUnder(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...textFilesUnder(full));
    else if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

/** Which blog posts and pages show each photo: Map of src → [{ title, href }]. */
function photoUses() {
  const uses = new Map();
  for (const file of [...textFilesUnder(path.join(ROOT, 'content')), ...textFilesUnder(path.join(ROOT, 'src'))]) {
    const text = fs.readFileSync(file, 'utf8');
    const refs = text.match(MEDIA_REF);
    if (!refs) continue;
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const post = /^content\/blog\/(.+)\.md$/.exec(rel);
    let title = rel;
    if (post) {
      try {
        title = String(matter(text).data.title || post[1]);
      } catch {
        title = post[1];
      }
    }
    const use = { title, href: post ? `/blog/${post[1]}` : null };
    for (const ref of Array.from(new Set(refs))) {
      let src = ref;
      try {
        src = decodeURI(ref);
      } catch {}
      const list = uses.get(src) || [];
      if (!list.some((u) => u.title === use.title && u.href === use.href)) list.push(use);
      uses.set(src, list);
    }
  }
  return uses;
}

const sameUses = (a, b) =>
  JSON.stringify((a || []).map((u) => [u.title, u.href])) === JSON.stringify((b || []).map((u) => [u.title, u.href]));

/** The absolute path of a photo or thumbnail ("/media/…", "/gallery-thumbs/…"), or null if it points anywhere else. */
function galleryFile(src) {
  const abs = path.join(PUBLIC, src || '');
  return abs.startsWith(MEDIA + path.sep) || abs.startsWith(THUMBS + path.sep) ? abs : null;
}

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

/**
 * Photos deleted in the office. On Vercel, removes their photo and thumbnail files
 * from this build's copy of the site, so the deployment doesn't serve them, and
 * marks them removed (the office can no longer undo the delete). Files that a blog
 * post or page still shows are kept. Locally, only reports what would be left out.
 */
async function leaveOutDeleted(client, deleted, present, usesOf, total) {
  if (!deleted.length) return;
  const kept = deleted.filter((r) => present.has(r.src) && usesOf(r.src).length);
  const remove = deleted.filter((r) => present.has(r.src) && !usesOf(r.src).length);
  // Already out of the repository: nothing to remove, but the delete is now final.
  const goneAlready = deleted.filter((r) => !present.has(r.src) && !r.files_removed_at).map((r) => r.src);
  if (kept.length) {
    console.log(`[gallery-sync] kept ${kept.length} deleted photo(s) that a blog post or page still shows: ${kept.map((r) => r.src).join(', ')}`);
  }
  if (remove.length > total / 2) {
    console.warn(`[gallery-sync] ${remove.length} of ${total} photos are marked deleted; not removing any files (check the office).`);
    return;
  }
  if (process.env.VERCEL !== '1') {
    if (remove.length) {
      console.log(`[gallery-sync] a Vercel deployment would leave out ${remove.length} deleted photo(s); files kept here: ${remove.map((r) => r.src).join(', ')}`);
    }
    return;
  }
  let files = 0;
  for (const r of remove) {
    for (const file of [galleryFile(r.src), galleryFile(r.thumb_src)]) {
      if (file && fs.existsSync(file)) {
        fs.unlinkSync(file);
        files++;
      }
    }
  }
  const final = [...remove.map((r) => r.src), ...goneAlready];
  if (final.length) {
    await client.query(
      "update gallery_photos set files_removed_at = now(), updated_at = now() where source = 'site' and files_removed_at is null and src = any($1)",
      [final],
    );
  }
  if (remove.length) {
    const paths = remove.flatMap((r) => [`public${r.src}`, r.thumb_src ? `public${r.thumb_src}` : null]).filter(Boolean);
    console.log(`[gallery-sync] left ${remove.length} deleted photo(s) out of this deployment (${files} files). Still in the repository: ${paths.join(' ')}`);
  }
}

async function main() {
  const photos = [];
  for (const p of sitePhotos()) photos.push(await describe(p));
  const made = photos.filter((p) => p.made).length;
  console.log(`[gallery-sync] ${photos.length} site photos; ${made} new thumbnail(s).`);
  const uses = photoUses();
  const usesOf = (src) => uses.get(src) || [];
  console.log(`[gallery-sync] ${photos.filter((p) => usesOf(p.src).length).length} of them appear in blog posts or pages.`);

  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return console.log('[gallery-sync] No DATABASE_URL; database not updated.');
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('begin');
    const existing = new Map(
      (
        await client.query(
          "select src, width, height, thumb_src, file_missing, used_in, deleted_at, files_removed_at from gallery_photos where source = 'site'",
        )
      ).rows.map((r) => [r.src, r]),
    );
    let added = 0;
    let changed = 0;
    for (const p of photos) {
      const row = existing.get(p.src);
      const usedIn = usesOf(p.src);
      if (!row) {
        await client.query(
          `insert into gallery_photos (source, src, thumb_src, width, height, taken_on, used_in) values ('site', $1, $2, $3, $4, $5, $6)`,
          [p.src, p.thumbSrc, p.width, p.height, p.takenOn, JSON.stringify(usedIn)],
        );
        added++;
      } else if (
        row.width !== p.width ||
        row.height !== p.height ||
        row.thumb_src !== p.thumbSrc ||
        row.file_missing ||
        !sameUses(row.used_in, usedIn)
      ) {
        await client.query(
          `update gallery_photos set width = $2, height = $3, thumb_src = $4, file_missing = false, used_in = $5, updated_at = now() where src = $1`,
          [p.src, p.width, p.height, p.thumbSrc, JSON.stringify(usedIn)],
        );
        changed++;
      }
    }
    const present = new Set(photos.map((p) => p.src));
    // Deleted photos are expected to lose their files; only the others count as missing.
    const live = [...existing.values()].filter((r) => !r.deleted_at);
    const gone = live.filter((r) => !present.has(r.src) && !r.file_missing).map((r) => r.src);
    // An empty or partial checkout must not hide the whole gallery.
    if (gone.length && gone.length > live.length / 2) {
      console.warn(`[gallery-sync] ${gone.length} of ${live.length} photo files are missing; not marking them (check public/media).`);
    } else if (gone.length) {
      await client.query("update gallery_photos set file_missing = true, updated_at = now() where source = 'site' and src = any($1)", [gone]);
    }
    await leaveOutDeleted(client, [...existing.values()].filter((r) => r.deleted_at), present, usesOf, existing.size);
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
