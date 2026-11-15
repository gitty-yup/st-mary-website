-- One-time: correct the date of 7 photos from the 2013 Armenian Festival, approved on
-- 2026-11-15. The Nikon camera that took them was set a year behind, so they say
-- Friday, October 5, 2012. The blog post that shows them ("2013 Festival Was a Great
-- Success", 2013-10-09) puts the festival on Saturday and Sunday, October 5–6, 2013,
-- and the eighth photo, from a phone, is dated October 6, 2013.
--
-- The gallery sync sets a photo's date only when it first adds it, so this sticks.
-- Only photos still showing the wrong date are changed. Does nothing on a brand-new
-- database (no photos yet). Logged in audit_events like an office edit.
with fixed as (
  update gallery_photos set taken_on = date '2013-10-05', updated_at = now()
  where src in (
    '/media/2013/10/fest1.jpg', '/media/2013/10/fest2.jpg', '/media/2013/10/fest3.jpg',
    '/media/2013/10/fest4.jpg', '/media/2013/10/fest5.jpg', '/media/2013/10/fest6.jpg',
    '/media/2013/10/fest8.jpg'
  )
  and taken_on = date '2012-10-05'
  returning id, src
)
insert into audit_events (actor, action, detail)
select 'website update', 'gallery',
       jsonb_build_object('what', 'photos', 'count', count(*), 'ids', jsonb_agg(id order by src), 'takenOn', '2013-10-05',
                          'files', jsonb_agg(src order by src), 'note', 'Camera a year behind; 2013 festival date approved 2026-11-15')
from fixed
having count(*) > 0;
