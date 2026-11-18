-- A new event named while sharing photos (gallery step 2b).
--
-- On /share-photos, "+ New event" asks for the event's name and date. Photos from the
-- office and leaders go straight into the gallery, so their event is created at once.
-- Photos from people who only share carry the name and date as a suggestion: approving
-- them on Review creates the event (or uses an existing one with the same name and
-- date) and puts them in it; turning them down drops it.
alter table gallery_uploads
  add column suggested_event_title text,
  add column suggested_event_date  date;

alter table gallery_photos
  add column suggested_event_title text,
  add column suggested_event_date  date;
