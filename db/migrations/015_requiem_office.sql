-- Hokihankist requests made at the parish office.
--  source:   'online' (the website form) or 'paper' (a paper form typed in by the office).
--  same_day: the request was for the day it was made (from the office's QR code or link, or
--            entered by the office), so it may have missed the printed names sheet.
alter table requiem_requests
  add column source text not null default 'online',
  add column same_day boolean not null default false;

-- Small named values for Hokihankist requests. 'same_day_token' is the secret in the office's
-- permanent same-day QR code and link; the office can replace it, which retires old signs.
create table requiem_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- When each service day's names sheet was last opened for printing, so the office list can
-- point out requests that came in afterwards.
create table requiem_prints (
  service_date date primary key,
  printed_at timestamptz not null default now()
);
