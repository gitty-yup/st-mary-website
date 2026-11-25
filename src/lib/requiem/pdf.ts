import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import qrcode from 'qrcode-generator';
import { ARMENIAN_BOLD_TTF } from '@/certificates/assets.generated';
import { OCCASIONS, SAME_DAY_CUTOFF_LABEL } from '@/lib/requiem/rules';

/**
 * Printable PDFs for the parish office: the blank paper Hokihankist request form (for people
 * who can't use a phone or computer) and the same-day QR code sign. Letter, portrait.
 */

const W = 612;
const H = 792;
const M = 44;
const NAVY = rgb(0, 47 / 255, 114 / 255);
const ORANGE = rgb(254 / 255, 101 / 255, 52 / 255);
const GREY = rgb(0.38, 0.38, 0.38);
const RULE = rgb(0.6, 0.6, 0.6);
const BLACK = rgb(0.1, 0.1, 0.1);
const ARMENIAN_NAME = 'Հոգեհանգիստ';
const PHONE = '949.650.8367';

interface Fonts {
  reg: PDFFont;
  bold: PDFFont;
  arm: PDFFont;
}

async function newDoc(title: string) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(title);
  doc.setAuthor('St. Mary Armenian Apostolic Church, Costa Mesa');
  doc.setCreator('St. Mary website');
  const fonts: Fonts = {
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    arm: await doc.embedFont(ARMENIAN_BOLD_TTF, { subset: true }),
  };
  return { doc, page: doc.addPage([W, H]), fonts };
}

type Run = { text: string; font: PDFFont };
const runWidth = (runs: Run[], size: number) => runs.reduce((w, r) => w + r.font.widthOfTextAtSize(r.text, size), 0);

/** Draws text made of runs in different fonts (English and Armenian), centred on the page. */
function centred(page: PDFPage, runs: Run[], y: number, size: number, color = NAVY) {
  let x = (W - runWidth(runs, size)) / 2;
  for (const r of runs) {
    page.drawText(r.text, { x, y, size, font: r.font, color });
    x += r.font.widthOfTextAtSize(r.text, size);
  }
}

function header(page: PDFPage, f: Fonts, y: number) {
  centred(page, [{ text: 'St. Mary Armenian Apostolic Church', font: f.bold }], y, 11, GREY);
  centred(page, [{ text: `Costa Mesa, California  ·  Parish office ${PHONE}`, font: f.reg }], y - 13, 9, GREY);
}

// --- The blank request form --------------------------------------------------------

export const PAPER_NAME_ROWS = 5;

export async function renderBlankRequiemForm(): Promise<Uint8Array> {
  const { doc, page, fonts: f } = await newDoc('Hokihankist Request Form');
  const L = M;
  const R = W - M;
  const LABEL = 10;
  let y = H - M;

  const text = (s: string, x: number, at: number, size = LABEL, font = f.reg, color = BLACK) => {
    page.drawText(s, { x, y: at, size, font, color });
    return x + font.widthOfTextAtSize(s, size);
  };
  /** "Label ________" from x to `to`; returns where the line ends. */
  const field = (label: string, x: number, to: number, at: number) => {
    const start = label ? text(label, x, at) + 5 : x;
    page.drawLine({ start: { x: start, y: at - 2 }, end: { x: to, y: at - 2 }, thickness: 0.6, color: RULE });
    return to;
  };
  /** An empty tick box with its label; returns where the label ends. */
  const box = (label: string, x: number, at: number, size = LABEL) => {
    page.drawRectangle({ x, y: at - 1.5, width: 9, height: 9, borderColor: BLACK, borderWidth: 0.8 });
    return text(label, x + 14, at, size);
  };
  const section = (title: string, note?: string) => {
    y -= 24;
    const end = text(title.toUpperCase(), L, y, 10.5, f.bold, NAVY);
    if (note) text(note, end + 8, y, 8.5, f.reg, GREY);
    page.drawLine({ start: { x: L, y: y - 5 }, end: { x: R, y: y - 5 }, thickness: 1, color: ORANGE });
    y -= 22;
  };

  header(page, f, y);
  y -= 40;
  // English in Helvetica, the Armenian word in the certificates' Armenian font.
  const title: Run[] = [
    { text: 'Hokihankist (', font: f.bold },
    { text: ARMENIAN_NAME, font: f.arm },
    { text: ') Request', font: f.bold },
  ];
  centred(page, title, y, 20);
  y -= 17;
  centred(page, [{ text: 'Requiem Service  ·  Offered on Sundays and Merelots days at the conclusion of the Divine Liturgy', font: f.reg }], y, 9.5, GREY);
  y -= 12;
  centred(page, [{ text: 'Not offered on the five major feast days.  Please print clearly.', font: f.reg }], y, 9.5, GREY);

  y -= 26;
  field('Date of the service (a Sunday or Merelots day):', L, L + 380, y);

  section('In memory of', 'Please print the names as they should be read aloud.');
  const [yot, kar] = OCCASIONS.filter((o) => o.value === 'yotnorek' || o.value === 'karasoonk').map((o) => {
    const [name, when] = o.label.split(' – ');
    return `${name} (${when.replace('seventh', '7th').replace('fortieth', '40th')})`;
  });
  for (let i = 0; i < PAPER_NAME_ROWS; i++) {
    text(`${i + 1}.`, L, y, LABEL, f.bold, NAVY);
    field('Name of the departed', L + 16, L + 330, y);
    field('Relationship', L + 342, R, y);
    y -= 21;
    let x = text('Occasion:', L + 16, y, 9, f.reg, GREY) + 8;
    x = box(yot, x, y, 9) + 12;
    x = box(kar, x, y, 9) + 12;
    x = box('Darelits:', x, y, 9) + 4;
    page.drawLine({ start: { x, y: y - 2 }, end: { x: x + 26, y: y - 2 }, thickness: 0.6, color: RULE });
    x = text('anniversary', x + 30, y, 9) + 12;
    x = box('Other:', x, y, 9) + 4;
    page.drawLine({ start: { x, y: y - 2 }, end: { x: R, y: y - 2 }, thickness: 0.6, color: RULE });
    y -= 29;
  }
  y += 29;

  y -= 26;
  field('Others requesting the same service (optional):', L, R, y);

  section('Hokijash and fellowship hour (optional)', 'Tick any you would like; someone from the church will contact you.');
  box('Hokijash (memorial meal)', L, y);
  box('Sponsor the fellowship hour (coffee hour) after the service', L + 190, y);
  y -= 22;
  field('Notes:', L, R, y);

  section('A memorial offering (optional)', 'An expression of stewardship and gratitude, not a payment for prayers.');
  let x = text('If you plan to give, how?', L, y) + 14;
  x = box('Enclosed with this form', x, y) + 18;
  x = box('Online', x, y) + 18;
  box('At church on Sunday', x, y);

  section('Your contact information', 'So we can reach you about the service.');
  field('Your name:', L, R, y);
  y -= 24;
  field('Phone:', L, L + 230, y);
  field('Email:', L + 245, R, y);
  y -= 24;
  field('Street address:', L, R, y);
  y -= 24;
  field('City:', L, L + 300, y);
  field('State:', L + 315, L + 400, y);
  field('ZIP:', L + 415, R, y);
  y -= 22;
  box("Send me St. Mary's email newsletter with parish news and events.", L, y);

  // Office use only, along the bottom.
  const boxTop = M + 34;
  page.drawRectangle({ x: L, y: M, width: R - L, height: 34, borderColor: GREY, borderWidth: 0.8, borderDashArray: [3, 2] });
  const oy = M + 13;
  x = text('OFFICE USE ONLY', L + 10, oy, 8.5, f.bold, GREY) + 14;
  x = field('Received by', x, x + 150, oy) + 12;
  x = field('Date', x, x + 90, oy) + 12;
  box('Entered on the website', x, oy, 9);
  if (y - 14 < boxTop) throw new Error(`Hokihankist form overflows the page by ${Math.ceil(boxTop - (y - 14))}pt`);

  return doc.save();
}

// --- The same-day QR code sign -----------------------------------------------------

export async function renderSameDaySign(url: string): Promise<Uint8Array> {
  const { doc, page, fonts: f } = await newDoc('Same-day Hokihankist request sign');
  let y = H - M - 10;
  header(page, f, y);

  y -= 62;
  centred(page, [{ text: 'Requesting a', font: f.bold }], y, 34);
  y -= 40;
  centred(page, [{ text: 'Hokihankist today?', font: f.bold }], y, 34);
  y -= 28;
  centred(page, [{ text: ARMENIAN_NAME, font: f.arm }], y, 18, ORANGE);
  y -= 32;
  centred(page, [{ text: 'Scan with your phone’s camera to fill out the request form.', font: f.reg }], y, 15, BLACK);

  // The code: error correction Q (a creased or smudged sign still scans), with a quiet border.
  const qr = qrcode(0, 'Q');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const size = 290;
  const cell = size / (n + 8);
  const left = (W - size) / 2;
  const top = y - 22;
  page.drawRectangle({ x: left, y: top - size, width: size, height: size, color: rgb(1, 1, 1) });
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) page.drawRectangle({ x: left + (c + 4) * cell, y: top - (r + 5) * cell, width: cell + 0.05, height: cell + 0.05, color: rgb(0, 0, 0) });
    }
  }
  y = top - size - 30;
  centred(page, [{ text: `Same-day requests: Sundays and Merelots days, until ${SAME_DAY_CUTOFF_LABEL}.`, font: f.bold }], y, 14, NAVY);
  y -= 22;
  centred(page, [{ text: 'Need help, or not able to use a phone? Please ask in the parish office.', font: f.reg }], y, 12.5, BLACK);
  centred(page, [{ text: url, font: f.reg }], M + 4, 7.5, GREY);
  return doc.save();
}
