#!/usr/bin/env node
/**
 * Copies the full-size originals archive (the photo-originals folder made on 2026-11-12,
 * before the site's photos were shrunk) into the website's private Cloudflare R2 storage,
 * under archive/2026-11-12/, where the office's "Download original" button finds them.
 *
 *   node scripts/upload-photo-originals.js <path to the photo-originals folder>
 *
 * - Asks for the R2 keys (or reads R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   and R2_BUCKET from the environment). It never prints or saves them.
 * - First checks the folder against its CHECKSUMS.sha256, and stops if anything changed.
 * - Safe to run again: files already in storage with the same contents are skipped.
 * - Finishes by checking every file in storage against the folder (MD5 fingerprints).
 *
 * R2_ENDPOINT replaces the Cloudflare address, for testing against a stand-in.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { AwsClient } = require('aws4fetch');

/** Same as ARCHIVE_PREFIX in src/lib/storage/r2.ts. */
const PREFIX = 'archive/2026-11-12/';
const DEFAULT_BUCKET = 'st-mary-photos';
const PARALLEL = 4;

const TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
  '.sha256': 'text/plain; charset=utf-8', '.json': 'application/json', '.html': 'text/html; charset=utf-8',
};

class Stop extends Error {}

function ask(question, hidden) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (s) => {
      if (!muted) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
    muted = Boolean(hidden);
  });
}

async function settings() {
  const env = (name) => (process.env[name] || '').trim();
  let accountId = env('R2_ACCOUNT_ID');
  let accessKeyId = env('R2_ACCESS_KEY_ID');
  let secret = env('R2_SECRET_ACCESS_KEY');
  let bucket = env('R2_BUCKET');
  const endpoint = env('R2_ENDPOINT');
  if (!accountId && !endpoint) accountId = await ask('Account ID (or the whole endpoint address): ');
  // Accept the endpoint shown with the token, https://<account id>.r2.cloudflarestorage.com
  const fromEndpoint = accountId.match(/^(?:https?:\/\/)?([0-9a-f]{32})\.r2\.cloudflarestorage\.com\/?$/i);
  if (fromEndpoint) accountId = fromEndpoint[1];
  if (!endpoint && !/^[0-9a-f]{32}$/i.test(accountId)) {
    throw new Stop('That doesn’t look like an R2 account ID (32 letters and numbers, 0–9 and a–f).');
  }
  if (!accessKeyId) accessKeyId = await ask('Access Key ID: ');
  if (!secret) secret = await ask('Secret Access Key (it won’t show as you paste): ', true);
  if (!bucket) bucket = (await ask(`Bucket name [${DEFAULT_BUCKET}]: `)) || DEFAULT_BUCKET;
  if (!accessKeyId || !secret) throw new Stop('The Access Key ID and Secret Access Key are both needed.');
  const base = (endpoint || `https://${accountId}.r2.cloudflarestorage.com`).replace(/\/+$/, '');
  return {
    bucket,
    bucketUrl: `${base}/${encodeURIComponent(bucket)}`,
    client: new AwsClient({ accessKeyId, secretAccessKey: secret, service: 's3', region: 'auto' }),
  };
}

const objectUrl = (r2, key) => `${r2.bucketUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;

/** Every file in the folder (not .DS_Store), with its fingerprints. */
function localFiles(root) {
  const files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name !== '.DS_Store') {
        const body = fs.readFileSync(full);
        const rel = path.relative(root, full).split(path.sep).join('/');
        files.push({
          rel,
          key: PREFIX + rel,
          size: body.length,
          md5: crypto.createHash('md5').update(body).digest('hex'),
          sha256: crypto.createHash('sha256').update(body).digest('hex'),
        });
      }
    }
  })(root);
  return files.sort((a, b) => a.rel.localeCompare(b.rel));
}

/** Compares the folder with its CHECKSUMS.sha256, so a damaged copy isn't uploaded. */
function checkFolder(root, files) {
  const listFile = path.join(root, 'CHECKSUMS.sha256');
  if (!fs.existsSync(listFile)) throw new Stop(`${root} has no CHECKSUMS.sha256. Is this the photo-originals folder?`);
  const listed = new Map();
  for (const line of fs.readFileSync(listFile, 'utf8').split('\n')) {
    const m = line.match(/^([0-9a-f]{64}) [ *](.+)$/);
    if (m) listed.set(m[2], m[1]);
  }
  const byRel = new Map(files.map((f) => [f.rel, f]));
  const problems = [];
  for (const [rel, sha] of listed) {
    const f = byRel.get(rel);
    if (!f) problems.push(`missing: ${rel}`);
    else if (f.sha256 !== sha) problems.push(`changed: ${rel}`);
  }
  if (problems.length) {
    throw new Stop(`The folder doesn’t match its CHECKSUMS.sha256, so nothing was uploaded:\n  ${problems.slice(0, 20).join('\n  ')}`);
  }
  return listed.size;
}

/** Everything already stored under the archive prefix: key → { size, etag }. */
async function storedFiles(r2) {
  const stored = new Map();
  let token = '';
  do {
    const url = new URL(r2.bucketUrl);
    url.searchParams.set('list-type', '2');
    url.searchParams.set('prefix', PREFIX);
    if (token) url.searchParams.set('continuation-token', token);
    const res = await r2.client.fetch(url.toString());
    const xml = await res.text();
    if (!res.ok) throw new Stop(explain(res.status, xml, r2));
    for (const item of xml.match(/<Contents>[\s\S]*?<\/Contents>/g) || []) {
      const field = (name) => decodeXml((item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)) || [])[1] || '');
      stored.set(field('Key'), { size: Number(field('Size')), etag: field('ETag').replace(/"/g, '') });
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? decodeXml((xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/) || [])[1] || '') : '';
  } while (token);
  return stored;
}

function decodeXml(s) {
  return s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/** A plain-English reason for a refusal from R2 (never includes the keys). */
function explain(status, body, r2) {
  const code = ((body || '').match(/<Code>([^<]+)<\/Code>/) || [])[1] || '';
  if (code === 'NoSuchBucket') return `There’s no bucket named “${r2.bucket}” in that account.`;
  if (status === 401 || status === 403 || /Signature|AccessDenied|InvalidAccessKeyId|Unauthorized/i.test(code)) {
    return `Cloudflare refused the keys (${code || status}). Check the Account ID, Access Key ID and Secret Access Key, and that the token has Object Read & Write on “${r2.bucket}”.`;
  }
  return `R2 answered ${status}${code ? ` (${code})` : ''}.`;
}

/** Puts a tiny file and takes it away again, so wrong keys show up before the long part. */
async function connectionCheck(r2) {
  const url = objectUrl(r2, `${PREFIX}.connection-check`);
  let res;
  try {
    res = await r2.client.fetch(url, { method: 'PUT', body: 'ok', headers: { 'Content-Type': 'text/plain' } });
  } catch (err) {
    throw new Stop(`Couldn’t reach R2: ${err.message}. Check the internet connection and the Account ID.`);
  }
  if (!res.ok) throw new Stop(explain(res.status, await res.text(), r2));
  const del = await r2.client.fetch(url, { method: 'DELETE' });
  if (!del.ok && del.status !== 404) throw new Stop(explain(del.status, await del.text(), r2));
}

async function upload(r2, root, f) {
  const body = fs.readFileSync(path.join(root, f.rel));
  const headers = {
    'Content-Type': TYPES[path.extname(f.rel).toLowerCase()] || 'application/octet-stream',
    // R2 refuses the upload if what arrives doesn't match this fingerprint.
    'Content-MD5': Buffer.from(f.md5, 'hex').toString('base64'),
  };
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await r2.client.fetch(objectUrl(r2, f.key), { method: 'PUT', body, headers });
      if (res.ok) {
        const etag = (res.headers.get('etag') || '').replace(/"/g, '');
        if (etag && etag !== f.md5) throw new Error('stored copy has a different fingerprint');
        return;
      }
      const text = await res.text();
      if (res.status < 500 || attempt === 3) throw new Stop(`${f.rel}: ${explain(res.status, text, r2)}`);
    } catch (err) {
      if (err instanceof Stop || attempt === 3) throw err instanceof Stop ? err : new Stop(`${f.rel}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}

const mb = (bytes) => `${(bytes / 1_000_000).toFixed(1)} MB`;

async function main() {
  const folder = process.argv[2];
  if (!folder) throw new Stop('Usage: node scripts/upload-photo-originals.js <path to the photo-originals folder>');
  const root = path.resolve(folder.replace(/^~(?=$|\/)/, require('os').homedir()));
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Stop(`No folder at ${root}`);

  process.stdout.write('Checking the folder… ');
  const files = localFiles(root);
  const listed = checkFolder(root, files);
  const total = files.reduce((n, f) => n + f.size, 0);
  console.log(`${files.length} files, ${mb(total)}; all ${listed} in CHECKSUMS.sha256 are unchanged.`);

  const r2 = await settings();
  process.stdout.write('Connecting to R2… ');
  await connectionCheck(r2);
  console.log('the keys work.');

  const before = await storedFiles(r2);
  const todo = files.filter((f) => {
    const s = before.get(f.key);
    return !s || s.size !== f.size || s.etag !== f.md5;
  });
  console.log(todo.length ? `Uploading ${todo.length} files (${mb(todo.reduce((n, f) => n + f.size, 0))}); ${files.length - todo.length} already there.` : `All ${files.length} files are already there.`);

  let done = 0;
  let next = 0;
  const show = () => process.stdout.isTTY && process.stdout.write(`\r  ${done} of ${todo.length} uploaded`);
  await Promise.all(
    Array.from({ length: Math.min(PARALLEL, todo.length) }, async () => {
      while (next < todo.length) {
        const f = todo[next++];
        await upload(r2, root, f);
        done++;
        show();
      }
    }),
  );
  if (todo.length) console.log(process.stdout.isTTY ? '' : `  ${done} uploaded`);

  process.stdout.write('Checking what’s in storage… ');
  const after = await storedFiles(r2);
  const bad = files.filter((f) => {
    const s = after.get(f.key);
    return !s || s.size !== f.size || s.etag !== f.md5;
  });
  if (bad.length) throw new Stop(`${bad.length} files don’t match. Run this again to retry them:\n  ${bad.slice(0, 20).map((f) => f.rel).join('\n  ')}`);
  const extra = Array.from(after.keys()).filter((k) => !files.some((f) => f.key === k));
  console.log(`all ${files.length} files are in “${r2.bucket}” under ${PREFIX} and match your folder.`);
  if (extra.length) console.log(`(${extra.length} other files are stored there too; nothing was removed.)`);
  console.log('Keep your own copy as well.');
}

main().catch((err) => {
  console.error(`\n${err instanceof Stop ? err.message : `Stopped: ${err.message}`}`);
  process.exit(1);
});
