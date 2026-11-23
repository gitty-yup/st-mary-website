#!/usr/bin/env node
/**
 * Smaller copies of the images added through the blog editor (/admin) or the newsletter
 * import (src/lib/mailchimp-sync.ts), all in public/media/uploads.
 *
 * For each JPEG or PNG, makes a WebP beside it (<name>.<ext>.webp: at most 1600 px wide,
 * turned upright, without camera details or location) when that saves at least 10%.
 * Blog posts offer the WebP to browsers and keep the original as the fallback and as the
 * full-size link (src/pages/blog/[slug].tsx). The originals are never changed.
 *
 * Runs before `next build`. The copies aren't committed (.gitignore); results are cached
 * in .next/cache (kept between Vercel builds) by content, so only new images take time.
 * A file that can't be read is skipped, never failing the build.
 *
 *   node scripts/upload-webp.js
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const UPLOADS = path.join(ROOT, 'public', 'media', 'uploads');
const CACHE = path.join(ROOT, '.next', 'cache', 'upload-webp');
const SETTINGS = { version: 1, width: 1600, quality: 80, effort: 5 };
/** Only worth it when the copy is at least this much smaller. */
const MIN_SAVING = 0.1;
const SOURCE = /\.(jpe?g|png)$/i;
const COPY = /\.(jpe?g|png)\.webp$/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  const files = walk(UPLOADS);
  const n = { made: 0, cached: 0, notWorth: 0, failed: 0, removed: 0 };
  let before = 0;
  let after = 0;

  // A copy whose original was deleted goes too.
  for (const f of files.filter((f) => COPY.test(f))) {
    if (!fs.existsSync(f.slice(0, -'.webp'.length))) {
      fs.unlinkSync(f);
      n.removed++;
    }
  }

  for (const f of files.filter((f) => SOURCE.test(f))) {
    const target = `${f}.webp`;
    const rel = path.relative(UPLOADS, f);
    try {
      const original = fs.readFileSync(f);
      before += original.length;
      const key = crypto.createHash('sha1').update(JSON.stringify(SETTINGS)).update(original).digest('hex');
      const cachedCopy = path.join(CACHE, `${key}.webp`);
      const cachedNone = path.join(CACHE, `${key}.none`);
      let copy = null;
      if (fs.existsSync(cachedCopy)) {
        copy = fs.readFileSync(cachedCopy);
        n.cached++;
      } else if (fs.existsSync(cachedNone)) {
        n.cached++;
      } else {
        const webp = await sharp(original, { failOn: 'error', limitInputPixels: 120_000_000 })
          .rotate()
          .resize({ width: SETTINGS.width, withoutEnlargement: true })
          .webp({ quality: SETTINGS.quality, effort: SETTINGS.effort })
          .toBuffer();
        if (webp.length <= original.length * (1 - MIN_SAVING)) {
          fs.writeFileSync(cachedCopy, webp);
          copy = webp;
          n.made++;
        } else {
          fs.writeFileSync(cachedNone, '');
        }
      }
      if (copy) {
        fs.writeFileSync(target, copy);
        after += copy.length;
      } else {
        if (fs.existsSync(target)) fs.unlinkSync(target);
        after += original.length;
        if (fs.existsSync(cachedNone)) n.notWorth++;
      }
    } catch (err) {
      n.failed++;
      console.warn(`[upload-webp] skipped ${rel}: ${err instanceof Error ? err.message : err}`);
    }
  }

  const total = files.filter((f) => SOURCE.test(f)).length;
  console.log(
    `[upload-webp] ${total} uploaded images (${n.made} new, ${n.cached} from cache): ${total - n.notWorth - n.failed} with a WebP copy, ` +
      `${n.notWorth} kept as they are (no real saving)` +
      `${n.failed ? `, ${n.failed} skipped` : ''}${n.removed ? `, ${n.removed} old copies removed` : ''}; ` +
      `shown size ${mb(before)} → ${mb(after)}.`,
  );
}

main().catch((err) => {
  // Never fail the build over this: posts then show the originals.
  console.warn('[upload-webp] stopped:', err instanceof Error ? err.message : err);
});
