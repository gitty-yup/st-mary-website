-- Sacramental certificate requests, registry numbering, office sign-in, audit trail.

create table certificate_requests (
  id               uuid primary key default gen_random_uuid(),
  type             text not null check (type in ('baptism', 'marriage')),
  status           text not null check (status in ('submitted', 'needs_info', 'approved', 'issued', 'declined', 'voided')),
  source           text not null check (source in ('public', 'office')),
  -- Exactly what the family submitted (public form). Never edited afterwards.
  submitted_data   jsonb not null default '{}'::jsonb,
  -- The certificate fields as reviewed/edited by the office. This is what prints.
  office_data      jsonb not null default '{}'::jsonb,
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  -- Assigned once, on first issue. Never reused, even if the record is voided.
  registry_number  text unique,
  registry_year    integer,
  registry_seq     integer,
  certificate_date date,
  issued_at        timestamptz,
  issued_by        text,
  created_by       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Optimistic locking: every update must name the version it was based on.
  version          integer not null default 1
);

create index certificate_requests_status_idx on certificate_requests (status, updated_at desc);
create index certificate_requests_updated_idx on certificate_requests (updated_at desc);

create table registry_counters (
  type     text not null check (type in ('baptism', 'marriage')),
  year     integer not null,
  last_seq integer not null,
  primary key (type, year)
);

create table audit_events (
  id         bigserial primary key,
  request_id uuid references certificate_requests (id) on delete set null,
  actor      text not null,
  action     text not null,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_request_idx on audit_events (request_id, created_at);

-- Office sign-in. Only SHA-256 hashes of tokens are stored.
create table office_login_tokens (
  token_hash text primary key,
  email      text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz
);

create index office_login_tokens_email_idx on office_login_tokens (email, created_at desc);

create table office_sessions (
  token_hash   text primary key,
  email        text not null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at   timestamptz
);
