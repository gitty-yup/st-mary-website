-- Deleting photos from the office.
--
-- A deleted photo leaves the gallery and the office's lists at once. Each build
-- then leaves its files out of the deployment (unless a blog post or page still
-- shows it) and sets files_removed_at the first time; from then on the delete
-- can't be undone in the office. The row stays, so the build never adds the
-- photo back while its file is still in the repository.
alter table gallery_photos add column deleted_at timestamptz;
alter table gallery_photos add column files_removed_at timestamptz;

-- Blog posts and pages that show the photo, found by each build: [{ "title", "href" }].
alter table gallery_photos add column used_in jsonb not null default '[]';

drop index if exists gallery_photos_public_idx;
create index gallery_photos_public_idx on gallery_photos (taken_on desc)
  where status = 'published' and not file_missing and deleted_at is null;
