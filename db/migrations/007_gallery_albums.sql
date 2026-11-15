-- One-time: create the 19 event albums approved in the album review on 2026-11-15
-- (259 photos), each with the cover photo chosen there. Web addresses follow the
-- office rule: the name plus its year (/gallery?event=armenian-festival-2018).
--
-- Only photos that have no event yet are added, so anything the office has already
-- put in an event stays there. An album is created only if it gets photos, so on a
-- brand-new database (no photos yet) this does nothing, and an event whose web address
-- the office already uses is left alone. Logged in audit_events like an office edit.
with album (n, slug, title, event_date, cover_src, srcs) as (values
  -- 1. Oct 6–7, 2018: 51 photos
  (1, 'armenian-festival-2018', 'Armenian Festival', date '2018-10-06', '/media/2018/11/IMG_1158.jpg', array[
      '/media/2018/11/IMG_1053.jpg', '/media/2018/11/IMG_1057.jpg', '/media/2018/11/IMG_1059.jpg',
      '/media/2018/11/IMG_1063.jpg', '/media/2018/11/IMG_1073.jpg', '/media/2018/11/IMG_1086.jpg',
      '/media/2018/11/IMG_1087.jpg', '/media/2018/11/IMG_1088.jpg', '/media/2018/11/IMG_1091.jpg',
      '/media/2018/11/IMG_1092.jpg', '/media/2018/11/IMG_1093.jpg', '/media/2018/11/IMG_1095.jpg',
      '/media/2018/11/IMG_1096.jpg', '/media/2018/11/IMG_1097.jpg', '/media/2018/11/IMG_1098.jpg',
      '/media/2018/11/IMG_1099.jpg', '/media/2018/11/IMG_1100.jpg', '/media/2018/11/IMG_1101.jpg',
      '/media/2018/11/IMG_1102.jpg', '/media/2018/11/IMG_1111.jpg', '/media/2018/11/IMG_1116.jpg',
      '/media/2018/11/IMG_1122.jpg', '/media/2018/11/IMG_1124.jpg', '/media/2018/11/IMG_1129.jpg',
      '/media/2018/11/IMG_1130.jpg', '/media/2018/11/IMG_1132.jpg', '/media/2018/11/IMG_1134.jpg',
      '/media/2018/11/IMG_1136.jpg', '/media/2018/11/IMG_1137.jpg', '/media/2018/11/IMG_1140.jpg',
      '/media/2018/11/IMG_1141.jpg', '/media/2018/11/IMG_1149.jpg', '/media/2018/11/IMG_1153.jpg',
      '/media/2018/11/IMG_1155.jpg', '/media/2018/11/IMG_1156.jpg', '/media/2018/11/IMG_1158.jpg',
      '/media/2018/11/IMG_1160.jpg', '/media/2018/11/IMG_1161.jpg', '/media/2018/11/IMG_1162.jpg',
      '/media/2018/11/IMG_1167.jpg', '/media/2018/11/IMG_1170.jpg', '/media/2018/11/IMG_1171.jpg',
      '/media/2018/11/IMG_1172.jpg', '/media/2018/11/IMG_1173.jpg', '/media/2018/11/IMG_1174.jpg',
      '/media/2018/11/IMG_1175.jpg', '/media/2018/11/IMG_1176.jpg', '/media/2018/11/IMG_1177.jpg',
      '/media/2018/11/IMG_1178.jpg', '/media/2018/11/IMG_1179.jpg', '/media/2018/11/IMG_1180.jpg'
    ]),
  -- 2. Apr 1, 2018: 17 photos
  (2, 'easter-2018', 'Easter', date '2018-04-01', '/media/2018/04/IMG_0135.jpg', array[
      '/media/2018/04/IMG_0125.jpg', '/media/2018/04/IMG_0127.jpg', '/media/2018/04/IMG_0131.jpg',
      '/media/2018/04/IMG_0133.jpg', '/media/2018/04/IMG_0134.jpg', '/media/2018/04/IMG_0135.jpg',
      '/media/2018/04/IMG_0141.jpg', '/media/2018/04/IMG_0144.jpg', '/media/2018/04/IMG_0156.jpg',
      '/media/2018/04/IMG_0161.jpg', '/media/2018/04/IMG_0166.jpg', '/media/2018/04/IMG_0167.jpg',
      '/media/2018/04/IMG_0169.jpg', '/media/2018/04/IMG_0172.jpg', '/media/2018/04/IMG_0174.jpg',
      '/media/2018/04/IMG_0184.jpg', '/media/2018/04/IMG_0189.jpg'
    ]),
  -- 3. Mar 29–30, 2018: 22 photos
  (3, 'holy-week-2018', 'Holy Week', date '2018-03-29', '/media/2018/04/IMG_0095.jpg', array[
      '/media/2018/04/20180330_192410_1522960021690_resized.jpg', '/media/2018/04/20180330_192430_1522960018022_resized.jpg', '/media/2018/04/20180330_195446_1522960014464_resized.jpg',
      '/media/2018/04/20180330_195556_1522960012705_resized.jpg', '/media/2018/04/20180330_200725_1522960009138_resized.jpg', '/media/2018/04/20180330_201155_1522960004864_resized.jpg',
      '/media/2018/04/20180330_201210_1522960002434_resized.jpg', '/media/2018/04/20180330_201515_1522959999712_resized.jpg', '/media/2018/04/20180330_201747_1522959997773_resized.jpg',
      '/media/2018/04/20180330_201919_1522959996085_resized.jpg', '/media/2018/04/IMG_0070.jpg', '/media/2018/04/IMG_0076.jpg',
      '/media/2018/04/IMG_0077.jpg', '/media/2018/04/IMG_0082.jpg', '/media/2018/04/IMG_0091.jpg',
      '/media/2018/04/IMG_0095.jpg', '/media/2018/04/IMG_0101.jpg', '/media/2018/04/IMG_0104.jpg',
      '/media/2018/04/IMG_0110.jpg', '/media/2018/04/IMG_0111.jpg', '/media/2018/04/IMG_0115.jpg',
      '/media/2018/04/IMG_0116.jpg'
    ]),
  -- 4. Mar 25, 2018: 23 photos
  (4, 'palm-sunday-2018', 'Palm Sunday', date '2018-03-25', '/media/2018/04/IMG_0033.jpg', array[
      '/media/2018/04/IMG_0006.jpg', '/media/2018/04/IMG_0013.jpg', '/media/2018/04/IMG_0014.jpg',
      '/media/2018/04/IMG_0016.jpg', '/media/2018/04/IMG_0018.jpg', '/media/2018/04/IMG_0021.jpg',
      '/media/2018/04/IMG_0023.jpg', '/media/2018/04/IMG_0024.jpg', '/media/2018/04/IMG_0025.jpg',
      '/media/2018/04/IMG_0032.jpg', '/media/2018/04/IMG_0033.jpg', '/media/2018/04/IMG_0036.jpg',
      '/media/2018/04/IMG_0038.jpg', '/media/2018/04/IMG_0039.jpg', '/media/2018/04/IMG_0040.jpg',
      '/media/2018/04/IMG_0041.jpg', '/media/2018/04/IMG_0043.jpg', '/media/2018/04/IMG_0044.jpg',
      '/media/2018/04/IMG_0048.jpg', '/media/2018/04/IMG_0050.jpg', '/media/2018/04/IMG_0052.jpg',
      '/media/2018/04/IMG_0060.jpg', '/media/2018/04/PS1IMG_0003.jpg'
    ]),
  -- 5. Feb 4, 2018: 3 photos
  (5, 'soup-er-bowl-sunday-2018', 'Soup-er Bowl Sunday', date '2018-02-04', '/media/2018/03/20180204_121803.jpg', array[
      '/media/2018/03/20180204_115632.jpg', '/media/2018/03/20180204_121803.jpg', '/media/2018/03/20180204_123113.jpg'
    ]),
  -- 6. spring 2018: 5 photos
  (6, 'childrens-cooking-class', 'Children’s Cooking Class', null::date, '/media/2018/04/FB_IMG_1526742263700.jpg', array[
      '/media/2018/04/FB_IMG_1526742250517.jpg', '/media/2018/04/FB_IMG_1526742263700.jpg', '/media/2018/04/FB_IMG_1526742288463.jpg',
      '/media/2018/04/FB_IMG_1526742333362.jpg', '/media/2018/04/FB_IMG_1526742403410.jpg'
    ]),
  -- 7. Jun 24–25, 2017: 32 photos
  (7, '25th-consecration-anniversary-2017', '25th Consecration Anniversary', date '2017-06-24', '/media/2017/07/IMG_8934-5.jpg', array[
      '/media/2017/07/IMG_8620.jpg', '/media/2017/07/IMG_8676.jpg', '/media/2017/07/IMG_8694.jpg',
      '/media/2017/07/IMG_8701.jpg', '/media/2017/07/IMG_8719.jpg', '/media/2017/07/IMG_8721.jpg',
      '/media/2017/07/IMG_8733.jpg', '/media/2017/07/IMG_8741.jpg', '/media/2017/07/IMG_8770.jpg',
      '/media/2017/07/IMG_8779.jpg', '/media/2017/07/IMG_8786.jpg', '/media/2017/07/IMG_8830.jpg',
      '/media/2017/07/IMG_8841.jpg', '/media/2017/07/IMG_8855.jpg', '/media/2017/07/IMG_8861.jpg',
      '/media/2017/07/IMG_8904.jpg', '/media/2017/07/IMG_8906.jpg', '/media/2017/07/IMG_8913.jpg',
      '/media/2017/07/IMG_8923.jpg', '/media/2017/07/IMG_8931.jpg', '/media/2017/07/IMG_8934-5.jpg',
      '/media/2017/07/IMG_8942.jpg', '/media/2017/07/IMG_8952.jpg', '/media/2017/07/IMG_8958.jpg',
      '/media/2017/07/IMG_8971.jpg', '/media/2017/07/IMG_8993.jpg', '/media/2017/07/IMG_9005.jpg',
      '/media/2017/07/IMG_9016.jpg', '/media/2017/07/IMG_9020.jpg', '/media/2017/07/IMG_9033.jpg',
      '/media/2017/07/IMG_9039.jpg', '/media/2017/07/IMG_9049.jpg'
    ]),
  -- 8. Mar 7–8, 2015: 31 photos
  (8, 'genocide-centennial-and-martyrs-monument-dedication-2015', 'Genocide Centennial and Martyrs Monument Dedication', date '2015-03-08', '/media/2015/04/002-DSC_6021.jpg', array[
      '/media/2015/04/002-DSC_6021.jpg', '/media/2015/04/010-DSC_2152.jpg', '/media/2015/04/065-DSC_2214.jpg',
      '/media/2015/04/127-DSC_6155.jpg', '/media/2015/04/130-DSC_6158.jpg', '/media/2015/04/133-DSC_2285.jpg',
      '/media/2015/04/140-DSC_2292.jpg', '/media/2015/04/182-DSC_6212.jpg', '/media/2015/04/187-DSC_6217.jpg',
      '/media/2015/04/198-DSC_6228.jpg', '/media/2015/04/225-DSC_6277.jpg', '/media/2015/04/232-DSC_6284.jpg',
      '/media/2015/04/236-DSC_6289.jpg', '/media/2015/04/240-DSC_6293.jpg', '/media/2015/04/252-DSC_6305.jpg',
      '/media/2015/04/269-DSC_6324.jpg', '/media/2015/04/281-DSC_6346.jpg', '/media/2015/04/286-DSC_6352.jpg',
      '/media/2015/04/294-DSC_6362.jpg', '/media/2015/04/308-DSC_6378.jpg', '/media/2015/04/311-DSC_6382.jpg',
      '/media/2015/04/316-DSC_6387.jpg', '/media/2015/04/319-DSC_6390.jpg', '/media/2015/04/323-DSC_6395.jpg',
      '/media/2015/04/330-DSC_6402.jpg', '/media/2015/04/339-DSC_6412.jpg', '/media/2015/04/343-DSC_6416.jpg',
      '/media/2015/04/345-DSC_6418.jpg', '/media/2015/04/361-DSC_6435.jpg', '/media/2015/04/370-DSC_6451.jpg',
      '/media/2015/04/372-DSC_6454.jpg'
    ]),
  -- 9. Sep–Nov 2014: 4 photos
  (9, 'building-the-martyrs-monument-2014', 'Building the Martyrs Monument', date '2014-09-13', '/media/2014/11/DSCN0130.jpg', array[
      '/media/2014/11/20141025_090609-1.jpg', '/media/2014/11/DSCN0009.jpg', '/media/2014/11/DSCN0013.jpg',
      '/media/2014/11/DSCN0130.jpg'
    ]),
  -- 10. Aug 2–3, 2014: 10 photos
  (10, 'sunday-school-retreat-2014', 'Sunday School Retreat', date '2014-08-02', '/media/2014/09/DSCN6102.jpg', array[
      '/media/2014/09/DSCN6077.jpg', '/media/2014/09/DSCN6081.jpg', '/media/2014/09/DSCN6084.jpg',
      '/media/2014/09/DSCN6085.jpg', '/media/2014/09/DSCN6089.jpg', '/media/2014/09/DSCN6091.jpg',
      '/media/2014/09/DSCN6097-e1410028779269.jpg', '/media/2014/09/DSCN6097.jpg', '/media/2014/09/DSCN6098.jpg',
      '/media/2014/09/DSCN6102.jpg'
    ]),
  -- 11. Dec 8, 2013: 8 photos
  (11, 'december-luncheon-2013', 'December Luncheon', date '2013-12-08', '/media/2013/12/DSCN5678.jpg', array[
      '/media/2013/12/DSCN5676.jpg', '/media/2013/12/DSCN5677.jpg', '/media/2013/12/DSCN5678.jpg',
      '/media/2013/12/DSCN5679.jpg', '/media/2013/12/DSCN5683.jpg', '/media/2013/12/DSCN5684.jpg',
      '/media/2013/12/DSCN5685.jpg', '/media/2013/12/DSCN5691.jpg'
    ]),
  -- 12. Oct 5–6, 2013: 8 photos
  (12, 'armenian-festival-2013', 'Armenian Festival', date '2013-10-05', '/media/2013/10/fest4.jpg', array[
      '/media/2013/10/fest1.jpg', '/media/2013/10/fest2.jpg', '/media/2013/10/fest3.jpg',
      '/media/2013/10/fest4.jpg', '/media/2013/10/fest5.jpg', '/media/2013/10/fest6.jpg',
      '/media/2013/10/fest7.jpg', '/media/2013/10/fest8.jpg'
    ]),
  -- 13. Jan 6, 2013: 2 photos
  (13, 'christmas-2013', 'Christmas', date '2013-01-06', '/media/2022/12/2013-01-06_13-44-45_448.jpg', array[
      '/media/2022/12/2013-01-06_13-43-51_177.jpg', '/media/2022/12/2013-01-06_13-44-45_448.jpg'
    ]),
  -- 14. Aug 10–12, 2012: 13 photos
  (14, 'grape-and-madagh-blessing-2012', 'Grape and Madagh Blessing', date '2012-08-12', '/media/2012/08/dscn1256.jpg', array[
      '/media/2012/08/dscn1254.jpg', '/media/2012/08/dscn1256.jpg', '/media/2012/08/dscn1257.jpg',
      '/media/2012/08/dscn1259.jpg', '/media/2012/08/dscn1264.jpg', '/media/2012/08/dscn1265.jpg',
      '/media/2012/08/dscn1270.jpg', '/media/2012/08/dscn1272.jpg', '/media/2012/08/dscn1278.jpg',
      '/media/2012/08/dscn1284.jpg', '/media/2012/08/dscn1289.jpg', '/media/2012/08/dscn1298.jpg',
      '/media/2012/08/dscn1317.jpg'
    ]),
  -- 15. Jul 28, 2012: 6 photos
  (15, 'vacation-bible-school-sleepover-2012', 'Vacation Bible School Sleepover', date '2012-07-28', '/media/2012/08/dscn1201.jpg', array[
      '/media/2012/08/dscn1184.jpg', '/media/2012/08/dscn1186.jpg', '/media/2012/08/dscn1189.jpg',
      '/media/2012/08/dscn1193.jpg', '/media/2012/08/dscn1201.jpg', '/media/2012/08/dscn1202.jpg'
    ]),
  -- 16. probably 2009: 11 photos
  (16, 'halloween-party', 'Halloween Party', null::date, '/media/2012/08/CIMG9677.jpg', array[
      '/media/2012/08/CIMG9665.jpg', '/media/2012/08/CIMG9669.jpg', '/media/2012/08/CIMG9671.jpg',
      '/media/2012/08/CIMG9673.jpg', '/media/2012/08/CIMG9674.jpg', '/media/2012/08/CIMG9677.jpg',
      '/media/2012/08/CIMG9679.jpg', '/media/2012/08/CIMG9681.jpg', '/media/2012/08/IMG_5556.jpg',
      '/media/2012/08/IMG_6050.jpg', '/media/2012/08/IMG_6060.jpg'
    ]),
  -- 17. year unknown: 4 photos
  (17, 'mommy-and-me-picnic', 'Mommy & Me Picnic', null::date, '/media/2012/08/MommyMe-Picnic-160.jpg', array[
      '/media/2012/08/MommyMe-Picnic-155.jpg', '/media/2012/08/MommyMe-Picnic-159.jpg', '/media/2012/08/MommyMe-Picnic-160.jpg',
      '/media/2012/08/MommyMe-Picnic-162.jpg'
    ]),
  -- 18. Dec 19, 2009: 5 photos
  (18, 'acyo-christmas-party-2009', 'ACYO Christmas Party', date '2009-12-19', '/media/2012/08/IMG_6372.jpg', array[
      '/media/2012/08/IMG_6363-1.jpg', '/media/2012/08/IMG_6366.jpg', '/media/2012/08/IMG_6372.jpg',
      '/media/2012/08/IMG_6373.jpg', '/media/2012/08/IMG_6374.jpg'
    ]),
  -- 19. Nov 7, 2009: 4 photos
  (19, 'choir-gathering-2009', 'Choir Gathering', date '2009-11-07', '/media/2012/08/choir4.jpg', array[
      '/media/2012/08/choir1.jpg', '/media/2012/08/choir2.jpg', '/media/2012/08/choir3.jpg',
      '/media/2012/08/choir4.jpg'
    ])
), pic as (
  select a.slug, p.id, p.src
  from album a
  cross join lateral unnest(a.srcs) as s(src)
  join gallery_photos p on p.src = s.src
  where p.event_id is null
), ev as (
  insert into gallery_events (slug, title, event_date, cover_photo_id)
  select a.slug, a.title, a.event_date,
         (select pic.id from pic where pic.slug = a.slug and pic.src = a.cover_src)
  from album a
  where exists (select 1 from pic where pic.slug = a.slug)
  on conflict (slug) do nothing
  returning id, slug, title, event_date, cover_photo_id
), moved as (
  update gallery_photos p set event_id = ev.id, updated_at = now()
  from pic
  join ev on ev.slug = pic.slug
  where p.id = pic.id
  returning ev.id as event_id
)
insert into audit_events (actor, action, detail)
select 'website update', 'gallery',
       jsonb_build_object('what', 'event', 'id', ev.id, 'title', ev.title, 'eventDate', ev.event_date::text,
                          'created', true, 'photos', count(moved.event_id), 'coverPhotoId', ev.cover_photo_id,
                          'note', 'Album review approved 2026-11-15')
from ev
left join moved on moved.event_id = ev.id
group by ev.id, ev.title, ev.event_date, ev.cover_photo_id
order by ev.event_date desc nulls last, ev.title;
