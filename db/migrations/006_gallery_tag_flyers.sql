-- One-time: tag the 59 gallery images that aren't photos (flyers, posters, programs,
-- letters, schedules, logos and drawings), approved in the flyer review on 2026-11-14,
-- as Collection → "Flyers & posters". That tag is "only when chosen", so they leave the
-- gallery's main view and show under /gallery?collection=flyers-and-posters.
--
-- Runs before the gallery sync, so on a brand-new database (no photos yet) it tags
-- nothing; tags already there are left alone. Logged in audit_events like an office edit.
with flyers as (
  select p.id as photo_id, t.id as tag_id
  from gallery_photos p
  join gallery_tags t on t.tag_group = 'collection' and t.slug = 'flyers-and-posters'
  where p.src in (
    '/media/2022/12/soup-pdf.jpg',
    '/media/2022/12/ArmenianFlyer-pdf.jpg',
    '/media/2022/12/ACYO_April_Schedule-pdf.jpg',
    '/media/2022/07/image_50411009.jpg',
    '/media/2022/06/Copy-of-Fathers-day-brunch-Made-with-PosterMyWall-3.jpg',
    '/media/2022/03/Lent-Schedule-2022-2-1.png',
    '/media/2022/03/Lent-Schedule-2022-1.png',
    '/media/2022/01/BibleStudyFlyer-1.png',
    '/media/2021/08/Feast-of-Assumption-2.png',
    '/media/2021/08/Feast-of-Assumption-1.png',
    '/media/2021/04/image1.png',
    '/media/2021/03/Assembly-Chairman-Message-and-Ballot-Results2-pdf.jpg',
    '/media/2021/03/2021-Lent-Calendar-Booklet-Final-Schedule.png',
    '/media/2021/03/2021-Lent-Calendar-Booklet-Final-Letter-ENG.png',
    '/media/2021/03/2021-Lent-Calendar-Booklet-Final-Letter-ARM.png',
    '/media/2021/03/2021-Lent-Calendar-Booklet-Final-Cover.png',
    '/media/2021/02/St.-Mary-Lenten-Calendar.png',
    '/media/2021/02/St.-Mary-Lenten-Calendar-1.png',
    '/media/2021/02/Diarentaratch-2021-2.png',
    '/media/2021/02/2021-Annual-Parish-Assembly-Resolutions-Ballot-pdf.jpg',
    '/media/2021/02/2021-Annual-Parish-Assembly-Report-pdf.jpg',
    '/media/2021/01/Youghakin-Costa-Mesa-2021-4.png',
    '/media/2021/01/Youghakin-Costa-Mesa-2021-3.png',
    '/media/2021/01/Youghakin-Costa-Mesa-2021-2-1.png',
    '/media/2020/10/IMG_7376.png',
    '/media/2020/08/armenian_camp_041808_OL.png',
    '/media/2019/07/stmaryfestival2019.jpg',
    '/media/2019/03/IMG_1597.jpg',
    '/media/2019/03/IMG_1594.jpg',
    '/media/2019/03/IMG_1587.jpg',
    '/media/2018/09/St-Mary-Church-Site-landscape-Plan.jpg',
    '/media/2018/09/St-Mary-Church-Rendering_2.jpg',
    '/media/2018/09/St-Mary-Church-Rendering_1.jpg',
    '/media/2018/08/IMG_0938.jpg',
    '/media/2018/08/IMG_0789.png',
    '/media/2018/05/Dr.-Biricik-invite.jpg',
    '/media/2017/03/St-Mary-Armenian-Church-020917-Elevation.jpg',
    '/media/2017/03/St-Mary-Armenian-Church-020917-Courtyard.jpg',
    '/media/2017/03/St-Mary-Armenian-Church-020917-Concept.jpg',
    '/media/2015/10/Screen-shot-2015-10-10-at-3.08.47-PM.png',
    '/media/2015/07/Screen-shot-2015-07-24-at-6.00.20-PM.png',
    '/media/2015/07/Screen-shot-2015-07-24-at-5.53.06-PM.png',
    '/media/2015/05/kov-graduation.jpg',
    '/media/2015/04/Page1.jpg',
    '/media/2015/02/SAVE-THE-DATE.jpg',
    '/media/2014/12/Screen-shot-2014-12-04-at-5.19.02-PM.png',
    '/media/2014/11/monument_drawing-1.jpg',
    '/media/2014/09/Screen-shot-2014-09-06-at-8.51.50-AM.png',
    '/media/2014/09/2014FLYER_11x17WEB.jpg',
    '/media/2014/04/Untitled_BF1A.jpg',
    '/media/2014/04/Untitled_9FCD.jpg',
    '/media/2013/12/photo.jpg',
    '/media/2013/11/Christmas-Party-Invitation-2013.jpg',
    '/media/2013/09/ARMENIANFESTCOUPON.jpg',
    '/media/2013/08/Festival2013.jpg',
    '/media/2013/05/Fishermansnight2013-2.jpg',
    '/media/2012/11/newyear13.jpg',
    '/media/2012/08/zivartnots.png',
    '/media/2012/08/madagh.jpg'
  )
), added as (
  insert into gallery_photo_tags (photo_id, tag_id)
  select photo_id, tag_id from flyers
  on conflict do nothing
  returning photo_id
)
insert into audit_events (actor, action, detail)
select 'website update', 'gallery',
       jsonb_build_object('what', 'photos', 'count', count(*), 'addTag', 'flyers-and-posters', 'note', 'Flyer review approved 2026-11-14')
from added
having count(*) > 0;
