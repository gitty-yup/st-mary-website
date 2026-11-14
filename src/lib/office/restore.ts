/**
 * Rebuilds the certificate records from a backup: the Baptisms, Marriages and
 * History tabs of the backup Sheet (read directly or downloaded as CSV), or
 * the office's CSV downloads (records only, no history). Used by
 * scripts/restore-certificates.ts; see "Restoring from the backup" in the
 * README.
 *
 * A backup can't bring back: times finer than the minute, the hashed IP
 * addresses used to rate-limit the forms, and sign-in/backup/export history.
 */
import type { PoolClient } from 'pg';
import { dataKeys, fieldLabel, isIsoDate } from '@/certificates/fields';
import { INTAKE_FORMS, intakeColumnLabel, intakeKeys, intakeLabel } from '@/certificates/intake';
import type { CertificateType } from '@/certificates/types';
import { recordAudit } from '@/lib/office/audit';
import { STATUS_LABELS, type RecordStatus } from '@/lib/office/status';

/** A tab as rows of cells, header row first. */
export type Grid = string[][];

export interface BackupTabs {
  baptisms?: Grid;
  marriages?: Grid;
  history?: Grid;
}

export interface RestoredRecord {
  id: string;
  type: CertificateType;
  status: RecordStatus;
  source: 'public' | 'office';
  submitted_data: Record<string, string>;
  office_data: Record<string, string>;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  registry_number: string | null;
  registry_year: number | null;
  registry_seq: number | null;
  certificate_date: string | null;
  /** Parish time, "YYYY-MM-DD HH:MM". */
  issued_at: string | null;
  issued_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RestoredEvent {
  request_id: string;
  actor: string;
  action: string;
  detail: Record<string, unknown>;
  /** Parish time, "YYYY-MM-DD HH:MM". */
  created_at: string;
}

export interface ParsedBackup {
  records: RestoredRecord[];
  events: RestoredEvent[];
  /** Anything that couldn't be read exactly; shown before restoring. */
  problems: string[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PARISH_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const REGISTRY = /^[BM]-(\d{4})-(\d+)$/;
const STATUS_BY_LABEL = new Map<string, RecordStatus>(
  (Object.entries(STATUS_LABELS) as [RecordStatus, string][]).flatMap(([code, label]) => [
    [label, code],
    [code, code],
  ]),
);

/** Turns a form answer as the backup shows it (option label, MM/DD/YYYY) back into what was stored. */
function storedIntakeValue(type: CertificateType, key: string, shown: string): string {
  const field = INTAKE_FORMS[type].flatMap((s) => s.fields).find((f) => f.key === key);
  if (field?.kind === 'select') return field.options?.find((o) => o.label === shown)?.value ?? shown;
  const us = field?.kind === 'date' && /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(shown);
  return us ? `${us[3]}-${us[1]}-${us[2]}` : shown;
}

function parseRecords(type: CertificateType, grid: Grid, tab: string, problems: string[]): RestoredRecord[] {
  const [headers = [], ...rows] = grid;
  const certByLabel = new Map(dataKeys(type).map((k) => [fieldLabel(type, k), k]));
  // Column → form fields. Backups made before Nov 2026 labelled repeated answers
  // alike ("Form: Date of birth" for the groom, then the bride); the n-th such
  // column is the n-th field with that label, as they were written in order.
  const formByLabel = new Map<string, string[]>();
  for (const k of intakeKeys(type)) {
    const names = [`Form: ${intakeColumnLabel(type, k)}`, `Form: ${intakeLabel(type, k)}`];
    for (const h of names[0] === names[1] ? names.slice(1) : names) {
      formByLabel.set(h, [...(formByLabel.get(h) ?? []), k]);
    }
  }
  const fixed = new Set([
    'Registry number', 'Status', 'Certificate date', 'Issued', 'Issued by', 'Source',
    'Contact name', 'Contact email', 'Contact phone', 'Created', 'Last updated', 'Record ID',
  ]);
  const unknown = headers.filter((h) => h && !fixed.has(h) && !certByLabel.has(h) && !formByLabel.has(h));
  if (unknown.length) problems.push(`${tab}: columns not used by this version of the site, left out: ${unknown.join(', ')}`);
  if (!headers.includes('Record ID')) {
    problems.push(`${tab}: no "Record ID" column, so nothing can be restored from it.`);
    return [];
  }

  const out: RestoredRecord[] = [];
  rows.forEach((cells, i) => {
    const line = `${tab} row ${i + 2}`;
    const get = (h: string) => (cells[headers.indexOf(h)] ?? '').toString();
    if (cells.every((c) => !c)) return;
    const id = get('Record ID').trim();
    if (!UUID.test(id)) return void problems.push(`${line}: no valid Record ID; row skipped.`);

    const status = STATUS_BY_LABEL.get(get('Status').trim());
    if (!status) return void problems.push(`${line}: unknown status "${get('Status')}"; row skipped.`);

    const office: Record<string, string> = {};
    for (const key of dataKeys(type)) office[key] = '';
    const formValues: Record<string, string> = {};
    for (const key of intakeKeys(type)) formValues[key] = '';
    const seen = new Map<string, number>();
    headers.forEach((h, col) => {
      const v = (cells[col] ?? '').toString();
      const certKey = certByLabel.get(h);
      if (certKey) office[certKey] = v;
      const n = seen.get(h) ?? 0;
      seen.set(h, n + 1);
      const formKey = formByLabel.get(h)?.[n];
      if (formKey) formValues[formKey] = storedIntakeValue(type, formKey, v);
    });

    const source = get('Source') === 'Online form' ? 'public' : 'office';
    const registryNumber = get('Registry number').trim() || null;
    const reg = registryNumber ? REGISTRY.exec(registryNumber) : null;
    if (registryNumber && !reg) problems.push(`${line}: registry number "${registryNumber}" isn't in the B-YYYY-NNN form.`);
    const certificateDate = get('Certificate date').trim() || null;
    if (certificateDate && !isIsoDate(certificateDate)) problems.push(`${line}: certificate date "${certificateDate}" isn't YYYY-MM-DD.`);

    const time = (h: string, required: boolean) => {
      const v = get(h).trim();
      if (PARISH_TIME.test(v)) return v;
      if (v || required) problems.push(`${line}: "${h}" time "${v}" isn't YYYY-MM-DD HH:MM${required ? '; the restore time is used' : ''}.`);
      return null;
    };

    out.push({
      id: id.toLowerCase(),
      type,
      status,
      source,
      // Online submissions keep every form answer; office-entered records have none.
      submitted_data: source === 'public' || Object.values(formValues).some(Boolean) ? formValues : {},
      office_data: office,
      contact_name: get('Contact name') || null,
      contact_email: get('Contact email') || null,
      contact_phone: get('Contact phone') || null,
      registry_number: registryNumber,
      registry_year: reg ? Number(reg[1]) : null,
      registry_seq: reg ? Number(reg[2]) : null,
      certificate_date: certificateDate && isIsoDate(certificateDate) ? certificateDate : null,
      issued_at: time('Issued', false),
      issued_by: get('Issued by') || null,
      created_by: null,
      created_at: time('Created', true) ?? '',
      updated_at: time('Last updated', true) ?? '',
    });
  });
  return out;
}

function parseHistory(grid: Grid, ids: Set<string>, problems: string[]): RestoredEvent[] {
  const [headers = [], ...rows] = grid;
  const col = (h: string) => headers.indexOf(h);
  const [when, who, action, details, recordId] = ['When', 'Who', 'Action', 'Details', 'Record ID'].map(col);
  if ([when, who, action, recordId].some((c) => c < 0)) {
    problems.push('History: missing one of the When, Who, Action or Record ID columns; history left out.');
    return [];
  }
  const out: RestoredEvent[] = [];
  let unmatched = 0;
  rows.forEach((cells, i) => {
    if (cells.every((c) => !c)) return;
    const line = `History row ${i + 2}`;
    const id = (cells[recordId] ?? '').trim().toLowerCase();
    if (!ids.has(id)) return void unmatched++;
    let detail: Record<string, unknown> = {};
    const raw = details >= 0 ? (cells[details] ?? '').trim() : '';
    if (raw) {
      try {
        detail = JSON.parse(raw);
      } catch {
        problems.push(`${line}: details aren't readable; kept as text.`);
        detail = { text: raw };
      }
    }
    const at = (cells[when] ?? '').trim();
    if (!PARISH_TIME.test(at)) return void problems.push(`${line}: time "${at}" isn't YYYY-MM-DD HH:MM; entry skipped.`);
    out.push({ request_id: id, actor: cells[who] ?? '', action: cells[action] ?? '', detail, created_at: at });
  });
  if (unmatched) problems.push(`History: ${unmatched} entries belong to records not in the backup; left out.`);
  return out;
}

/** Reads the backup tabs. Nothing is written. */
export function parseBackup(tabs: BackupTabs): ParsedBackup {
  const problems: string[] = [];
  const records = [
    ...(tabs.baptisms ? parseRecords('baptism', tabs.baptisms, 'Baptisms', problems) : []),
    ...(tabs.marriages ? parseRecords('marriage', tabs.marriages, 'Marriages', problems) : []),
  ];

  const seen = new Set<string>();
  const numbers = new Set<string>();
  const unique = records.filter((r) => {
    if (seen.has(r.id)) return void problems.push(`Record ID ${r.id} appears twice; the second copy is left out.`);
    if (r.registry_number && numbers.has(r.registry_number)) {
      problems.push(`Registry number ${r.registry_number} appears on two records; the second keeps no number.`);
      Object.assign(r, { registry_number: null, registry_year: null, registry_seq: null });
    }
    seen.add(r.id);
    if (r.registry_number) numbers.add(r.registry_number);
    return true;
  });

  const events = tabs.history ? parseHistory(tabs.history, seen, problems) : [];
  if (!tabs.history) problems.push('No History tab: records are restored without their history.');
  // Office-entered records: who entered them is in their "create" history entry.
  for (const r of unique) {
    if (r.source === 'office') r.created_by = events.find((e) => e.request_id === r.id && e.action === 'create')?.actor ?? null;
  }
  return { records: unique, events, problems };
}

/**
 * Writes a parsed backup into an empty database (run inside a transaction).
 * Refuses if the database already has certificate records.
 */
export async function restoreBackup(client: PoolClient, backup: ParsedBackup, actor: string) {
  const { rows } = await client.query('select count(*)::int as n from certificate_requests');
  if (rows[0].n > 0) {
    throw new Error(`This database already has ${rows[0].n} certificate records. Restore only into an empty database.`);
  }
  const at = (v: string | null) => (v ? v : null);
  for (const r of backup.records) {
    await client.query(
      `insert into certificate_requests
         (id, type, status, source, submitted_data, office_data, contact_name, contact_email, contact_phone,
          registry_number, registry_year, registry_seq, certificate_date, issued_at, issued_by, created_by,
          created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
               $14::timestamp at time zone 'America/Los_Angeles', $15, $16,
               coalesce($17::timestamp at time zone 'America/Los_Angeles', now()),
               coalesce($18::timestamp at time zone 'America/Los_Angeles', now()))`,
      [
        r.id, r.type, r.status, r.source, JSON.stringify(r.submitted_data), JSON.stringify(r.office_data),
        r.contact_name, r.contact_email, r.contact_phone, r.registry_number, r.registry_year, r.registry_seq,
        r.certificate_date, at(r.issued_at), r.issued_by, r.created_by, at(r.created_at), at(r.updated_at),
      ],
    );
  }
  // Next numbers continue after the highest restored one, so no number is reused.
  await client.query(
    `insert into registry_counters (type, year, last_seq)
     select type, registry_year, max(registry_seq) from certificate_requests
     where registry_seq is not null group by type, registry_year
     on conflict (type, year) do update set last_seq = greatest(registry_counters.last_seq, excluded.last_seq)`,
  );
  for (const e of backup.events) {
    await client.query(
      `insert into audit_events (request_id, actor, action, detail, created_at)
       values ($1, $2, $3, $4, $5::timestamp at time zone 'America/Los_Angeles')`,
      [e.request_id, e.actor, e.action, JSON.stringify(e.detail), e.created_at],
    );
  }
  const counts = { records: backup.records.length, history: backup.events.length };
  await recordAudit(null, actor, 'restore', counts, client);
  return counts;
}
