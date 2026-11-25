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
  hokijash: boolean;
  fellowship: boolean;
  arrangements: string;
  offering: string;
  /** 'online' (the website form) or 'paper' (typed in by the office). */
  source: 'online' | 'paper';
  /** Made on the day of the service. */
  sameDay: boolean;
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
    // Older entries may lack the anniversary/details fields.
    names: (r.names as Partial<RemembranceInput>[]).map((n) => ({ name: '', relationship: '', occasion: '', anniversary: '', details: '', ...n })),
    newsletter: r.newsletter,
    hokijash: r.hokijash,
    fellowship: r.fellowship,
    arrangements: r.arrangements,
    offering: r.offering,
    source: r.source === 'paper' ? 'paper' : 'online',
    sameDay: r.same_day,
  };
}

const COLUMNS =
  'id, created_at, service_date::text as service_date, name, address, city, state, zip, phone, email, others, names, newsletter, hokijash, fellowship, arrangements, offering, source, same_day';

export async function createRequiemRequest(
  d: RequiemInput,
  ipHash: string | null,
  how: { source: 'online' | 'paper'; sameDay: boolean } = { source: 'online', sameDay: false },
): Promise<RequiemRequest> {
  const rows = await query(
    `insert into requiem_requests (service_date, name, address, city, state, zip, phone, email, others, names, newsletter,
                                   hokijash, fellowship, arrangements, offering, client_ip_hash, source, same_day)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) returning ${COLUMNS}`,
    [d.serviceDate, d.name, d.address, d.city, d.state, d.zip, d.phone, d.email, d.others, JSON.stringify(d.names), d.newsletter,
      d.hokijash, d.fellowship, d.arrangements, d.offering, ipHash, how.source, how.sameDay],
  );
  return toRequest(rows[0]);
}

/** Records that a day's names sheet was opened for printing (the latest time is kept). */
export async function markNamesPrinted(serviceDate: string): Promise<void> {
  await query(
    'insert into requiem_prints (service_date, printed_at) values ($1, now()) on conflict (service_date) do update set printed_at = now()',
    [serviceDate],
  );
}

/** When each day's names sheet was last opened for printing: { 'YYYY-MM-DD': ISO time }. */
export async function namesPrintedTimes(): Promise<Record<string, string>> {
  const rows = await query('select service_date::text as d, printed_at from requiem_prints');
  return Object.fromEntries(rows.map((r: any) => [r.d, new Date(r.printed_at).toISOString()]));
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
