/**
 * Tables of every certificate record, used by the CSV download and the
 * nightly Google Sheets backup. One table per certificate type, plus the
 * history of every record.
 */
import { dataKeys, fieldLabel, type OfficeData } from '@/certificates/fields';
import { intakeDisplayValue, intakeKeys, intakeLabel } from '@/certificates/intake';
import type { CertificateType } from '@/certificates/types';
import { query } from '@/lib/db';
import { STATUS_LABELS, type RecordStatus } from '@/lib/office/status';

export interface Table {
  headers: string[];
  rows: string[][];
}

const TZ = 'America/Los_Angeles';

/** "2026-11-10 14:05" in parish time. */
export function parishDateTime(v: unknown): string {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(String(v));
  if (isNaN(d.getTime())) return '';
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** Every record of one type: registry details, certificate fields, then what the family submitted. */
export async function recordsTable(type: CertificateType): Promise<Table> {
  const rows = await query(
    `select * from certificate_requests where type = $1
     order by registry_year nulls last, registry_seq nulls last, created_at`,
    [type],
  );
  const certKeys = dataKeys(type);
  // Form answers that aren't already certificate fields (addresses, marital status, notes…).
  const formKeys = intakeKeys(type);
  const headers = [
    'Registry number',
    'Status',
    'Certificate date',
    'Issued',
    'Issued by',
    ...certKeys.map((k) => fieldLabel(type, k)),
    'Source',
    'Contact name',
    'Contact email',
    'Contact phone',
    ...formKeys.map((k) => `Form: ${intakeLabel(type, k)}`),
    'Created',
    'Last updated',
    'Record ID',
  ];
  return {
    headers,
    rows: rows.map((r) => {
      const office: OfficeData = r.office_data ?? {};
      const submitted: Record<string, string> = r.submitted_data ?? {};
      return [
        r.registry_number ?? '',
        STATUS_LABELS[r.status as RecordStatus] ?? r.status,
        r.certificate_date ?? '',
        parishDateTime(r.issued_at),
        r.issued_by ?? '',
        ...certKeys.map((k) => office[k] ?? ''),
        r.source === 'public' ? 'Online form' : 'Office',
        r.contact_name ?? '',
        r.contact_email ?? '',
        r.contact_phone ?? '',
        ...formKeys.map((k) => intakeDisplayValue(type, k, submitted[k] ?? '')),
        parishDateTime(r.created_at),
        parishDateTime(r.updated_at),
        r.id,
      ];
    }),
  };
}

/** Every recorded action on every record (sign-ins excluded). */
export async function historyTable(): Promise<Table> {
  const rows = await query(
    `select a.created_at, a.actor, a.action, a.detail, r.type, r.registry_number, r.office_data, r.id
     from audit_events a join certificate_requests r on r.id = a.request_id
     order by a.created_at, a.id`,
  );
  return {
    headers: ['When', 'Who', 'Action', 'Type', 'Registry number', 'Name', 'Details', 'Record ID'],
    rows: rows.map((r) => [
      parishDateTime(r.created_at),
      r.actor,
      r.action,
      r.type === 'marriage' ? 'Marriage' : 'Baptism',
      r.registry_number ?? '',
      recordName(r.type, r.office_data ?? {}),
      Object.keys(r.detail ?? {}).length ? JSON.stringify(r.detail) : '',
      r.id,
    ]),
  };
}

function recordName(type: CertificateType, d: OfficeData): string {
  return type === 'marriage'
    ? [d.groom_name_en, d.bride_name_en].filter(Boolean).join(' & ')
    : d.baptized_name_en ?? '';
}

/**
 * CSV with a byte-order mark so Excel reads Armenian correctly. Cells that
 * start with = + - @ are prefixed with ' so spreadsheets don't run them as
 * formulas.
 */
export function toCsv({ headers, rows }: Table): string {
  const cell = (v: string) => {
    let s = v ?? '';
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

