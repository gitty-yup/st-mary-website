# St. Mary Armenian Apostolic Church — Migration Notes

## Source
- WordPress backup (June 2019): `backup-6.4.2019_00-12-38_t9q73krb48x2.tar.gz`
- WordPress backup (April 2026): `app_stmaryarmenianchurch-com_stmaryarmenianchurch-2_2026-04-05_23-36-10.tar.gz`
- Original domain: stmaryarmenianchurch.com
- New framework: Next.js 13 + TypeScript + Tailwind CSS

## Content Mapping Decisions

### Pages Migrated
| WordPress Source | New Page | Notes |
|---|---|---|
| church-history.md + chronological-church-history.md | /about (history section) | Combined into single narrative |
| parish-priest.md (2022, Fr. Serovpe) | Replaced | Fr. Eremia Abgaryan bio used instead |
| parish-council.md | /about#council | Updated to 2025 roster |
| ladies-society.md | /parish-life | Under Ministries section |
| sunday-school.md + saturday-school.md | /parish-life | Under Youth Programs |
| acyo.md | /parish-life | Under Youth Programs |
| zvarnoits-choir-dance.md | /parish-life | Under Ministries (Choir) |
| mommy-me.md + mr-mrs-club.md | /parish-life | Under Parish Organizations (note: content from 2009-2010, may be outdated) |
| cultural-committee.md | /parish-life | Under Parish Organizations |
| contacts.md + contact-us.md (2022) | /contact | 2022 version preferred for current contact info |
| donate.md (2022) | /give | Expanded with full stewardship content |
| All 28 blog posts | /blog/* | Fully migrated with HTML content |

### Pages Skipped (Placeholder/Empty)
- church.md (2019) — empty body
- organizations.md (2019) — empty body
- hovsepian-choir.md — "UNDER CONSTRUCTION"
- trust-fund.md — "UNDER CONSTRUCTION"
- parish-assembly.md — "UNDER CONSTRUCTION"
- zankang-newsletter.md — "UNDER CONSTRUCTION"
- mailing-list.md — empty
- parish-registry.md — empty
- events-calendar.md — empty

### Pages Built from Scratch (No WordPress Source)
- /worship — Badarak info, sacraments, liturgical calendar, plan your visit
- /facilities — Stambolian Family Hall, Small Hall, rental inquiry form
- /give — expanded giving page with Tithe.ly, Venmo/Zelle, stewardship programs
- /events — annual events, parish calendar note

## Clergy Notes
- **Fr. Moushegh Tashjian** served 1992–January 2020 (retired)
- **Fr. Serovpe Alanjian** served 2020–end of 2023
- **2024**: One year of visiting priests
- **Very Rev. Fr. Eremia Abgaryan** appointed Parish Priest in 2025, current
- Fr. Eremia bio source: `/Users/mikehollis/Documents/ClaudeCowork/Eremia Abgaryan Bio.md`
- Updated church history source: `/Users/mikehollis/Documents/ClaudeCowork/History of STM.md`

## Media
- Combined 2019 + 2026 backup uploads: ~4,000 files
- Full-size images copied to `public/media/YYYY/MM/filename`
- Thumbnail variants (-150x150, -300x300, etc.) excluded from public/ to keep size manageable
- Blog post HTML references `/wp-content/uploads/` — updated to `/media/` during migration

## Blog Posts
- 28 published posts migrated (2010–2017)
- Posts with only shortcode content (gview PDFs, image galleries) have minimal body text — this is accurate to the source
- 5 posts have no title in WordPress — slugs used (e.g., `post-884`, `post-918`)
- YouTube embeds: `httpv://` protocol converted to `https://`
- WordPress shortcodes removed: [gview], [gallery], [contact-form-7], [last-posts]

## Items Requiring Your Review
1. **Tithe.ly link** on /give — placeholder URL used; update with your actual Tithe.ly widget URL
2. **Venmo/Zelle handles** on /give — verify @StMaryArmenian and email are correct
3. **Google Maps embed** on /contact — using approximate coordinates; replace with actual embed code from Google Maps
4. **Parish Council 2025 roster** on /about — based on 2018-2019 data + Michael Hollis added as 2025 Chairman; verify full current roster
5. **Instagram handle** — `@stmaryarmenianchurch` used; verify this is the correct handle
6. **Mommy & Me / Mr. & Mrs. Club** content — dated to 2009-2010; consider updating or noting as historical
7. **Hovsepian Choir** — no content was available (was "Under Construction" in WordPress); currently only mentioned in Parish Life highlights
8. **Hero gallery images** — still using template placeholder images; recommend replacing with actual St. Mary photos from the media library

## Technical Notes
- Auth system (login/register) removed entirely — not needed for a church static site
- Redux store simplified to only mobile menu state
- YouTube API integration removed
- `giving` redirects to `give` (301 permanent)
- All pages are statically generated at build time (Next.js SSG)
- Contact/rental inquiry forms use HTML action — wire up to a form service (Netlify Forms, Formspree, or similar) before going live
