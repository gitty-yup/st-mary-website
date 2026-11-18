-- Event links (gallery step 2c).
--
-- The office makes a link for one event (Photos → Links). Anyone who has it can send
-- photos of that event from /event-photos/<code> without signing in, until it expires
-- (at most 30 days), the office ends it, or it has taken its number of photos. Every
-- photo sent with a link waits for review.
--
-- gallery_link_passes: someone who opened the link, gave their name and passed the
-- "verify you're human" check. The pass (a cookie) lets them send photos for a while;
-- only its hash is stored, like office sign-ins.
--
-- Photos sent with a link have no uploaded_by (no email address); uploader_name is the
-- name they gave, and link_id / link_pass_id say which link and pass.

create table gallery_links (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  event_id   uuid not null references gallery_events (id) on delete cascade,
  max_photos integer not null check (max_photos between 1 and 1000),
  expires_at timestamptz not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  ended_at   timestamptz,
  ended_by   text
);

create table gallery_link_passes (
  id         uuid primary key default gen_random_uuid(),
  link_id    uuid not null references gallery_links (id) on delete cascade,
  token_hash text not null unique,
  name       text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table gallery_uploads
  alter column uploaded_by drop not null,
  add column link_id      uuid references gallery_links (id) on delete set null,
  add column link_pass_id uuid references gallery_link_passes (id) on delete set null;

create index gallery_uploads_link_idx on gallery_uploads (link_id) where link_id is not null;

alter table gallery_photos
  add column link_id      uuid references gallery_links (id) on delete set null,
  add column link_pass_id uuid;

create index gallery_photos_link_idx on gallery_photos (link_id) where link_id is not null;
create index gallery_photos_link_pass_idx on gallery_photos (link_pass_id, created_at) where link_pass_id is not null;
