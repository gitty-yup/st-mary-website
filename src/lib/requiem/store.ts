import { query } from '@/lib/db';
import type { RemembranceInput, RequiemInput } from '@/lib/requiem/rules';

export interface RequiemRequest {
  id: string;
  createdAt: string;
  serviceDate: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  others: string;
  names: RemembranceInput[];
  newsletter: boolean;
}

function toRequest(r: any): RequiemRequest {
  return {
    id: r.id,
    createdAt: new Date(r.created_at).toISOString(),
    serviceDate: r.service_date,
    name: r.name,
    address: r.address,
    city: r.city,
    state: r.state,
    zip: r.zip,
    phone: r.phone,
    email: r.email,
    others: r.others,
    names: r.names,
    newsletter: r.newsletter,
  };
}

const COLUMNS = 'id, created_at, service_date::text as service_date, name, address, city, state, zip, phone, email, others, names, newsletter';

export async function createRequiemRequest(d: RequiemInput, ipHash: string | null): Promise<RequiemRequest> {
  const rows = await query(
    `insert into requiem_requests (service_date, name, address, city, state, zip, phone, email, others, names, newsletter, client_ip_hash)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning ${COLUMNS}`,
    [d.serviceDate, d.name, d.address, d.city, d.state, d.zip, d.phone, d.email, d.others, JSON.stringify(d.names), d.newsletter, ipHash],
  );
  return toRequest(rows[0]);
}

/** How many requests this connection sent in the last hour. */
export async function recentRequiemCount(ipHash: string): Promise<number> {
  const rows = await query("select count(*)::int as n from requiem_requests where client_ip_hash = $1 and created_at > now() - interval '1 hour'", [ipHash]);
  return rows[0].n;
}

/** Every request, by service date (newest Sunday first), then in the order they came in. */
export async function listRequiemRequests(): Promise<RequiemRequest[]> {
  return (await query(`select ${COLUMNS} from requiem_requests order by service_date desc, created_at`)).map(toRequest);
}

export async function deleteRequiemRequest(id: string): Promise<RequiemRequest | null> {
  const rows = await query(`delete from requiem_requests where id = $1 returning ${COLUMNS}`, [id]);
  return rows[0] ? toRequest(rows[0]) : null;
}
