# St. Mary Armenian Apostolic Church website

The parish website at <https://www.stmaryarmenianchurch.com>: public pages, blog and
gallery, the "update my info" parishioner form, and the **certificate office** for
baptism and marriage certificates.

Next.js 15 (pages router), React 18, TypeScript, Tailwind 3, hosted on Vercel.

| Where | What |
| --- | --- |
| `src/pages/` | Public pages, `office/` (certificate office), `forms/` (baptism/marriage forms), `api/` |
| `src/certificates/` | Certificate PDFs, fields and forms. **Its [README](src/certificates/README.md) covers the certificate system in detail.** |
| `src/lib/office/` | Certificate office: sign-in, records, emails, export, backup |
| `db/migrations/` | Database schema (applied automatically on every build) |
| `content/blog/` | Blog posts (Markdown), edited in `/admin` or imported from Mailchimp |
| `public/media/YYYY/MM/` | Gallery photos (the gallery lists these folders at build time) |
| `MIGRATION-NOTES.md` | How the old WordPress site was moved here |

The office's day-to-day use is described in the **Certificate Office Guide** (a shared
document for Hayr Eremia and the parish office, kept outside this repository).

## Deploying

- `master` is the live site. Pushing to it deploys to production.
- Any other branch gets a **preview** deployment, protected by Vercel sign-in. Previews
  use their own copy of the database (a Neon branch) and send certificate emails only
  to info@, with `[TEST]` in the subject.
- `npm run build` runs, in order: the gallery list (`scripts/generate-gallery-manifest.js`),
  pending database migrations (`scripts/db-migrate.js`), then `next build`. A production
  build with no `DATABASE_URL` fails on purpose.
- Settings (below) are changed in Vercel → Project → Settings → Environment Variables,
  and take effect on the **next deployment** (redeploy after changing one).

## Services

| Service | Used for |
| --- | --- |
| Vercel | Hosting, preview deployments, the two daily cron jobs (`vercel.json`), settings |
| Neon Postgres | Certificate records, office sign-in, history (via the Vercel integration) |
| Resend | All email: office sign-in links, submission notices, family emails, update-my-info links |
| Google Cloud service account | Writes to Google Sheets: the certificate backup Sheet and the parishioner Sheet |
| GitHub | This code; also sign-in for the `/admin` blog editor and the Mailchimp import |
| Mailchimp | Sent newsletters are imported as blog posts (daily cron, plus a webhook) |
| Geocodio | Address check on the update-my-info form |
| Cloudflare Turnstile | Optional "verify you are human" check on the baptism/marriage forms |

## Settings (environment variables)

Values are secrets: keep them in Vercel only, never in this repository.

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL` | Neon database (set by the integration). Migrations prefer the unpooled one. |
| `OFFICE_EMAILS` | Comma-separated addresses allowed to sign in to `/office`. Default: the priest and info@. |
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

## Common tasks

**Give someone access to the certificate office, or remove it.** Edit `OFFICE_EMAILS`
(Production), then redeploy. A removed address is signed out everywhere on the next
request. Sign-in is by emailed one-time link; there are no passwords.

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
the long side. Full-size originals of the existing photos are archived outside this
repository.

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
development only). Without a database, the public pages work but the office and forms don't.

## Known limits

- The office record list loads the 300 most recently changed records, and its search
  covers only those. Add paging before the office holds that many.
