/**
 * Certificate data as printed. Keys intentionally match the v12.5 prototype's
 * field names so data and fixtures are interchangeable with the reference
 * implementation. All values are display strings (dates already formatted).
 */

export type CertificateType = 'baptism' | 'marriage';

export interface BaptismCertificateData {
  certificate_date: string;
  registry_number: string;
  baptized_name_hy: string;
  baptized_name_en: string;
  birth_date: string;
  birth_place_hy: string;
  birth_place_en: string;
  father_name_hy: string;
  father_name_en: string;
  mother_name_hy: string;
  mother_name_en: string;
  officiant_hy: string;
  officiant_en: string;
  godfather_hy: string;
  godfather_en: string;
  baptism_date: string;
  parish_church_hy: string;
  parish_church_en: string;
  city_state_hy: string;
  city_state_en: string;
  signature_hy: string;
  signature_en: string;
}

export interface MarriageCertificateData {
  marriage_license_number: string;
  license_county: string;
  license_state: string;
  certificate_date: string;
  registry_number: string;
  groom_name_hy: string;
  groom_name_en: string;
  bride_name_hy: string;
  bride_name_en: string;
  marriage_date: string;
  officiant_hy: string;
  officiant_en: string;
  brother_cross_hy: string;
  brother_cross_en: string;
  matron_honor_hy: string;
  matron_honor_en: string;
  parish_church_hy: string;
  parish_church_en: string;
  city_state_hy: string;
  city_state_en: string;
  signature_hy: string;
  signature_en: string;
}

export interface RenderOptions {
  /** Draw the diagonal "PREVIEW - NOT ISSUED" watermark. */
  preview: boolean;
  /** Watermark text when `preview` is set (default "PREVIEW - NOT ISSUED"). */
  watermark?: string;
}
