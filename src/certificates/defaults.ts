import { PARISH_DEFAULTS } from './content';
import type { BaptismCertificateData, MarriageCertificateData } from './types';

// Kept apart from render.ts so browser code can use them without pulling in
// pdf-lib and the embedded fonts.

export const BAPTISM_DEFAULTS: BaptismCertificateData = {
  certificate_date: '', registry_number: '',
  baptized_name_hy: '', baptized_name_en: '',
  birth_date: '', birth_place_hy: '', birth_place_en: '',
  father_name_hy: '', father_name_en: '',
  mother_name_hy: '', mother_name_en: '',
  officiant_hy: PARISH_DEFAULTS.officiant_hy, officiant_en: PARISH_DEFAULTS.officiant_en,
  godfather_hy: '', godfather_en: '',
  baptism_date: '',
  parish_church_hy: PARISH_DEFAULTS.parish_church_hy, parish_church_en: PARISH_DEFAULTS.parish_church_en,
  city_state_hy: PARISH_DEFAULTS.city_state_hy, city_state_en: PARISH_DEFAULTS.city_state_en,
  signature_hy: '', signature_en: '',
};

export const MARRIAGE_DEFAULTS: MarriageCertificateData = {
  marriage_license_number: '', license_county: 'Orange', license_state: 'CA',
  certificate_date: '', registry_number: '',
  groom_name_hy: '', groom_name_en: '',
  bride_name_hy: '', bride_name_en: '',
  marriage_date: '',
  officiant_hy: PARISH_DEFAULTS.officiant_hy, officiant_en: PARISH_DEFAULTS.officiant_en,
  brother_cross_hy: '', brother_cross_en: '',
  matron_honor_hy: '', matron_honor_en: '',
  parish_church_hy: PARISH_DEFAULTS.parish_church_hy, parish_church_en: PARISH_DEFAULTS.parish_church_en,
  city_state_hy: PARISH_DEFAULTS.city_state_hy, city_state_en: PARISH_DEFAULTS.city_state_en,
  signature_hy: '', signature_en: '',
};
