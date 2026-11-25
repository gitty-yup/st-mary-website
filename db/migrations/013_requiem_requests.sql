-- Hokihankist (Requiem Service) requests from the website form (/requiem/request).
-- One row per request; the names to remember are a small list kept with it.
create table requiem_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- The Sunday the family asked for.
  service_date date not null,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  phone text not null,
  email text not null,
  -- "Others requesting the same service" (free text, optional).
  others text not null default '',
  -- [{ "name": "...", "relationship": "...", "occasion": "yotnorek|karasoonk|darelits|other" }]
  names jsonb not null,
  -- Asked to receive the parish's email newsletter.
  newsletter boolean not null default false,
  -- Salted hash of the sender's IP address: only to limit submissions per hour.
  client_ip_hash text
);

create index requiem_requests_service_date_idx on requiem_requests (service_date);
create index requiem_requests_ip_idx on requiem_requests (client_ip_hash, created_at) where client_ip_hash is not null;
