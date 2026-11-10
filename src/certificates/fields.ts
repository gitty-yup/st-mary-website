/**
 * Editable certificate fields, grouped for forms. Shared by the office editor,
 * the API validation, and (Phase 3) the public intake forms and email summary.
 *
 * Stored record data ("office data") uses the certificate's own keys, except
 * that dates are ISO `YYYY-MM-DD`; `toCertificateData()` converts to the
 * printed `MM/DD/YYYY`. `certificate_date` and `registry_number` are never
 * part of the editable data: they are set when the certificate is issued.
 */
import type { BaptismCertificateData, CertificateType, MarriageCertificateData } from './types';
import { BAPTISM_DEFAULTS, MARRIAGE_DEFAULTS } from './defaults';

export type OfficeData = Record<string, string>;

export interface FieldDef {
  /** Base key. Bilingual fields store `${key}_en` and `${key}_hy`. */
  key: string;
  label: string;
  kind: 'bilingual' | 'text' | 'date';
  help?: string;
}

export interface FieldSection {
  title: string;
  fields: FieldDef[];
  /** Parish details rarely change; forms may collapse them. */
  parish?: boolean;
}

const PARISH_SECTION: FieldSection = {
  title: 'Parish details',
  parish: true,
  fields: [
    { key: 'officiant', label: 'Officiant', kind: 'bilingual' },
    { key: 'parish_church', label: 'Parish church', kind: 'bilingual' },
    { key: 'city_state', label: 'City and state', kind: 'bilingual' },
    {
      key: 'signature',
      label: 'Printed under the signature line',
      kind: 'bilingual',
      help: 'Usually left blank; the priest signs by hand.',
    },
  ],
};

export const CERTIFICATE_FIELDS: Record<CertificateType, FieldSection[]> = {
  baptism: [
    {
      title: 'Person baptized',
      fields: [
        { key: 'baptized_name', label: 'Name of the baptized', kind: 'bilingual' },
        { key: 'birth_date', label: 'Date of birth', kind: 'date' },
        { key: 'birth_place', label: 'Place of birth', kind: 'bilingual' },
      ],
    },
    {
      title: 'Parents',
      fields: [
        { key: 'father_name', label: 'Father’s name', kind: 'bilingual' },
        { key: 'mother_name', label: 'Mother’s name', kind: 'bilingual' },
      ],
    },
    {
      title: 'Sacrament',
      fields: [
        { key: 'baptism_date', label: 'Date of baptism', kind: 'date' },
        { key: 'godfather', label: 'Godfather', kind: 'bilingual' },
      ],
    },
    PARISH_SECTION,
  ],
  marriage: [
    {
      title: 'Couple',
      fields: [
        { key: 'groom_name', label: 'Name of groom', kind: 'bilingual' },
        { key: 'bride_name', label: 'Name of bride', kind: 'bilingual' },
      ],
    },
    {
      title: 'Sacrament',
      fields: [
        { key: 'marriage_date', label: 'Date of marriage', kind: 'date' },
        { key: 'brother_cross', label: 'Brother-in-the-Cross', kind: 'bilingual' },
        { key: 'matron_honor', label: 'Matron of Honor', kind: 'bilingual' },
      ],
    },
    {
      title: 'Marriage license',
      fields: [
        { key: 'marriage_license_number', label: 'License number', kind: 'text' },
        { key: 'license_county', label: 'Issued at the county of', kind: 'text' },
        { key: 'license_state', label: 'State', kind: 'text' },
      ],
    },
    PARISH_SECTION,
  ],
};

export const SACRAMENT_DATE_FIELD: Record<CertificateType, string> = {
  baptism: 'baptism_date',
  marriage: 'marriage_date',
};

export const MAX_FIELD_LENGTH = 200;

/** Every stored key for a type, e.g. baptized_name_en, baptized_name_hy, birth_date… */
export function dataKeys(type: CertificateType): string[] {
  return CERTIFICATE_FIELDS[type].flatMap((s) =>
    s.fields.flatMap((f) => (f.kind === 'bilingual' ? [`${f.key}_en`, `${f.key}_hy`] : [f.key])),
  );
}

export function dateKeys(type: CertificateType): string[] {
  return CERTIFICATE_FIELDS[type].flatMap((s) => s.fields.filter((f) => f.kind === 'date').map((f) => f.key));
}

/** Blank record pre-filled with the parish defaults (officiant, church, city, license county/state). */
export function emptyOfficeData(type: CertificateType): OfficeData {
  const defaults = (type === 'marriage' ? MARRIAGE_DEFAULTS : BAPTISM_DEFAULTS) as unknown as Record<string, string>;
  return Object.fromEntries(dataKeys(type).map((k) => [k, defaults[k] ?? '']));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** '2026-11-08' → '11/08/2026' (the prototype's printed format). */
export function formatCertificateDate(iso: string | null | undefined): string {
  if (!iso || !isIsoDate(iso)) return iso ?? '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

/**
 * Normalizes untrusted input into office data for `type`: only known keys,
 * strings only, trimmed, length-limited, dates validated. Returns the cleaned
 * data and a list of human-readable problems.
 */
export function cleanOfficeData(type: CertificateType, input: unknown): { data: OfficeData; errors: string[] } {
  const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const dates = new Set(dateKeys(type));
  const data: OfficeData = {};
  const errors: string[] = [];
  for (const key of dataKeys(type)) {
    const raw = src[key];
    const value = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
    if (value.length > MAX_FIELD_LENGTH) errors.push(`${fieldLabel(type, key)} is too long.`);
    if (dates.has(key) && value && !isIsoDate(value)) errors.push(`${fieldLabel(type, key)} is not a valid date.`);
    data[key] = value.slice(0, MAX_FIELD_LENGTH);
  }
  return { data, errors };
}

/** 'baptized_name_hy' → 'Name of the baptized (Armenian)' */
export function fieldLabel(type: CertificateType, key: string): string {
  for (const section of CERTIFICATE_FIELDS[type]) {
    for (const f of section.fields) {
      if (f.key === key) return f.label;
      if (f.kind === 'bilingual' && key === `${f.key}_en`) return `${f.label} (English)`;
      if (f.kind === 'bilingual' && key === `${f.key}_hy`) return `${f.label} (Armenian)`;
    }
  }
  return key;
}

/** The data the renderer prints. */
export function toCertificateData(
  type: CertificateType,
  data: OfficeData,
  meta: { registryNumber?: string | null; certificateDate?: string | null },
): Partial<BaptismCertificateData> | Partial<MarriageCertificateData> {
  const out: Record<string, string> = { ...data };
  for (const k of dateKeys(type)) out[k] = formatCertificateDate(data[k]);
  out.registry_number = meta.registryNumber ?? '';
  out.certificate_date = formatCertificateDate(meta.certificateDate);
  return out;
}

/** "Aram Petrosyan" or "Hayk Martirosyan & Nare Grigoryan" */
export function displayName(type: CertificateType, data: OfficeData): string {
  if (type === 'marriage') {
    return [data.groom_name_en, data.bride_name_en].filter(Boolean).join(' & ') || 'Unnamed couple';
  }
  return data.baptized_name_en || 'Unnamed';
}
