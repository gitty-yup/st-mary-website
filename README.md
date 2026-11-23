# St. Mary Armenian Apostolic Church website

The parish website at <https://www.stmaryarmenianchurch.com>: public pages, blog and
gallery, the "update my info" parishioner form, and the **certificate office** for
baptism and marriage certificates.

Next.js 15 (pages router), React 18, TypeScript, Tailwind 3, hosted on Vercel.

| Where | What |
| --- | --- |
| `src/pages/` | Public pages, `office/` (certificate office), `forms/` (baptism/marriage forms), `api/` |
| `src/certificates/` | Certificate PDFs, fields and forms. **Its [README](src/certificates/README.md) covers the certificate system in detail.** |
| `src/lib/office/` | Office: sign-in, records, emails, export, backup |
| `src/lib/gallery/`, `src/pages/office/gallery/` | Photo gallery data and its office screens (photos, review, events, tags, people); `src/pages/share-photos.tsx` is where people send photos |
| `db/migrations/` | Database schema (applied automatically on every build) |
| `content/blog/` | Blog posts (Markdown), edited in `/admin` or imported from Mailchimp |
| `public/media/YYYY/MM/` | Site photos; each build adds new ones to the gallery (`scripts/gallery-sync.js`) |
| `public/gallery-thumbs/` | Gallery thumbnails (made by the sync, committed so builds stay quick) |
| `MIGRATION-NOTES.md` | How the old WordPress site was moved here |

The office's day-to-day use is described in the **Certificate Office Guide** (a shared
document for Hayr Eremia and the parish office, kept outside this repository).

## Deploying

- `master` is the live site. Pushing to it deploys to production.
- Any other branch gets a **preview** deployment, protected by Vercel sign-in. Previews
  use their own copy of the database (a Neon branch) and send certificate emails only
  to info@, with `[TEST]` in the subject.
- `npm run build` runs, in order: pending database migrations (`scripts/db-migrate.js`),
  the gallery sync (`scripts/gallery-sync.js`), WebP copies of uploaded images
  (`scripts/upload-webp.js`, below), then `next build`. A production build with no
  `DATABASE_URL` fails on purpose.
- Images added in `/admin` or by the Mailchimp import (`public/media/uploads`) are kept as
  they are. Each build makes a smaller WebP copy beside each one (`<name>.<ext>.webp`, at
  most 1600 px wide, only when it saves 10% or more; not committed, cached in
  `.next/cache`), and blog posts offer browsers that copy with the original as the fallback
  and full-size link. Images after a post's first load as the reader scrolls.
- Settings (below) are changed in Vercel → Project → Settings → Environment Variables,
  and take effect on the **next deployment** (redeploy after changing one).

## Services

| Service | Used for |
| --- | --- |
| Vercel | Hosting, preview deployments, the three daily cron jobs (`vercel.json`), settings |
| Neon Postgres | Certificate records, office sign-in, history (via the Vercel integration) |
| Resend | All email: office sign-in links, submission notices, family emails, update-my-info links |
| Google Cloud service account | Writes to Google Sheets: the certificate backup Sheet and the parishioner Sheet |
| GitHub | This code; also sign-in for the `/admin` blog editor and the Mailchimp import |
| Mailchimp | Sent newsletters are imported as blog posts (daily cron, plus a webhook) |
| Geocodio | Address check on the update-my-info form |
| Cloudflare Turnstile | Optional "verify you are human" check on the baptism/marriage forms |
| Cloudflare R2 | Private storage for full-size original photos and for photos people share (bucket `st-mary-photos`); see Photo gallery |

## Settings (environment variables)

Values are secrets: keep them in Vercel only, never in this repository.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL` | Neon database (set by the integration). Migrations prefer the unpooled one. |
| `OFFICE_EMAILS` | Comma-separated addresses allowed to use the whole office (certificates and photos). Default: the priest and info@. |
| `GALLERY_EDITORS` | Comma-separated addresses allowed to manage photos only (and review and share them); they never see certificate records. Default: none. People who only share or review photos are added in the office instead (Photos → People). |
| `CERTIFICATE_NOTIFY_TO`, `CERTIFICATE_NOTIFY_CC` | Who is emailed about new online submissions. Defaults in production: the priest, CC info@. |
| `RESEND_API_KEY` | Sending email. Unset in local development: emails, including sign-in links, are printed to the console instead. |
| `CRON_SECRET` | Lets Vercel's cron call the backup and Mailchimp jobs; without it they refuse every request. |
| `CERTIFICATE_BACKUP_SHEET_ID` | The Google Sheet the nightly certificate backup writes to |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The service account's JSON key (backup Sheet and parishioner Sheet) |
| `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB` | The parishioner Sheet used by update-my-info |
| `MAGIC_LINK_SECRET` | Signs update-my-info links; also the fallback salt for form rate limiting |
| `IP_HASH_SALT` | Salt for the hashed IP addresses used to rate-limit the public forms (optional) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Turnstile check on the forms; off when unset (forms still have a honeypot and 5 per hour per IP) |
| `SITE_URL` | The public address used in production email links (default: the www address) |
| `NEXT_PUBLIC_SITE_URL` | The address GitHub returns to after `/admin` sign-in |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub sign-in for the `/admin` blog editor |
| `GITHUB_PAT` | Lets the Mailchimp import commit blog posts to this repository |
| `MAILCHIMP_API_KEY`, `MAILCHIMP_WEBHOOK_SECRET` | Mailchimp import |
| `GEOCODIO_API_KEY` | Address check |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 storage for original photos: an account API token with Object Read & Write on that one bucket. Without them, "Download original" says originals aren't set up. (`R2_ENDPOINT` replaces the Cloudflare address, for testing only.) |

## Common tasks

**Give someone access to the office, or remove it.** Edit `OFFICE_EMAILS` (everything) or
`GALLERY_EDITORS` (photos only) in Production, then redeploy. A removed address is signed
out everywhere on the next request. Sign-in is by emailed one-time link; there are no
passwords. People who share photos, and leaders who review them, are managed in the office
under Photos → People, with no redeploy.

**Change who hears about new submissions.** Set `CERTIFICATE_NOTIFY_TO` / `CERTIFICATE_NOTIFY_CC`
(comma-separated), then redeploy.

**A backup failed** (info@ gets "Certificate records backup failed"; `/office/backup`
shows the error). The records are safe in the database. Try "Back up now" first. Then,
by the error shown:

- *Google refused access:* share the backup Sheet with the service account's address
  (shown on `/office/backup`) as an **Editor**.
- *Google could not find the backup Sheet:* check `CERTIFICATE_BACKUP_SHEET_ID`.
- *Google rejected the service account key:* the key was deleted or replaced. Create a
  new JSON key for the same service account in Google Cloud, paste it into
  `GOOGLE_SERVICE_ACCOUNT_KEY`, and redeploy. The update-my-info form uses the same key.
- *N record(s) in the backup Sheet are not in the database:* records are never deleted,
  so the site is probably connected to the wrong or a new, empty database. The backup
  stops rather than erase the Sheet. Fix the database (or restore it, below) and the
  backup resumes.

**Replace a leaked or old key.** Create the new one at the service, update the setting in
Vercel, redeploy, then delete the old key at the service. `CRON_SECRET` can be any long
random string; Vercel's cron picks up the new value by itself.

**Change the database.** Add `db/migrations/NNN_description.sql` (next number). Every
deployment applies pending migrations to its own database, previews included. Run them
by hand with `DATABASE_URL=... npm run db:migrate`.

**Check the certificate layout after a change.** `npm run certificates:samples -- /tmp/cert-samples`
renders every sample certificate and fails if a font is missing a character.

**Add gallery photos.** Put them in `public/media/YYYY/MM/`, shrunk to at most 2000 px on
the long side, and run `npm run gallery:sync` to make their thumbnails; commit both. The
next deployment adds them to the gallery, published and untagged; tag them in the office.
(A build also makes any missing thumbnail, just more slowly.) Full-size originals of the
existing photos are archived outside this repository.

## Photo gallery

`/gallery` shows published photos newest first, by the date they were taken (camera date,
else the folder's month), with filters for year, event and tags. Filters are in the address,
so a link like `/gallery?org=acyo` or `/gallery?event=food-festival-2018` can be shared or
put on an organization's page. The page is pre-built and rebuilt straight after every
office change (and hourly as a fallback).

In the office, **Photos** (`/office/gallery`) is where photos are tagged, put into events,
captioned, and hidden or shown: select photos (Shift-click for a range), then use the panel
at the bottom. **Events** and **Tags** manage the lists. Tag groups are Organization,
Occasion, People and Collection. Renaming a tag or event keeps its web address. Every change
is in `audit_events` (action `gallery`).

A tag marked **Only when chosen** (such as Collection → "Flyers & posters") keeps its
photos out of the main view, including years and events, until a visitor chooses that tag,
e.g. `/gallery?collection=flyers-and-posters`. Hiding a photo removes it from every view.

A photo whose file is removed from `public/media` drops out of the gallery but keeps its
tags in the database in case it comes back.

**Deleting** a photo in the office (Photos → select → Delete) takes it out of the gallery at
once; it waits under Shown → Deleted, where it can be undone. Its files come off the website
at the next deployment: on Vercel, `scripts/gallery-sync.js` removes the photo and its
thumbnail from the build's copy of `public/` and marks it removed (no more undo). Local
builds never delete files.

Each build also records which blog posts and pages show each photo (`used_in`). Those photos
can't be deleted (the office marks them "In a post" and the API refuses); once a post stops
using a photo, or the post is deleted, the next build clears the mark and deletion is
allowed. If a post starts using a photo that's already deleted, the build keeps its file.

The files stay in the repository (and its public history) until someone removes them. The
build log lists them ("Still in the repository: …"); `git rm` those paths in the next
commit. Leave the database rows, so the photo never comes back. For a takedown request,
also scrub the file from the git history, and remove the original from R2 (below).

### Full-size originals (Cloudflare R2)

The website only has web-size copies. The full-size originals are kept privately in
Cloudflare R2 (bucket `st-mary-photos`; nothing in it is public). In the office, select one
photo and choose **Download original**: the site checks the photo is in storage and hands
the browser a link that works for 5 minutes (`/api/office/gallery/original`,
`src/lib/storage/r2.ts`).

`archive/2026-11-12/` holds the website's images as they were before they were shrunk
(the `photo-originals` folder, same layout as this project, with its `CHECKSUMS.sha256`).
A photo at `/media/2018/04/x.jpg` has its original at
`archive/2026-11-12/public/media/2018/04/x.jpg`. Originals keep their camera details,
including location, which is another reason the bucket stays private.

To copy the archive into R2 (or check it's all there), run in Terminal:

    node scripts/upload-photo-originals.js <path to the photo-originals folder>

It checks the folder against `CHECKSUMS.sha256` first, asks for the R2 keys without showing
the secret, skips files already stored, and ends by comparing every stored file with the
folder. Running it again is safe.

To remove an original (for example, for a takedown request), delete it in the Cloudflare
dashboard: R2 → `st-mary-photos` → find the file by its path → Delete.

### Shared photos (/share-photos)

People the office adds under **Photos → People** can send photos from a phone or computer at
`/share-photos`. An **uploader** only shares; their photos wait for review. A **leader** also
reviews (Photos → Review, the only office page they see) and their own photos go straight in,
as do photos from the office and `GALLERY_EDITORS`. Adding someone emails an invitation;
removing them signs them out at once (`gallery_people`; areas in `src/lib/office/auth.ts`).

How a photo travels (`src/lib/gallery/sharing.ts`, `src/pages/api/office/gallery/upload.ts`):

1. The page asks for a link (`start`): checks type (JPEG, PNG, WebP; HEIC is refused with
   how to convert it), size (30 MB), the event, and 300 photos a day per person. Instead of
   an event, the sender can name a new one (`newEvent`: name and a date not in the future).
   For those who publish (office, `GALLERY_EDITORS`, leaders) it's created at once, or an
   existing event with the same name and date is used (`findOrCreateEvent`, an advisory lock
   so simultaneous photos can't create it twice). For uploaders it's kept with the photo
   (`suggested_event_title`/`_date`) and created when the photo is approved.
2. The browser PUTs the file straight to R2 with that signed link (15 minutes; it fixes the
   Content-Type). This needs the bucket's CORS policy (below); nothing passes through Vercel,
   whose functions take at most 4.5 MB.
3. `finish`: the site reads the original, makes the web copy (JPEG, at most 2000 px) and
   thumbnail (WebP, 480 px short side), both turned upright and without camera details
   (location included), takes the date from the camera (else the day it was sent, Pacific
   time), and adds
   the photo to `gallery_photos` (`source` `upload`, status `pending` or `published`).

R2 layout: `uploads/originals|web|thumbs/YYYY/MM/<photo id>.*` on the live site,
`test/uploads/…` on previews and local runs. The site serves the web copy and thumbnail at
`/api/gallery-photos/<id>/web.jpg` and `…/thumb.webp`: public (cached an hour) once in the
gallery; while waiting, hidden or deleted, only to the office, reviewers and the sender.
**Download original** gives the file exactly as sent.

Review (`/office/gallery/review`): approve (published at once, creating any new event the
photos named) or turn down (status
`rejected`; its three files are removed straight away, so it can't be undone). A deleted
shared photo can be undone for 30 days; then the daily job removes its files, original
included.

The daily job (`/api/cron/photos`, 15:00 UTC) removes those files, clears uploads that
never finished (`gallery_uploads` older than a day), deletes event-link passes that ran out
over two days ago, and emails the reviewers (office, `GALLERY_EDITORS`, leaders) when
photos are waiting. Outside production that email goes to info@ only.

### Event links (/event-photos/&lt;code&gt;)

The office (the `people` area: `OFFICE_EMAILS` only) makes a link for one event on
**Photos → Links** (`src/lib/gallery/links.ts`, `gallery_links`): a random 10-character
code, working through the end of a chosen day (1–30 days, Pacific time) and for a chosen
number of photos (up to 1000). The office can end it early; deleting the event removes it.

Anyone with the link gives their name and passes Cloudflare Turnstile (the same
`TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` as the website forms; with no key
set, the check is skipped). They get a pass: an `stm_photo_pass` cookie for that link, for
12 hours or until an hour after the link expires (`gallery_link_passes`, only its hash
stored). With it, `/api/event-photos/<code>` takes `start`/`finish` like the signed-in
upload route, through the same `startUpload`/`finishUpload` (a `Sender` without an email).
Their photos always go to the link's event and always wait for review; they're stored with
`uploaded_by` null, `uploader_name` the name they gave, and `link_id`/`link_pass_id`.
Uploads in progress count toward the link's number. Ending a link lets photos already on
their way finish for 15 minutes. Review and the Photos panel show these senders as
"Name (event link)".

Each working link has a **QR code** (Links → QR code): shown on screen, saved as a PNG about
1200 pixels square, or printed on a one-page sign (`/office/gallery/links/sign?id=…`, US
Letter). `src/components/gallery/QrCode.tsx` draws it from `qrcode-generator` (no
dependencies) at error-correction level Q, so a creased or smudged sign still scans.

**R2 CORS policy** (bucket → Settings → CORS policy), so browsers may send files to it:

    [
      {
        "AllowedOrigins": [
          "https://www.stmaryarmenianchurch.com",
          "https://st-mary-website-git-gallery-gitty-yups-projects.vercel.app"
        ],
        "AllowedMethods": ["PUT"],
        "AllowedHeaders": ["content-type"],
        "MaxAgeSeconds": 3600
      }
    ]

The bare domain redirects to www, so it isn't needed. The second origin is the `gallery`
branch's preview; add others to test from another branch (a commit's own preview address
won't work).

## Restoring from the backup

Use this if the certificate database is lost or damaged. If the damage is recent, first
try Neon's own point-in-time restore (in the Neon console), which is exact but only
reaches back as far as the Neon plan's history window. Otherwise:

1. **Get the backup.** Open the backup Sheet. For an earlier copy: File → Version history,
   open the version, File → Make a copy, and use the copy. Download each of the
   **Baptisms**, **Marriages** and **History** tabs (File → Download → Comma-separated
   values; it downloads the open tab) into one folder.
2. **Get an empty database** with the current tables: a new Neon database or branch, then
   `DATABASE_URL=<new database> npm run db:migrate`.
3. **Check:** `DATABASE_URL=<new database> npm run certificates:restore -- --csv <folder>`.
   It reports how many records and history entries it found, and anything it couldn't
   read exactly. Nothing is written.
4. **Restore:** run the same command with `--write` at the end. It refuses if the
   database already has certificate records.
5. **Connect the site** to the restored database (the `DATABASE_URL…` settings, Production)
   and redeploy. Open `/office`, check a few records, then press "Back up now".

Instead of CSV files, `--sheet` reads the backup Sheet directly, using
`GOOGLE_SERVICE_ACCOUNT_KEY` and `CERTIFICATE_BACKUP_SHEET_ID`. For a copy of the Sheet,
share the copy with the service account and use `--sheet <the copy's ID>`. The office's
CSV downloads also work with `--csv`, but have no history.

What comes back: every record with its certificate fields, the family's answers, status,
registry number, certificate date, who issued it, and its full history; numbering
continues after the highest number restored, so no number is reused. What doesn't: times
finer than the minute, sign-in sessions (everyone signs in again), and the sign-in,
backup and export log. Tested on a local copy with every kind of record (Nov 2026): the
restored records and a fresh backup of them matched the originals exactly.

## Running it locally

```sh
npm install
DATABASE_URL=postgres://... npm run dev
```

Without `RESEND_API_KEY`, the office sign-in link is printed in the terminal (local
development only). Without a database, the public pages work (the gallery is empty) but the office and forms
don't.

## Known limits

- The office record list loads the 300 most recently changed records, and its search
  covers only those. Add paging before the office holds that many.
- The gallery page loads every published photo's details at once (fine for a few thousand
  photos; past that it needs paging).
