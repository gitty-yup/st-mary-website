-- Photos people share (gallery step 2b).
--
-- gallery_people: who may share photos ('uploader') or also review what others share
-- ('leader'). The office manages the list on Photos → People; removing someone locks
-- them out at once. The office addresses (OFFICE_EMAILS) can always do both.
--
-- A shared photo is a gallery_photos row with source 'upload'. Its files are in R2:
-- the original exactly as sent (private; original_key), and the web copy and thumbnail
-- (web_key, thumb_key) that the site serves at /api/gallery-photos/<id>/…. Status
-- 'pending' waits for review and 'rejected' was turned down (its files are removed).
-- Photos from the office and from leaders are published straight away.
--
-- gallery_uploads holds an upload between "a photo is coming" and "it has arrived":
-- the phone sends the file straight to R2, then the site prepares it and adds the
-- photo. The daily photo job clears any that never finished.

create table gallery_people (
  id         uuid primary key default gen_random_uuid(),
  email      text not null check (email = lower(email)),
  name       text not null,
  role       text not null check (role in ('uploader', 'leader')),
  added_by   text not null,
  added_at   timestamptz not null default now(),
  invited_at timestamptz,
  removed_at timestamptz,
  removed_by text
);

create unique index gallery_people_email_idx on gallery_people (email) where removed_at is null;

alter table gallery_photos
  add column original_key   text,
  add column web_key        text,
  add column thumb_key      text,
  add column original_name  text,
  add column original_bytes bigint,
  add column uploaded_by    text,
  add column uploader_name  text,
  add column batch_id       uuid,
  add column reviewed_by    text,
  add column reviewed_at    timestamptz;

create index gallery_photos_pending_idx on gallery_photos (created_at) where status = 'pending';
create index gallery_photos_uploaded_by_idx on gallery_photos (uploaded_by, created_at) where source = 'upload';

create table gallery_uploads (
  id            uuid primary key,
  uploaded_by   text not null,
  uploader_name text not null default '',
  batch_id      uuid not null,
  original_key  text not null,
  original_name text not null,
  content_type  text not null,
  bytes         bigint not null,
  event_id      uuid references gallery_events (id) on delete set null,
  caption       text not null default '',
  created_at    timestamptz not null default now()
);

create index gallery_uploads_by_idx on gallery_uploads (uploaded_by, created_at);
