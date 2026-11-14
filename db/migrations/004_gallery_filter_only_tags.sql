-- Tags whose photos stay out of the gallery's main view and appear only when a
-- visitor chooses the tag (e.g. flyers), and a fourth tag group, Collection,
-- for sets like that.

alter table gallery_tags add column filter_only boolean not null default false;

alter table gallery_tags drop constraint gallery_tags_tag_group_check;
alter table gallery_tags add constraint gallery_tags_tag_group_check
  check (tag_group in ('organization', 'occasion', 'people', 'collection'));

insert into gallery_tags (tag_group, slug, label, filter_only)
values ('collection', 'flyers-and-posters', 'Flyers & posters', true)
on conflict (tag_group, slug) do nothing;
