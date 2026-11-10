/**
 * Approved certificate wording and defaults.
 *
 * Every Armenian string in this file was approved during prototype development
 * (v12.5). Do not modernize, normalize, translate, or respell any of them
 * without explicit sign-off from the parish priest.
 */

export const DIOCESE = {
  hy: 'ՀԱՅԱՍՏԱՆԵԱՅՑ ԵԿԵՂԵՑՒՈՅ ՀԻՒՍԻՍԱՅԻՆ ԱՄԵՐԻԿԱՅԻ ԱՐԵՒՄՏԵԱՆ ԹԵՄ',
  en: 'WESTERN DIOCESE OF THE ARMENIAN CHURCH OF NORTH AMERICA',
  address: '3325 N Glenoaks Blvd, Burbank, CA 91504',
} as const;

export const INTRO = {
  hy: 'Սույնով հավաստվում է, որ…',
  en: 'It is hereby certified that...',
} as const;

export const META_LABELS = {
  certificateDate: { hy: 'Վկայագրի Թուական', en: 'Date of Certificate' },
  registryNumber: { hy: 'Գրանցման Թիւ', en: 'Registry Number' },
  licenseNumber: { hy: 'Թիւ Արտօնագրի', en: 'License Number' },
  issuedAtCounty: { en: 'Issued at the County of' },
  state: { en: 'State' },
} as const;

export const PREVIEW_WATERMARK = 'PREVIEW - NOT ISSUED';

// --- Baptism -----------------------------------------------------------------

export const BAPTISM_TEXT = {
  documentTitle: 'St. Mary Certificate of Baptism and Chrismation',
  titleHy: 'ՎԿԱՅԱԳԻՐ ՄԿՐՏՈՒԹԵԱՆ ԵՒ ԴՐՈՇՄԻ',
  titleEn: 'CERTIFICATE OF BAPTISM AND CHRISMATION',
  sacramentHy:
    'Ընկալաւ զխորհուրդ Սուրբ Մկրտութեան եւ Դրոշմի ըստ ծիսի Հայաստանեայց ' +
    'Առաքելական Ուղղափառ Եկեղեցւոյ յանուն Հօր, եւ Որդւոյ, եւ Հոգւոյն Սրբոյ։',
  sacramentEn:
    'Received the sacraments of Holy Baptism and Chrismation according to the rite ' +
    'of the Armenian Apostolic Orthodox Church in the name of the Father, and of the ' +
    'Son, and of the Holy Spirit.',
  upperLabelsHy: ['Անուն Երախայի', 'Ծննդեան Թուական', 'Ծննդավայր', 'Հօր Անուն', 'Մօր Անուն'],
  upperLabelsEn: ['Name of the Baptized', 'Date of Birth', 'Place of Birth', 'Father’s Name', 'Mother’s Name'],
  lowerLabelsHy: ['Ձեռամբ', 'Կնքահայր', 'Թուական Մկրտութեան', 'Անուն Եկեղեցւոյ', 'Քաղաք եւ Նահանգ', 'Ստորագրութիւն'],
  lowerLabelsEn: ['Officiant', 'Godfather', 'Date of Baptism', 'Parish Church', 'City and State', 'Signature'],
} as const;

// --- Marriage ----------------------------------------------------------------

export const MARRIAGE_TEXT = {
  documentTitle: 'St. Mary Certificate of Marriage',
  titleHy: 'ՎԿԱՅԱԳԻՐ ԱՄՈՒՍՆՈՒԹԵԱՆ',
  titleEn: 'CERTIFICATE OF MARRIAGE',
  sacramentHy: 'Ընկալան զխորհուրդ Սուրբ Պսակի ըստ ծիսի Հայաստանեայց Առաքելական Ուղղափառ Եկեղեցւոյ։',
  sacramentEn:
    'Were united in the sacrament of Holy Matrimony according to the rite ' +
    'of the Armenian Apostolic Orthodox Church.',
  coupleLabelsHy: ['Անուն փեսայի', 'Անուն հարսի'],
  coupleLabelsEn: ['Name of Groom', 'Name of Bride'],
  detailLabelsHy: ['Թուական ամուսնութեան', 'Ձեռամբ', 'Խաչեղբայր', 'Հարսաքոյր', 'Անուն Եկեղեցւոյ', 'Քաղաք եւ Նահանգ'],
  detailLabelsEn: ['Date of Marriage', 'Officiant', 'Brother-in-the-Cross', 'Matron of Honor', 'Parish Church', 'City and State'],
  signatureHy: 'Ստորագրութիւն',
  signatureEn: 'Signature',
} as const;

// --- Parish defaults -----------------------------------------------------------

export const PARISH_DEFAULTS = {
  officiant_hy: 'Տ. Երեմիա Վարդապետ Աբգարյան',
  officiant_en: 'Very Rev. Fr. Eremia Abgaryan',
  parish_church_hy: 'Ս. Աստուածածին Եկեղեցի',
  parish_church_en: 'St. Mary Armenian Church',
  city_state_hy: 'Քոսթա Մեսա, Կալիֆորնիա',
  city_state_en: 'Costa Mesa, California',
} as const;
