/**
 * Certificate records: reading, creating, editing, and issuing (with automatic
 * registry numbers). Every change is written to audit_events.
 */
import { query, withTransaction } from '@/lib/db';
import { recordAudit } from '@/lib/office/audit';
import {
  SACRAMENT_DATE_FIELD,
  displayName,
  type OfficeData,
} from '@/certificates/fields';
import type { CertificateType } from '@/certificates/types';
import type { RecordStatus } from '@/lib/office/status';

export { STATUS_LABELS, type RecordStatus } from '@/lib/office/status';

export interface CertificateRecord {
  id: string;
  type: CertificateType;
  status: RecordStatus;
  source: 'public' | 'office';
  officeData: OfficeData;
  registryNumber: string | null;
  certificateDate: string | null;
  issuedAt: string | null;
  issuedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface RecordSummary {
  id: string;
  type: CertificateType;
  status: RecordStatus;
  name: string;
  sacramentDate: string;
  registryNumber: string | null;
  updatedAt: string;
}

export interface AuditEntry {
  actor: string;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class RecordError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type Row = Record<string, any>;

function iso(v: unknown): string | null {
  if (v == null) return null;
  return v instanceof Date ? v.toISOString() : String(v);
}

function toRecord(r: Row): CertificateRecord {
  return {
    id: r.id,
    type: r.type,
    status: r.status,
    source: r.source,
    officeData: r.office_data ?? {},
    registryNumber: r.registry_number,
    certificateDate: r.certificate_date,
    issuedAt: iso(r.issued_at),
    issuedBy: r.issued_by,
    createdBy: r.created_by,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
    version: r.version,
  };
}

export async function listRecords(limit = 300): Promise<RecordSummary[]> {
  const rows = await query(
    `select id, type, status, office_data, registry_number, updated_at
     from certificate_requests order by updated_at desc limit $1`,
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    name: displayName(r.type, r.office_data ?? {}),
    sacramentDate: (r.office_data ?? {})[SACRAMENT_DATE_FIELD[r.type as CertificateType]] ?? '',
    registryNumber: r.registry_number,
    updatedAt: iso(r.updated_at)!,
  }));
}

export async function getRecord(id: string): Promise<CertificateRecord | null> {
  if (!UUID.test(id)) return null;
  const rows = await query('select * from certificate_requests where id = $1', [id]);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function getAudit(id: string): Promise<AuditEntry[]> {
  if (!UUID.test(id)) return [];
  const rows = await query(
    'select actor, action, detail, created_at from audit_events where request_id = $1 order by created_at, id',
    [id],
  );
  return rows.map((r) => ({ actor: r.actor, action: r.action, detail: r.detail, createdAt: iso(r.created_at)! }));
}

/** Office-entered record (no public submission): starts ready to issue. */
export async function createRecord(type: CertificateType, data: OfficeData, actor: string): Promise<CertificateRecord> {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `insert into certificate_requests (type, status, source, office_data, created_by)
       values ($1, 'approved', 'office', $2, $3) returning *`,
      [type, JSON.stringify(data), actor],
    );
    await recordAudit(rows[0].id, actor, 'create', { source: 'office' }, client);
    return toRecord(rows[0]);
  });
}

/**
 * Saves edited certificate data. `version` must match the stored version, so
 * two people editing at once can't silently overwrite each other.
 */
export async function updateRecord(
  id: string,
  data: OfficeData,
  version: number,
  actor: string,
): Promise<CertificateRecord> {
  if (!UUID.test(id)) throw new RecordError('Record not found.', 404);
  return withTransaction(async (client) => {
    const current = (await client.query('select * from certificate_requests where id = $1 for update', [id])).rows[0];
    if (!current) throw new RecordError('Record not found.', 404);
    if (current.version !== version) {
      throw new RecordError('Someone else changed this record while you were editing. Reload to see their changes.', 409);
    }
    if (current.status === 'voided') throw new RecordError('Voided records cannot be edited.', 409);
    const before: OfficeData = current.office_data ?? {};
    const changes: Record<string, [string, string]> = {};
    for (const key of Object.keys(data)) {
      if ((before[key] ?? '') !== data[key]) changes[key] = [before[key] ?? '', data[key]];
    }
    if (!Object.keys(changes).length) return toRecord(current);
    const { rows } = await client.query(
      `update certificate_requests set office_data = $2, updated_at = now(), version = version + 1
       where id = $1 returning *`,
      [id, JSON.stringify({ ...before, ...data })],
    );
    await recordAudit(id, actor, 'update', { changes, afterIssue: current.status === 'issued' }, client);
    return toRecord(rows[0]);
  });
}

/** Today's date in the parish's time zone, as YYYY-MM-DD. */
export function parishToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
}

export function registryNumber(type: CertificateType, year: number, seq: number): string {
  return `${type === 'marriage' ? 'M' : 'B'}-${year}-${String(seq).padStart(3, '0')}`;
}

/**
 * Issues the certificate: assigns the next registry number for the
 * sacrament's year (B-2026-001, M-2026-001, …) and sets the certificate date
 * to today. Numbers are assigned once and never reused.
 */
export async function issueRecord(id: string, version: number, actor: string): Promise<CertificateRecord> {
  if (!UUID.test(id)) throw new RecordError('Record not found.', 404);
  return withTransaction(async (client) => {
    const current = (await client.query('select * from certificate_requests where id = $1 for update', [id])).rows[0];
    if (!current) throw new RecordError('Record not found.', 404);
    if (current.version !== version) {
      throw new RecordError('This record changed since you opened it. Reload and try again.', 409);
    }
    if (current.registry_number) return toRecord(current); // already issued
    if (current.status === 'voided' || current.status === 'declined') {
      throw new RecordError(`A ${current.status} record cannot be issued.`, 409);
    }
    const type = current.type as CertificateType;
    const sacramentDate: string = (current.office_data ?? {})[SACRAMENT_DATE_FIELD[type]] ?? '';
    const year = Number(sacramentDate.slice(0, 4));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sacramentDate) || year < 1900) {
      throw new RecordError(`Enter the date of ${type === 'marriage' ? 'marriage' : 'baptism'} before issuing.`, 400);
    }
    const { rows: counter } = await client.query(
      `insert into registry_counters (type, year, last_seq) values ($1, $2, 1)
       on conflict (type, year) do update set last_seq = registry_counters.last_seq + 1
       returning last_seq`,
      [type, year],
    );
    const seq: number = counter[0].last_seq;
    const number = registryNumber(type, year, seq);
    const { rows } = await client.query(
      `update certificate_requests
       set status = 'issued', registry_number = $2, registry_year = $3, registry_seq = $4,
           certificate_date = $5, issued_at = now(), issued_by = $6,
           updated_at = now(), version = version + 1
       where id = $1 returning *`,
      [id, number, year, seq, parishToday(), actor],
    );
    await recordAudit(id, actor, 'issue', { registryNumber: number }, client);
    return toRecord(rows[0]);
  });
}
