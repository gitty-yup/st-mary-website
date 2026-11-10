import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { ARMENIAN_BOLD_TTF, ARMENIAN_REGULAR_TTF } from './assets.generated';
import { fieldLabel, type OfficeData } from './fields';
import type { CertificateType } from './types';

let printable: Promise<Set<number>> | undefined;

/**
 * Code points every certificate font can print, directly or via the
 * English/Armenian fallback (see render.ts). Anything else prints as "?".
 */
function printableCodePoints(): Promise<Set<number>> {
  printable ??= (async () => {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const [eng, engBold, arm, armBold] = await Promise.all([
      doc.embedFont(StandardFonts.TimesRoman),
      doc.embedFont(StandardFonts.TimesRomanBold),
      doc.embedFont(ARMENIAN_REGULAR_TTF),
      doc.embedFont(ARMENIAN_BOLD_TTF),
    ]);
    const regular = new Set([...eng.getCharacterSet(), ...arm.getCharacterSet()]);
    const bold = new Set([...engBold.getCharacterSet(), ...armBold.getCharacterSet()]);
    return new Set(Array.from(regular).filter((cp) => bold.has(cp)));
  })();
  return printable;
}

export interface UnsupportedCharacters {
  key: string;
  label: string;
  characters: string[];
}

/** Fields containing characters the certificate cannot print (emoji, other scripts…). */
export async function findUnsupportedCharacters(
  type: CertificateType,
  data: OfficeData,
): Promise<UnsupportedCharacters[]> {
  const ok = await printableCodePoints();
  const problems: UnsupportedCharacters[] = [];
  for (const [key, value] of Object.entries(data)) {
    const bad = Array.from(new Set(Array.from(value ?? '').filter((ch) => ch !== ' ' && !ok.has(ch.codePointAt(0)!))));
    if (bad.length) problems.push({ key, label: fieldLabel(type, key), characters: bad });
  }
  return problems;
}
