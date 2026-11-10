# Sacramental certificates

Generates the St. Mary **Certificate of Baptism and Chrismation** and **Certificate of
Marriage** as single-page landscape Letter PDFs, server-side, with no system-font
dependencies.

```ts
import { renderCertificate, certificateFilename } from '@/certificates';

const bytes = await renderCertificate('baptism', data, { preview: true }); // watermarked
const bytes = await renderCertificate('baptism', data, { preview: false }); // issued
```

| File | Purpose |
| --- | --- |
| `content.ts` | Approved bilingual wording and parish defaults. **Do not respell Armenian.** |
| `render.ts` | Drawing code (pdf-lib). Port of the v12.5 ReportLab prototype; coordinates are the approved layout. |
| `types.ts` | Certificate data shapes (field names match the prototype). |
| `assets/` | Source fonts, font license, Western Diocese logo. |
| `assets.generated.ts` | Base64 of `assets/`, so Vercel always bundles them. Regenerate with `node scripts/embed-certificate-assets.js`. |
| `fixtures/samples.json` | Fictional data for layout testing. |

| `fields.ts` | Editable fields per certificate, form sections, input cleaning, date formatting. Browser-safe. |
| `defaults.ts` | Parish defaults per certificate type. Browser-safe. |
| `validate.ts` | Finds characters the certificate fonts can't print. |

## Certificate office (`/office`)

Staff sign in at `/office/login` with an emailed one-time link (20 minutes). Only
addresses in `OFFICE_EMAILS` (comma-separated; default: the priest and info@) get a
link, and removing an address there also ends its existing sessions. Sessions last
14 days and are stored in `office_sessions`.

- `/office`: all records. `/office/new?type=baptism|marriage`: manual entry.
- `/office/records/[id]`: edit, preview (watermarked), issue, print.
- Issuing assigns the next number for the sacrament's year (`B-2026-001`,
  `M-2026-001`) and dates the certificate today (Pacific). Numbers are never reused.
- Records stay editable after issue for corrections; the number and certificate
  date don't change, and every change is in the record's history (`audit_events`).

## Public forms (`/forms/baptism`, `/forms/marriage`)

Fields are defined in `intake.ts` (based on the paper intake forms). On submit
(`/api/forms/submit`) the original answers are kept unchanged in `submitted_data`,
the certificate fields are pre-filled from them, and the record appears in the
office as "New submission". Then:

- The priest is emailed a short summary and a link to the record, CC the parish
  council (`CERTIFICATE_NOTIFY_TO` / `CERTIFICATE_NOTIFY_CC`). Preview deployments
  send only to info@ with a `[TEST]` subject.
- The family gets a receipt that repeats nothing they typed except the date, so the
  form can't be used to send arbitrary text to arbitrary addresses.
- Spam: hidden honeypot field, 5 submissions per hour per IP (stored only as a salted
  hash), and Cloudflare Turnstile once `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and
  `TURNSTILE_SECRET_KEY` are set.

Database: Neon Postgres (`DATABASE_URL`). Schema changes go in a new
`db/migrations/NNN_name.sql`; `npm run build` applies pending migrations
(`scripts/db-migrate.js`), so each Vercel deployment migrates its own database
(preview deployments get their own Neon branch). Run them by hand with
`DATABASE_URL=... npm run db:migrate`.

Local development without an email service: leave `RESEND_API_KEY` unset
and the sign-in link is printed in the `next dev` console.

## Checking output

```sh
npm run certificates:samples -- /tmp/cert-samples
```

Renders every fixture (preview + issued) and fails if the bundled Armenian fonts are
missing a glyph used by any approved string.

## Fonts

- **English:** PDF built-in Times Roman / Italic / Bold (same as the prototype).
- **Armenian:** Noto Serif Armenian, SIL Open Font License 1.1 (`assets/OFL.txt`). The
  prototype used macOS's Mshtakan, which cannot be redistributed or deployed.
  `assets/*.ttf` are static Regular (wght 400) and Bold (wght 700) instances of the
  Google Fonts variable build, which, unlike the notofonts release, also contains
  Latin, digits, and `…`:

  ```sh
  fonttools varLib.instancer 'NotoSerifArmenian[wdth,wght].ttf' wght=400 wdth=100 --static --update-name-table -o NotoSerifArmenian-Regular.ttf
  fonttools varLib.instancer 'NotoSerifArmenian[wdth,wght].ttf' wght=700 wdth=100 --static --update-name-table -o NotoSerifArmenian-Bold.ttf
  ```

Characters missing from a field's font fall back to the other script's font, and
anything neither font has (e.g. emoji) prints as `?`. Validate input before issuing.

## Parity with the v12.5 prototype

Verified against ReportLab output for the fixtures: all English text lands within
0.02pt of the prototype; all 28 Armenian strings are identical. Differences are only
those caused by Noto's glyph widths (centered Armenian lines re-center; labels/values
that follow Armenian text shift a few points). Notes:

- pdf-lib's `widthOfTextAtSize` adds kerning for standard fonts but `drawText` doesn't
  kern; `runWidth()` measures unkerned, matching both the drawn output and ReportLab.
- Approved change from the prototype: header metadata underlines (date, registry,
  license, county, state) are black 0.45pt like the body underlines. The prototype
  accidentally drew them in the border color (#B75430, 0.55pt).
- Approved change from the prototype: the border diamonds are centered along each
  side (same count and 15pt spacing). The prototype's rows sat 6.5pt left of center
  and its columns 4.5pt low.
- Approved change from the prototype: the baptism signature line moved from y=54 to
  y=48, giving the same 30pt of signing room as the marriage certificate (was 24pt).
