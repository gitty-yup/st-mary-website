/**
 * Public intake forms (what families submit before the sacrament), based on
 * the parish's paper "Information for Baptism & Chrismation" and "Information
 * for Marriage Ceremony" forms. Browser-safe: used by the public form, the
 * submit API, the office's "submitted information" panel, and emails.
 *
 * Submitted data keys: English values under `key`, optional Armenian
 * spellings under `key_hy`. `intakeToOfficeData()` turns a submission into the
 * certificate fields the office reviews.
 */
import { emptyOfficeData, isIsoDate, type OfficeData } from './fields';
import type { CertificateType } from './types';

export type IntakeKind = 'text' | 'date' | 'email' | 'tel' | 'select' | 'textarea';

export interface IntakeField {
  key: string;
  label: string;
  kind: IntakeKind;
  required?: boolean;
  /** Also offer an optional "Armenian spelling, if known" box (`${key}_hy`). */
  armenian?: boolean;
  help?: string;
  placeholder?: string;
  autoComplete?: string;
  options?: { value: string; label: string }[];
  /** Grid width on wide screens. */
  width?: 'full' | 'half' | 'third';
}

export interface IntakeSection {
  title: string;
  description?: string;
  fields: IntakeField[];
}

const MARITAL_STATUS = [
  { value: 'never_married', label: 'Never married' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'divorced', label: 'Divorced' },
];

function personSection(prefix: 'groom' | 'bride', title: string): IntakeSection {
  return {
    title,
    fields: [
      { key: `${prefix}_name`, label: 'Full name', kind: 'text', required: true, armenian: true, width: 'full' },
      { key: `${prefix}_birth_date`, label: 'Date of birth', kind: 'date', required: true, width: 'half' },
      { key: `${prefix}_birth_place`, label: 'Place of birth', kind: 'text', required: true, width: 'half', placeholder: 'City, state or country' },
      { key: `${prefix}_father_name`, label: 'Father’s name', kind: 'text', width: 'half' },
      { key: `${prefix}_mother_name`, label: 'Mother’s maiden name', kind: 'text', width: 'half' },
      { key: `${prefix}_marital_status`, label: 'Marital status', kind: 'select', required: true, options: MARITAL_STATUS, width: 'half' },
      { key: `${prefix}_phone`, label: 'Phone', kind: 'tel', width: 'half', autoComplete: 'off' },
      { key: `${prefix}_address`, label: 'Street address', kind: 'text', width: 'full', autoComplete: 'off' },
      { key: `${prefix}_city`, label: 'City', kind: 'text', width: 'third', autoComplete: 'off' },
      { key: `${prefix}_state`, label: 'State', kind: 'text', width: 'third', autoComplete: 'off' },
      { key: `${prefix}_zip`, label: 'ZIP', kind: 'text', width: 'third', autoComplete: 'off' },
    ],
  };
}

const CONTACT_FIELDS: IntakeField[] = [
  { key: 'contact_name', label: 'Your name', kind: 'text', required: true, width: 'full', autoComplete: 'name' },
  { key: 'contact_email', label: 'Email', kind: 'email', required: true, width: 'half', autoComplete: 'email' },
  { key: 'contact_phone', label: 'Phone', kind: 'tel', required: true, width: 'half', autoComplete: 'tel' },
];

const NOTES: IntakeField = {
  key: 'notes',
  label: 'Anything else Father should know?',
  kind: 'textarea',
  width: 'full',
};

export const INTAKE_FORMS: Record<CertificateType, IntakeSection[]> = {
  baptism: [
    {
      title: 'Person to be baptized',
      fields: [
        { key: 'baptized_name', label: 'Full name', kind: 'text', required: true, armenian: true, width: 'full', help: 'As it should appear on the certificate.' },
        { key: 'birth_date', label: 'Date of birth', kind: 'date', required: true, width: 'half' },
        { key: 'birth_place', label: 'Place of birth', kind: 'text', required: true, armenian: true, width: 'half', placeholder: 'City, state or country' },
      ],
    },
    {
      title: 'Parents',
      fields: [
        { key: 'father_name', label: 'Father’s full name', kind: 'text', armenian: true, width: 'full' },
        { key: 'mother_name', label: 'Mother’s full name (maiden)', kind: 'text', required: true, armenian: true, width: 'full' },
      ],
    },
    {
      title: 'Baptism',
      fields: [
        { key: 'baptism_date', label: 'Date of baptism', kind: 'date', required: true, width: 'half', help: 'The date scheduled with Father.' },
        { key: 'baptism_place', label: 'Place of baptism', kind: 'text', width: 'half', help: 'Leave blank if at St. Mary, Costa Mesa.' },
        { key: 'godfather', label: 'Godfather’s full name', kind: 'text', required: true, armenian: true, width: 'full' },
      ],
    },
    {
      title: 'Family contact',
      description: 'Who should the parish office contact about this baptism?',
      fields: [
        ...CONTACT_FIELDS,
        { key: 'address', label: 'Parents’ street address', kind: 'text', width: 'full', autoComplete: 'street-address' },
        { key: 'city', label: 'City', kind: 'text', width: 'third', autoComplete: 'address-level2' },
        { key: 'state', label: 'State', kind: 'text', width: 'third', autoComplete: 'address-level1' },
        { key: 'zip', label: 'ZIP', kind: 'text', width: 'third', autoComplete: 'postal-code' },
        NOTES,
      ],
    },
  ],
  marriage: [
    personSection('groom', 'Groom'),
    personSection('bride', 'Bride'),
    {
      title: 'Ceremony',
      fields: [
        { key: 'marriage_date', label: 'Date of marriage', kind: 'date', required: true, width: 'half', help: 'The date scheduled with Father.' },
        { key: 'marriage_place', label: 'Place of marriage', kind: 'text', width: 'half', help: 'Leave blank if at St. Mary, Costa Mesa.' },
        { key: 'brother_cross', label: 'Best man (Brother-in-the-Cross)', kind: 'text', required: true, armenian: true, width: 'full' },
        { key: 'matron_honor', label: 'Matron of honor', kind: 'text', armenian: true, width: 'full' },
      ],
    },
    {
      title: 'Marriage license',
      description: 'If you don’t have the license yet, leave these blank and bring it to the office.',
      fields: [
        { key: 'license_number', label: 'License number', kind: 'text', width: 'third' },
        { key: 'license_county', label: 'Issued in the county of', kind: 'text', width: 'third' },
        { key: 'license_state', label: 'State', kind: 'text', width: 'third' },
      ],
    },
    {
      title: 'Contact',
      description: 'Who should the parish office contact about this wedding?',
      fields: [...CONTACT_FIELDS, NOTES],
    },
  ],
};

export const INTAKE_TITLES: Record<CertificateType, string> = {
  baptism: 'Baptism & Chrismation Information',
  marriage: 'Marriage Ceremony Information',
};

const MAX_TEXT = 200;
const MAX_TEXTAREA = 2000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Every submitted key for a type, including the optional `_hy` spellings. */
export function intakeKeys(type: CertificateType): string[] {
  return INTAKE_FORMS[type].flatMap((s) => s.fields.flatMap((f) => (f.armenian ? [f.key, `${f.key}_hy`] : [f.key])));
}

export function intakeLabel(type: CertificateType, key: string): string {
  for (const s of INTAKE_FORMS[type]) {
    for (const f of s.fields) {
      if (f.key === key) return f.label;
      if (f.armenian && key === `${f.key}_hy`) return `${f.label} (Armenian spelling)`;
    }
  }
  return key;
}

/** Validates and normalizes a public submission. Errors are keyed by field. */
export function cleanIntake(
  type: CertificateType,
  input: unknown,
): { data: Record<string, string>; errors: Record<string, string> } {
  const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const data: Record<string, string> = {};
  const errors: Record<string, string> = {};
  const fields = INTAKE_FORMS[type].flatMap((s) => s.fields);
  for (const f of fields) {
    const keys = f.armenian ? [f.key, `${f.key}_hy`] : [f.key];
    for (const key of keys) {
      const raw = typeof src[key] === 'string' ? (src[key] as string) : '';
      const value = f.kind === 'textarea' ? raw.trim() : raw.replace(/\s+/g, ' ').trim();
      data[key] = value;
      const max = f.kind === 'textarea' ? MAX_TEXTAREA : MAX_TEXT;
      if (value.length > max) errors[key] = `Please keep this under ${max} characters.`;
    }
    const value = data[f.key];
    if (!value) {
      if (f.required) errors[f.key] = 'Required.';
      continue;
    }
    if (f.kind === 'email' && !EMAIL.test(value)) errors[f.key] = 'Please enter a valid email address.';
    if (f.kind === 'tel' && value.replace(/\D/g, '').length < 7) errors[f.key] = 'Please enter a valid phone number.';
    if (f.kind === 'date') {
      const year = Number(value.slice(0, 4));
      if (!isIsoDate(value) || year < 1900 || year > 2100) errors[f.key] = 'Please enter a valid date.';
    }
    if (f.kind === 'select' && !f.options?.some((o) => o.value === value)) errors[f.key] = 'Please choose an option.';
  }
  return { data, errors };
}

/** Submitted keys that end up printed on the certificate (and so must be printable). */
export function printedIntakeKeys(type: CertificateType): string[] {
  const bilingual =
    type === 'baptism'
      ? ['baptized_name', 'birth_place', 'father_name', 'mother_name', 'godfather']
      : ['groom_name', 'bride_name', 'brother_cross', 'matron_honor'];
  const single = type === 'baptism' ? [] : ['license_number', 'license_county', 'license_state'];
  return [...bilingual.flatMap((k) => [k, `${k}_hy`]), ...single];
}

/** Pre-fills the certificate fields from a submission; the office reviews and completes them. */
export function intakeToOfficeData(type: CertificateType, s: Record<string, string>): OfficeData {
  const out = emptyOfficeData(type);
  const pair = (certKey: string, intakeKey: string) => {
    out[`${certKey}_en`] = s[intakeKey] ?? '';
    out[`${certKey}_hy`] = s[`${intakeKey}_hy`] ?? '';
  };
  if (type === 'baptism') {
    pair('baptized_name', 'baptized_name');
    pair('birth_place', 'birth_place');
    pair('father_name', 'father_name');
    pair('mother_name', 'mother_name');
    pair('godfather', 'godfather');
    out.birth_date = s.birth_date ?? '';
    out.baptism_date = s.baptism_date ?? '';
  } else {
    pair('groom_name', 'groom_name');
    pair('bride_name', 'bride_name');
    pair('brother_cross', 'brother_cross');
    pair('matron_honor', 'matron_honor');
    out.marriage_date = s.marriage_date ?? '';
    out.marriage_license_number = s.license_number ?? '';
    if (s.license_county) out.license_county = s.license_county;
    if (s.license_state) out.license_state = s.license_state;
  }
  return out;
}

/** Display value for the office panel and emails (select codes → labels, dates → MM/DD/YYYY). */
export function intakeDisplayValue(type: CertificateType, key: string, value: string): string {
  if (!value) return '';
  for (const s of INTAKE_FORMS[type]) {
    const f = s.fields.find((x) => x.key === key);
    if (f?.kind === 'select') return f.options?.find((o) => o.value === value)?.label ?? value;
    if (f?.kind === 'date' && isIsoDate(value)) {
      const [y, m, d] = value.split('-');
      return `${m}/${d}/${y}`;
    }
  }
  return value;
}
