-- Public form submissions: a salted hash of the submitter's IP address, used
-- only to limit how many submissions one address can make per hour.
alter table certificate_requests add column client_ip_hash text;

create index certificate_requests_ip_idx on certificate_requests (client_ip_hash, created_at)
  where client_ip_hash is not null;
