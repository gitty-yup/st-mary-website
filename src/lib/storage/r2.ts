/**
 * Cloudflare R2: the private storage that keeps full-size original photos, so the
 * website itself only needs web-size copies. Nothing in it is public; the office gets
 * a file through a link that works for a few minutes.
 *
 * Settings: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (an R2 API token with
 * Object Read & Write on the one bucket) and R2_BUCKET. R2_ENDPOINT replaces the
 * Cloudflare address, for testing against a stand-in.
 *
 * What's in the bucket:
 *   archive/2026-11-12/…  the website's images as they were before they were shrunk,
 *                         in the project's folders (public/media/YYYY/MM/…, public/hero/…).
 *                         Copied there by scripts/upload-photo-originals.js.
 *   uploads/…             photos people share on the live site: originals/, web/ and
 *                         thumbs/, each by YYYY/MM/<photo id>. Previews and local runs
 *                         use test/uploads/… instead, so tests never mix with the real ones.
 */
import { AwsClient } from 'aws4fetch';

/** Where the 2026-11-12 originals archive is. scripts/upload-photo-originals.js uses the same. */
export const ARCHIVE_PREFIX = 'archive/2026-11-12/';

/** How long a download link works. */
const LINK_SECONDS = 300;

interface Storage {
  client: AwsClient;
  bucketUrl: string;
}

let cached: Storage | null | undefined;

function storage(): Storage | null {
  if (cached !== undefined) return cached;
  // Trimmed: a space pasted with a key would otherwise break every signature.
  const env = (name: string) => (process.env[name] ?? '').trim();
  const [accountId, accessKeyId, secretAccessKey, bucket, endpoint] = [
    'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_ENDPOINT',
  ].map(env);
  if (!accessKeyId || !secretAccessKey || !bucket || !(accountId || endpoint)) return (cached = null);
  const base = (endpoint || `https://${accountId}.r2.cloudflarestorage.com`).replace(/\/+$/, '');
  cached = {
    client: new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region: 'auto' }),
    bucketUrl: `${base}/${encodeURIComponent(bucket)}`,
  };
  return cached;
}

function required(): Storage {
  const s = storage();
  if (!s) throw new StorageError('Full-size originals aren’t set up on this website yet.', 503);
  return s;
}

export class StorageError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/** Are the R2 settings present? */
export function storageReady(): boolean {
  return storage() !== null;
}

const objectUrl = (s: Storage, key: string) => `${s.bucketUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;

/**
 * Where the original of a photo from the website's own folders is in the archive
 * ("/media/2018/04/x.jpg" → "archive/2026-11-12/public/media/2018/04/x.jpg").
 */
export function archiveKey(src: string): string | null {
  if (!/^\/media\/[A-Za-z0-9._\-/]+$/.test(src) || src.split('/').includes('..')) return null;
  return `${ARCHIVE_PREFIX}public${src}`;
}

/** The size in bytes of a stored file, or null if there's no such file. */
export async function storedSize(key: string): Promise<number | null> {
  const s = required();
  const res = await s.client.fetch(objectUrl(s, key), { method: 'HEAD' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 answered ${res.status} for a file check.`);
  return Number(res.headers.get('content-length') ?? 0);
}

/** Where shared photos go: the live site's uploads, or a test area for previews and local runs. */
export function uploadPrefix(): string {
  return process.env.VERCEL_ENV === 'production' ? 'uploads/' : 'test/uploads/';
}

/**
 * A link a browser can PUT one file to, for the next 15 minutes. The upload must send
 * exactly this Content-Type (it's part of the signature).
 */
export async function uploadLink(key: string, contentType: string): Promise<string> {
  const s = required();
  const url = new URL(objectUrl(s, key));
  url.searchParams.set('X-Amz-Expires', '900');
  const signed = await s.client.sign(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    aws: { signQuery: true, allHeaders: true },
  });
  return signed.url;
}

/** A stored file's contents, or null if there's no such file. */
export async function getObject(key: string): Promise<Buffer | null> {
  const s = required();
  const res = await s.client.fetch(objectUrl(s, key));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 answered ${res.status} for a download.`);
  return Buffer.from(await res.arrayBuffer());
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  const s = required();
  const res = await s.client.fetch(objectUrl(s, key), { method: 'PUT', body, headers: { 'Content-Type': contentType } });
  if (!res.ok) throw new Error(`R2 answered ${res.status} for an upload.`);
}

/** Removes a stored file; one that's already gone is fine. */
export async function deleteObject(key: string): Promise<void> {
  const s = required();
  const res = await s.client.fetch(objectUrl(s, key), { method: 'DELETE' });
  if (!res.ok && res.status !== 404) throw new Error(`R2 answered ${res.status} for a removal.`);
}

/** A link that downloads a stored file as `filename`, for the next few minutes (or `seconds`). */
export async function downloadLink(key: string, filename: string, seconds = LINK_SECONDS): Promise<string> {
  const s = required();
  const url = new URL(objectUrl(s, key));
  url.searchParams.set('X-Amz-Expires', String(seconds));
  url.searchParams.set('response-content-disposition', `attachment; filename="${filename.replace(/["\\\r\n]/g, '')}"`);
  const signed = await s.client.sign(url.toString(), { method: 'GET', aws: { signQuery: true } });
  return signed.url;
}
