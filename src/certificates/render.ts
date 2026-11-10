/**
 * Sacramental certificate renderer (Baptism & Chrismation, Marriage).
 *
 * A direct port of the v12.5 ReportLab prototype (certificate_generator.py).
 * Every coordinate, font size, and fitting rule below mirrors the prototype,
 * which remains the visual reference. Fixed approved artwork + variable data:
 * do not "redesign" positions here without a side-by-side review.
 *
 * Coordinates are PDF points, origin bottom-left, on a landscape US Letter
 * page (792 x 612). Text y values are baselines.
 */
import { PDFDocument, PDFFont, PDFPage, RGB, StandardFonts, degrees, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { ARMENIAN_BOLD_TTF, ARMENIAN_REGULAR_TTF, DIOCESE_LOGO_JPEG } from './assets.generated';
import {
  BAPTISM_TEXT,
  DIOCESE,
  INTRO,
  MARRIAGE_TEXT,
  META_LABELS,
  PREVIEW_WATERMARK,
} from './content';
import { BAPTISM_DEFAULTS, MARRIAGE_DEFAULTS } from './defaults';
import type {
  BaptismCertificateData,
  CertificateType,
  MarriageCertificateData,
  RenderOptions,
} from './types';

export { BAPTISM_DEFAULTS, MARRIAGE_DEFAULTS };

export const PAGE_W = 792;
export const PAGE_H = 612;

const BORDER = rgb(0xb7 / 255, 0x54 / 255, 0x30 / 255); // #B75430
const BLACK = rgb(0x11 / 255, 0x11 / 255, 0x11 / 255); // #111111

// Shared column geometry (prototype: left_x/left_end, right_x/right_end).
const LEFT_X = 55;
const LEFT_END = 360;
const RIGHT_X = 430;
const RIGHT_END = 737;
const ARM_VALUE_X = 170;
const ENG_VALUE_X = 515;

/** Defaults overlaid with provided values; whitespace (incl. newlines) collapsed. */
function withDefaults<T extends object>(defaults: T, data: Partial<T> | undefined): T {
  const out = { ...defaults } as Record<string, string>;
  for (const [k, v] of Object.entries(data ?? {})) {
    if (k in out && typeof v === 'string') out[k] = v;
  }
  for (const k of Object.keys(out)) out[k] = (out[k] ?? '').replace(/\s+/g, ' ').trim();
  return out as T;
}

// --- Fonts & mixed-script text ------------------------------------------------

type FontKey = 'eng' | 'engItalic' | 'engBold' | 'arm' | 'armBold';

/**
 * If a character is missing from the requested font, try these in order.
 * Lets an Armenian character typed into an English field (or vice versa)
 * render correctly instead of crashing the encoder or printing a box.
 */
const FALLBACKS: Record<FontKey, FontKey[]> = {
  eng: ['arm'],
  engItalic: ['arm'],
  engBold: ['armBold'],
  arm: ['eng'],
  armBold: ['engBold'],
};

interface Ctx {
  page: PDFPage;
  fonts: Record<FontKey, PDFFont>;
  charsets: Record<FontKey, Set<number>>;
  /** The built-in Times fonts; see runWidth(). */
  standard: Set<PDFFont>;
  /** Unkerned 1000-unit glyph widths per standard font, memoized. */
  glyphWidths: Map<PDFFont, Map<string, number>>;
}

/**
 * Width of a single-font run exactly as pdf-lib will draw it.
 *
 * pdf-lib's widthOfTextAtSize() for the 14 standard fonts adds AFM kerning,
 * but drawText() never applies kerning, so measured and drawn widths disagree
 * (titles end up off-center, underlines start in the wrong place). ReportLab
 * does not kern either, so summing per-glyph widths matches both pdf-lib's
 * output and the prototype. Custom (embedded) fonts are already consistent.
 */
function runWidth(ctx: Ctx, font: PDFFont, text: string, size: number): number {
  if (!ctx.standard.has(font)) return font.widthOfTextAtSize(text, size);
  let cache = ctx.glyphWidths.get(font);
  if (!cache) ctx.glyphWidths.set(font, (cache = new Map()));
  let units = 0;
  for (const ch of Array.from(text)) {
    let w = cache.get(ch);
    if (w === undefined) cache.set(ch, (w = font.widthOfTextAtSize(ch, 1000)));
    units += w;
  }
  return (units * size) / 1000;
}

interface Run {
  font: PDFFont;
  text: string;
}

function toRuns(ctx: Ctx, text: string, key: FontKey): Run[] {
  const chain: FontKey[] = [key, ...FALLBACKS[key]];
  const runs: Run[] = [];
  for (const ch of Array.from(text)) {
    const cp = ch.codePointAt(0)!;
    const found = chain.find((k) => ctx.charsets[k].has(cp));
    const font = ctx.fonts[found ?? key];
    const glyph = found ? ch : '?';
    const last = runs[runs.length - 1];
    if (last && last.font === font) last.text += glyph;
    else runs.push({ font, text: glyph });
  }
  return runs;
}

function textWidth(ctx: Ctx, text: string, key: FontKey, size: number): number {
  return toRuns(ctx, text, key).reduce((w, r) => w + runWidth(ctx, r.font, r.text, size), 0);
}

function drawString(ctx: Ctx, text: string, x: number, y: number, key: FontKey, size: number, color: RGB = BLACK) {
  let cx = x;
  for (const r of toRuns(ctx, text, key)) {
    ctx.page.drawText(r.text, { x: cx, y, size, font: r.font, color });
    cx += runWidth(ctx, r.font, r.text, size);
  }
}

/** Shrink in 0.25pt steps until the text fits (prototype: fit_size). */
function fitSize(ctx: Ctx, text: string, key: FontKey, maxSize: number, maxWidth: number, minSize = 6.5): number {
  let size = maxSize;
  while (size > minSize && textWidth(ctx, text, key, size) > maxWidth) size -= 0.25;
  return size;
}

function centered(ctx: Ctx, text: string, y: number, key: FontKey, maxSize: number, maxWidth = PAGE_W - 100) {
  const size = fitSize(ctx, text, key, maxSize, maxWidth);
  drawString(ctx, text, PAGE_W / 2 - textWidth(ctx, text, key, size) / 2, y, key, size);
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, thickness: number, color: RGB) {
  ctx.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
}

// --- Shared drawing ------------------------------------------------------------

function drawBorder(ctx: Ctx) {
  for (const [inset, width] of [[16, 1.2], [20, 0.55], [24, 0.8]] as const) {
    ctx.page.drawRectangle({
      x: inset, y: inset, width: PAGE_W - 2 * inset, height: PAGE_H - 2 * inset,
      borderColor: BORDER, borderWidth: width,
    });
  }
  const left = 29, right = PAGE_W - 29, bottom = 29, top = PAGE_H - 29;
  const diamond = (cx: number, cy: number, r = 4) =>
    ctx.page.drawSvgPath(`M 0 ${-r} L ${r} 0 L 0 ${r} L ${-r} 0 Z`, {
      x: cx, y: cy, borderColor: BORDER, borderWidth: 0.55,
    });
  for (const x of centeredRun(left + 8, right - 8, 15)) { diamond(x, top); diamond(x, bottom); }
  for (const y of centeredRun(bottom + 10, top - 10, 15)) { diamond(left, y); diamond(right, y); }
}

/**
 * Evenly spaced positions, centered between `start` and `end`. Uses the same
 * diamond count as the prototype's loop (`for p = start; p < end; p += step`),
 * which anchored the run at `start` and left the leftover space at the far end
 * (rows sat 6.5pt left of center, columns 4.5pt low). Centered, every corner
 * gets an equal 14.5pt gap.
 */
function centeredRun(start: number, end: number, step: number): number[] {
  const count = Math.ceil((end - start) / step);
  const first = (start + end) / 2 - ((count - 1) * step) / 2;
  return Array.from({ length: count }, (_, i) => first + i * step);
}

async function drawLogo(doc: PDFDocument, ctx: Ctx) {
  // Fit into the protected 58x94 box at (45, 468), centered, aspect preserved.
  const img = await doc.embedJpg(DIOCESE_LOGO_JPEG);
  const boxX = 45, boxY = 468, boxW = 58, boxH = 94;
  const scale = Math.min(boxW / img.width, boxH / img.height);
  const w = img.width * scale, h = img.height * scale;
  ctx.page.drawImage(img, { x: boxX + (boxW - w) / 2, y: boxY + (boxH - h) / 2, width: w, height: h });
}

function drawDioceseHeader(ctx: Ctx) {
  // Centered on the page (not beside the logo); width-capped to clear the logo.
  centered(ctx, DIOCESE.hy, 557, 'armBold', 13.5, 550);
  centered(ctx, DIOCESE.en, 526, 'eng', 14.0, 550);
  centered(ctx, DIOCESE.address, 499, 'eng', 10.5, 520);
}

/**
 * One label/underline/value row (prototype: draw_field). Values share a fixed
 * left edge (valueX) so rows read as clean columns, never starting inside the label.
 */
function drawField(
  ctx: Ctx, label: string, value: string, x: number, y: number, lineEnd: number,
  labelKey: FontKey, valueKey: FontKey, labelSize: number, valueSize: number, valueX: number,
) {
  drawString(ctx, label, x, y, labelKey, labelSize);
  const lineStart = x + textWidth(ctx, label, labelKey, labelSize) + 7;
  line(ctx, lineStart, y - 2, lineEnd, y - 2, 0.45, BLACK);
  if (value) {
    const start = Math.max(valueX, lineStart + 5);
    const size = fitSize(ctx, value, valueKey, valueSize, Math.max(20, lineEnd - start - 5), 6.5);
    drawString(ctx, value, start, y + 1.1, valueKey, size);
  }
}

/**
 * Header metadata underlines. The prototype accidentally drew these in the
 * border's stroke (#B75430, 0.55pt); approved change: black 0.45pt, matching
 * the body field underlines.
 */
const META_LINE_WIDTH = 0.45;
const META_LINE_COLOR = BLACK;

/** Bilingual metadata row: "Armenian / English ______ value". */
function drawMetaField(ctx: Ctx, x: number, y: number, hy: string, en: string, lineEnd: number, value: string) {
  drawString(ctx, hy, x, y, 'arm', 8.5);
  const x2 = x + textWidth(ctx, hy, 'arm', 8.5) + 3;
  const enLabel = '/ ' + en;
  drawString(ctx, enLabel, x2, y, 'engItalic', 8.1);
  const ls = x2 + textWidth(ctx, enLabel, 'engItalic', 8.1) + 7;
  line(ctx, ls, y - 2, lineEnd, y - 2, META_LINE_WIDTH, META_LINE_COLOR);
  if (value) {
    drawString(ctx, value, ls + 8, y + 1, 'engBold', fitSize(ctx, value, 'engBold', 9.2, lineEnd - ls - 8, 7));
  }
}

/** Greedy word wrap (prototype: wrap_text). */
function wrapText(ctx: Ctx, text: string, key: FontKey, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(ctx, candidate, key, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Left-aligned, ragged-right paragraph, shrunk to fit maxLines (prototype: draw_left_paragraph). */
function drawLeftParagraph(
  ctx: Ctx, text: string, x: number, topY: number, width: number, key: FontKey,
  maxSize: number, leading: number, maxLines = 4, minSize = 6.4,
) {
  let size = maxSize;
  let lines = wrapText(ctx, text, key, size, width);
  while (size > minSize && lines.length > maxLines) {
    size -= 0.2;
    lines = wrapText(ctx, text, key, size, width);
  }
  let y = topY;
  for (const l of lines) {
    drawString(ctx, l, x, y, key, size);
    y -= leading;
  }
}

function drawWatermark(ctx: Ctx) {
  const size = 46;
  const angle = 24;
  const font = ctx.fonts.engBold;
  const half = runWidth(ctx, font, PREVIEW_WATERMARK, size) / 2;
  const rad = (angle * Math.PI) / 180;
  ctx.page.drawText(PREVIEW_WATERMARK, {
    x: PAGE_W / 2 - half * Math.cos(rad),
    y: PAGE_H / 2 - half * Math.sin(rad),
    size, font, color: rgb(0.75, 0.75, 0.75), opacity: 0.18, rotate: degrees(angle),
  });
}

async function newCertificate(title: string) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(title);
  doc.setAuthor('St. Mary Armenian Apostolic Church, Costa Mesa');
  doc.setCreator('St. Mary Certificate Generator');
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const fonts: Record<FontKey, PDFFont> = {
    eng: await doc.embedFont(StandardFonts.TimesRoman),
    engItalic: await doc.embedFont(StandardFonts.TimesRomanItalic),
    engBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    arm: await doc.embedFont(ARMENIAN_REGULAR_TTF, { subset: true }),
    armBold: await doc.embedFont(ARMENIAN_BOLD_TTF, { subset: true }),
  };
  const charsets = Object.fromEntries(
    Object.entries(fonts).map(([k, f]) => [k, new Set(f.getCharacterSet())]),
  ) as Record<FontKey, Set<number>>;
  const ctx: Ctx = {
    page, fonts, charsets,
    standard: new Set([fonts.eng, fonts.engItalic, fonts.engBold]),
    glyphWidths: new Map(),
  };
  drawBorder(ctx);
  await drawLogo(doc, ctx);
  drawDioceseHeader(ctx);
  return { doc, ctx };
}

// --- Baptism & Chrismation -----------------------------------------------------

export async function renderBaptismCertificate(
  data: Partial<BaptismCertificateData>,
  options: RenderOptions,
): Promise<Uint8Array> {
  const d = withDefaults(BAPTISM_DEFAULTS, data);
  const T = BAPTISM_TEXT;
  const { doc, ctx } = await newCertificate(T.documentTitle);

  drawMetaField(ctx, 114, 466, META_LABELS.certificateDate.hy, META_LABELS.certificateDate.en, 365, d.certificate_date);
  drawMetaField(ctx, 465, 466, META_LABELS.registryNumber.hy, META_LABELS.registryNumber.en, 738, d.registry_number);

  centered(ctx, T.titleHy, 423, 'armBold', 23.5, 650);
  centered(ctx, T.titleEn, 394, 'eng', 19.5, 650);

  drawString(ctx, INTRO.hy, LEFT_X, 356, 'arm', 9.6);
  drawString(ctx, INTRO.en, RIGHT_X, 356, 'eng', 10.0);

  const upperY = [326, 298, 270, 242, 214];
  const upperHy = [d.baptized_name_hy, d.birth_date, d.birth_place_hy, d.father_name_hy, d.mother_name_hy];
  const upperEn = [d.baptized_name_en, d.birth_date, d.birth_place_en, d.father_name_en, d.mother_name_en];
  upperY.forEach((y, i) => {
    drawField(ctx, T.upperLabelsHy[i], upperHy[i], LEFT_X, y, LEFT_END, 'arm', 'armBold', 8.4, 9.4, ARM_VALUE_X);
    drawField(ctx, T.upperLabelsEn[i], upperEn[i], RIGHT_X, y, RIGHT_END, 'engItalic', 'engBold', 8.3, 9.4, ENG_VALUE_X);
  });

  drawLeftParagraph(ctx, T.sacramentHy, LEFT_X, 190, LEFT_END - LEFT_X, 'arm', 8.0, 10.6, 4);
  drawLeftParagraph(ctx, T.sacramentEn, RIGHT_X, 190, RIGHT_END - RIGHT_X, 'eng', 7.8, 10.6, 4);

  // Signature row (last) sits lower to leave room for a handwritten signature:
  // a 30pt gap and the same y=48 baseline as the marriage certificate.
  // (Prototype: y=54, a 24pt gap.)
  const lowerY = [150, 132, 114, 96, 78, 48];
  const lowerHy = [d.officiant_hy, d.godfather_hy, d.baptism_date, d.parish_church_hy, d.city_state_hy, d.signature_hy];
  const lowerEn = [d.officiant_en, d.godfather_en, d.baptism_date, d.parish_church_en, d.city_state_en, d.signature_en];
  lowerY.forEach((y, i) => {
    drawField(ctx, T.lowerLabelsHy[i], lowerHy[i], LEFT_X, y, LEFT_END, 'arm', 'armBold', 8.2, 8.8, ARM_VALUE_X);
    drawField(ctx, T.lowerLabelsEn[i], lowerEn[i], RIGHT_X, y, RIGHT_END, 'engItalic', 'engBold', 8.1, 8.8, ENG_VALUE_X);
  });

  if (options.preview) drawWatermark(ctx);
  return doc.save();
}

// --- Marriage ------------------------------------------------------------------

export async function renderMarriageCertificate(
  data: Partial<MarriageCertificateData>,
  options: RenderOptions,
): Promise<Uint8Array> {
  const d = withDefaults(MARRIAGE_DEFAULTS, data);
  const T = MARRIAGE_TEXT;
  const { doc, ctx } = await newCertificate(T.documentTitle);

  // Row 1: license number | issuing county / state
  drawMetaField(ctx, 102, 466, META_LABELS.licenseNumber.hy, META_LABELS.licenseNumber.en, 393, d.marriage_license_number);
  {
    const y = 466;
    const x = 475;
    drawString(ctx, META_LABELS.issuedAtCounty.en, x, y, 'engItalic', 8.1);
    const cx = x + textWidth(ctx, META_LABELS.issuedAtCounty.en, 'engItalic', 8.1) + 7;
    line(ctx, cx, y - 2, cx + 64, y - 2, META_LINE_WIDTH, META_LINE_COLOR);
    // Prototype drew county/state at a fixed 8.7pt; fitting only kicks in for
    // values that would otherwise overrun their line.
    if (d.license_county) {
      drawString(ctx, d.license_county, cx + 5, y + 1, 'engBold', fitSize(ctx, d.license_county, 'engBold', 8.7, 57));
    }
    const sx = cx + 72;
    drawString(ctx, META_LABELS.state.en, sx, y, 'engItalic', 8.1);
    const ss = sx + textWidth(ctx, META_LABELS.state.en, 'engItalic', 8.1) + 6;
    line(ctx, ss, y - 2, 738, y - 2, META_LINE_WIDTH, META_LINE_COLOR);
    if (d.license_state) {
      drawString(ctx, d.license_state, ss + 5, y + 1, 'engBold', fitSize(ctx, d.license_state, 'engBold', 8.7, 738 - ss - 7));
    }
  }
  // Row 2: certificate date | registry number
  drawMetaField(ctx, 102, 442, META_LABELS.certificateDate.hy, META_LABELS.certificateDate.en, 393, d.certificate_date);
  drawMetaField(ctx, 475, 442, META_LABELS.registryNumber.hy, META_LABELS.registryNumber.en, 738, d.registry_number);

  centered(ctx, T.titleHy, 391, 'armBold', 23.5, 650);
  centered(ctx, T.titleEn, 360, 'eng', 20.5, 650);

  drawString(ctx, INTRO.hy, LEFT_X, 325, 'arm', 9.6);
  drawString(ctx, INTRO.en, RIGHT_X, 325, 'eng', 10.0);

  const coupleY = [289, 257];
  const coupleHy = [d.groom_name_hy, d.bride_name_hy];
  const coupleEn = [d.groom_name_en, d.bride_name_en];
  coupleY.forEach((y, i) => {
    drawField(ctx, T.coupleLabelsHy[i], coupleHy[i], LEFT_X, y, LEFT_END, 'arm', 'armBold', 8.4, 9.4, ARM_VALUE_X);
    drawField(ctx, T.coupleLabelsEn[i], coupleEn[i], RIGHT_X, y, RIGHT_END, 'engItalic', 'engBold', 8.3, 9.4, ENG_VALUE_X);
  });

  drawLeftParagraph(ctx, T.sacramentHy, LEFT_X, 222, LEFT_END - LEFT_X, 'arm', 8.2, 11.0, 4);
  drawLeftParagraph(ctx, T.sacramentEn, RIGHT_X, 222, RIGHT_END - RIGHT_X, 'eng', 8.0, 11.0, 4);

  const detailY = [178, 158, 138, 118, 98, 78];
  const detailHy = [d.marriage_date, d.officiant_hy, d.brother_cross_hy, d.matron_honor_hy, d.parish_church_hy, d.city_state_hy];
  const detailEn = [d.marriage_date, d.officiant_en, d.brother_cross_en, d.matron_honor_en, d.parish_church_en, d.city_state_en];
  detailY.forEach((y, i) => {
    drawField(ctx, T.detailLabelsHy[i], detailHy[i], LEFT_X, y, LEFT_END, 'arm', 'armBold', 8.2, 8.8, ARM_VALUE_X);
    drawField(ctx, T.detailLabelsEn[i], detailEn[i], RIGHT_X, y, RIGHT_END, 'engItalic', 'engBold', 8.1, 8.8, ENG_VALUE_X);
  });

  // Signature deliberately separated (30pt gap) for a handwritten signature.
  drawField(ctx, T.signatureHy, d.signature_hy, LEFT_X, 48, LEFT_END, 'arm', 'armBold', 8.2, 8.8, ARM_VALUE_X);
  drawField(ctx, T.signatureEn, d.signature_en, RIGHT_X, 48, RIGHT_END, 'engItalic', 'engBold', 8.1, 8.8, ENG_VALUE_X);

  if (options.preview) drawWatermark(ctx);
  return doc.save();
}

// --- Convenience ---------------------------------------------------------------

export function renderCertificate(
  type: CertificateType,
  data: Partial<BaptismCertificateData> | Partial<MarriageCertificateData>,
  options: RenderOptions,
): Promise<Uint8Array> {
  return type === 'marriage'
    ? renderMarriageCertificate(data as Partial<MarriageCertificateData>, options)
    : renderBaptismCertificate(data as Partial<BaptismCertificateData>, options);
}

/** e.g. "B-2026-001 - Aram Petrosyan.pdf" (prototype: safe_filename). */
export function certificateFilename(
  type: CertificateType,
  data: Partial<BaptismCertificateData> | Partial<MarriageCertificateData>,
): string {
  const label = type === 'marriage' ? 'Marriage' : 'Baptism';
  const name =
    type === 'marriage'
      ? [(data as MarriageCertificateData).groom_name_en, (data as MarriageCertificateData).bride_name_en]
          .filter(Boolean)
          .join(' & ')
      : (data as BaptismCertificateData).baptized_name_en;
  const raw = `${data.registry_number || label} - ${name || 'Certificate'}`;
  return raw.replace(/[^A-Za-z0-9._ -]+/g, '').trim() + '.pdf';
}
