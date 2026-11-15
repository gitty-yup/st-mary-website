-- One-time: delete 14 duplicate gallery photos, approved on 2026-11-15 after the album
-- review: 10 copies uploaded again into 2022/12, and 4 re-saved copies ("-e…" and "…1"
-- file names) of photos that stay in the gallery.
--
-- Deleting works as the office's Delete button does: the copies leave the gallery now,
-- and on Vercel the gallery sync in the same build leaves their files out of the site
-- (scripts/gallery-sync.js). A copy that a blog post uses is skipped, as the office would.
-- Tags the office put on a copy are added to the photo that's kept, so none are lost.
-- Does nothing on a brand-new database (no photos yet). Logged in audit_events.
with pair (copy_src, kept_src) as (values
  ('/media/2022/12/CIMG96741.jpg', '/media/2012/08/CIMG9674.jpg'),
  ('/media/2022/12/DSCN5676.jpg', '/media/2013/12/DSCN5676.jpg'),
  ('/media/2022/12/DSCN5677.jpg', '/media/2013/12/DSCN5677.jpg'),
  ('/media/2022/12/DSCN5685.jpg', '/media/2013/12/DSCN5685.jpg'),
  ('/media/2022/12/DSCN5691.jpg', '/media/2013/12/DSCN5691.jpg'),
  ('/media/2022/12/DSCN5693.jpg', '/media/2013/12/DSCN5693.jpg'),
  ('/media/2022/12/DSCN5698.jpg', '/media/2013/12/DSCN5698.jpg'),
  ('/media/2022/12/IMG_6366.jpg', '/media/2012/08/IMG_6366.jpg'),
  ('/media/2022/12/choir4.jpg', '/media/2012/08/choir4.jpg'),
  ('/media/2022/12/zivart.jpg', '/media/2012/08/zivart.jpg'),
  ('/media/2018/11/IMG_1116-e1541538572297.jpg', '/media/2018/11/IMG_1116.jpg'),
  ('/media/2018/04/IMG_0024-e1522912965994.jpg', '/media/2018/04/IMG_0024.jpg'),
  ('/media/2018/04/IMG_0025-e1522912478752.jpg', '/media/2018/04/IMG_0025.jpg'),
  ('/media/2012/08/CIMG96811.jpg', '/media/2012/08/CIMG9681.jpg')
), dup as (
  select c.id, c.src, k.id as kept_id
  from pair
  join gallery_photos c on c.src = pair.copy_src
  left join gallery_photos k on k.src = pair.kept_src and k.deleted_at is null
  where c.deleted_at is null and c.used_in = '[]'::jsonb
), kept_tags as (
  insert into gallery_photo_tags (photo_id, tag_id)
  select dup.kept_id, t.tag_id
  from dup
  join gallery_photo_tags t on t.photo_id = dup.id
  where dup.kept_id is not null
  on conflict do nothing
  returning photo_id
), gone as (
  update gallery_photos p set deleted_at = now(), updated_at = now()
  from dup
  where p.id = dup.id
  returning p.id, p.src
)
insert into audit_events (actor, action, detail)
select 'website update', 'gallery',
       jsonb_build_object('what', 'photos', 'count', count(*), 'ids', jsonb_agg(id order by src), 'deleted', true,
                          'files', jsonb_agg(src order by src), 'tagsCopiedToKept', (select count(*) from kept_tags),
                          'note', 'Duplicate copies, deletion approved 2026-11-15')
from gone
having count(*) > 0;
