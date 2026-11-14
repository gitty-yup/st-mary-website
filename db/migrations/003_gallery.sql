-- Photo gallery: photos, events (albums) and tags.
-- Site photos (public/media/YYYY/MM) are added by scripts/gallery-sync.js on every build.

create table gallery_events (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  event_date     date,
  description    text not null default '',
  cover_photo_id uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table gallery_photos (
  id           uuid primary key default gen_random_uuid(),
  -- 'site': a file in public/media; 'upload': sent in by a contributor (later).
  source       text not null check (source in ('site', 'upload')),
  -- Web-size image and thumbnail: site paths, or storage URLs for uploads.
  src          text not null unique,
  thumb_src    text not null,
  width        integer not null,
  height       integer not null,
  -- Date taken (camera date, else the folder's month). Shown as month and year.
  taken_on     date not null,
  caption      text not null default '',
  status       text not null default 'published' check (status in ('pending', 'published', 'hidden', 'rejected')),
  event_id     uuid references gallery_events (id) on delete set null,
  -- A site photo whose file is no longer in public/media (kept so its tags survive if it returns).
  file_missing boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index gallery_photos_public_idx on gallery_photos (taken_on desc) where status = 'published' and not file_missing;
create index gallery_photos_event_idx on gallery_photos (event_id);

alter table gallery_events
  add constraint gallery_events_cover_fk foreign key (cover_photo_id) references gallery_photos (id) on delete set null;

create table gallery_tags (
  id        uuid primary key default gen_random_uuid(),
  tag_group text not null check (tag_group in ('organization', 'occasion', 'people')),
  slug      text not null,
  label     text not null,
  unique (tag_group, slug)
);

create table gallery_photo_tags (
  photo_id uuid not null references gallery_photos (id) on delete cascade,
  tag_id   uuid not null references gallery_tags (id) on delete cascade,
  primary key (photo_id, tag_id)
);

create index gallery_photo_tags_tag_idx on gallery_photo_tags (tag_id);

-- Starting lists (from the Parish Life page); the office edits them under Photos → Tags.
insert into gallery_tags (tag_group, slug, label) values
  ('organization', 'hovsepian-choir', 'Hovsepian Choir'),
  ('organization', 'acyo', 'ACYO'),
  ('organization', 'ladies-society', 'Ladies Society'),
  ('organization', 'sunday-school', 'Sunday School'),
  ('organization', 'agbu-saturday-school', 'AGBU Saturday Armenian School'),
  ('organization', 'hye-camp', 'Hye Camp & Diocesan Retreats'),
  ('organization', 'parish-assembly', 'Parish Assembly'),
  ('organization', 'trust-fund', 'St. Mary Trust Fund'),
  ('organization', 'cultural-committee', 'Cultural Committee'),
  ('organization', 'mommy-and-me', 'Mommy & Me'),
  ('occasion', 'divine-liturgy', 'Divine Liturgy'),
  ('occasion', 'feast-day', 'Feast Day'),
  ('occasion', 'christmas', 'Christmas'),
  ('occasion', 'easter', 'Easter'),
  ('occasion', 'vartavar', 'Vartavar'),
  ('occasion', 'madagh', 'Madagh'),
  ('occasion', 'fundraiser', 'Fundraiser'),
  ('occasion', 'social', 'Social'),
  ('occasion', 'cultural-event', 'Cultural Event'),
  ('people', 'youth', 'Youth'),
  ('people', 'children', 'Children'),
  ('people', 'families', 'Families'),
  ('people', 'seniors', 'Seniors'),
  ('people', 'clergy', 'Clergy');
