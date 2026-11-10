/**
 * Renders every fixture in src/certificates/fixtures/samples.json to PDF, in
 * both preview (watermarked) and issued (clean) form, and checks that every
 * approved Armenian string is fully covered by the bundled Armenian fonts.
 *
 *   npm run certificates:samples -- [outDir]     (default: ./certificate-samples)
 */
import fs from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';
import { ARMENIAN_BOLD_TTF, ARMENIAN_REGULAR_TTF } from '../src/certificates/assets.generated';
import * as content from '../src/certificates/content';
import { renderCertificate, type CertificateType } from '../src/certificates';
import samples from '../src/certificates/fixtures/samples.json';

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

function checkGlyphCoverage(): boolean {
  const approved = collectStrings(content).filter((s) => /[԰-֏]/.test(s));
  let ok = true;
  for (const [name, b64] of [['Regular', ARMENIAN_REGULAR_TTF], ['Bold', ARMENIAN_BOLD_TTF]] as const) {
    const font = fontkit.create(Buffer.from(b64, 'base64'));
    const missing = new Set<string>();
    for (const s of approved) for (const ch of Array.from(s)) if (!font.hasGlyphForCodePoint(ch.codePointAt(0)!)) missing.add(ch);
    if (missing.size) {
      ok = false;
      console.error(`✗ Armenian ${name} font is missing: ${Array.from(missing).join(' ')}`);
    } else {
      console.log(`✓ Armenian ${name} font covers all ${approved.length} approved Armenian strings`);
    }
  }
  return ok;
}

async function main() {
  const outDir = path.resolve(process.argv[2] ?? 'certificate-samples');
  fs.mkdirSync(outDir, { recursive: true });
  const coverageOk = checkGlyphCoverage();

  for (const [name, sample] of Object.entries(samples)) {
    if (name.startsWith('_')) continue;
    const { type, data } = sample as { type: CertificateType; data: Record<string, string> };
    for (const preview of [true, false]) {
      const bytes = await renderCertificate(type, data, { preview });
      const file = path.join(outDir, `${name}${preview ? '-preview' : ''}.pdf`);
      fs.writeFileSync(file, bytes);
      console.log(`  wrote ${file} (${Math.round(bytes.length / 1024)} KB)`);
    }
  }
  if (!coverageOk) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
