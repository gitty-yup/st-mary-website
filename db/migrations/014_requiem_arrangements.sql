-- Hokihankist requests: whether the family would like someone from the church to contact them
-- about a memorial meal (Hokijash) or sponsoring the Sunday fellowship hour, their notes about
-- it, and how they'd like to make the (optional) memorial offering ('online', 'church' or '').
-- The anniversary number and "other" occasion live in each entry of `names`.
alter table requiem_requests
  add column hokijash boolean not null default false,
  add column fellowship boolean not null default false,
  add column arrangements text not null default '',
  add column offering text not null default '';
