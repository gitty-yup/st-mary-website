/**
 * Restores the certificate records into an EMPTY database from the backup.
 * Without --write it only reads the backup and reports what it would restore.
 *
 *   DATABASE_URL=... npm run certificates:restore -- --csv <folder> [--write]
 *       <folder> holds the Baptisms, Marriages and History tabs downloaded from the
 *       backup Sheet (File → Download → CSV, one tab at a time), or the office's
 *       CSV downloads (records only, no history). Files are matched by name.
 *
 *   DATABASE_URL=... GOOGLE_SERVICE_ACCOUNT_KEY=... npm run certificates:restore -- --sheet [<sheet id>] [--write]
 *       Reads the Sheet directly (default: CERTIFICATE_BACKUP_SHEET_ID). The Sheet
 *       must be shared with the service account.
 *
 * See "Restoring from the backup" in the README.
 */
import fs from 'fs';
import path from 'path';
import { withTransaction } from '../src/lib/db';
import { readSheetTabs } from '../src/lib/office/backup';
import { parseBackup, restoreBackup, type BackupTabs, type Grid } from '../src/lib/office/restore';

/** RFC 4180 CSV. The office's downloads start with a BOM and prefix formula-like cells with '; both are undone. */
export function parseCsv(text: string): Grid {
  const office = text.startsWith('﻿');
  if (office) text = text.slice(1);
  const rows: Grid = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') row.push(cell), (cell = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell), rows.push(row), (row = []), (cell = '');
    } else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return office ? rows.map((r) => r.map((v) => (/^'[=+\-@\t\r]/.test(v) ? v.slice(1) : v))) : rows;
}

function readCsvFolder(dir: string): BackupTabs {
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv'));
  const pick = (word: string) => {
    const found = files.filter((f) => f.toLowerCase().includes(word));
    if (found.length > 1) throw new Error(`More than one "${word}" file in ${dir}: ${found.join(', ')}`);
    if (found.length) console.log(`  ${word}: ${found[0]}`);
    return found.length ? parseCsv(fs.readFileSync(path.join(dir, found[0]), 'utf8')) : undefined;
  };
  return { baptisms: pick('baptism'), marriages: pick('marriage'), history: pick('history') };
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const csvAt = args.indexOf('--csv');
  const sheetAt = args.indexOf('--sheet');
  let tabs: BackupTabs;
  if (csvAt >= 0 && args[csvAt + 1]) {
    console.log(`Reading CSV files in ${args[csvAt + 1]}`);
    tabs = readCsvFolder(args[csvAt + 1]);
  } else if (sheetAt >= 0) {
    const id = args[sheetAt + 1]?.startsWith('--') ? undefined : args[sheetAt + 1];
    const sheetId = id || process.env.CERTIFICATE_BACKUP_SHEET_ID;
    if (!sheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) throw new Error('--sheet needs a Sheet ID and GOOGLE_SERVICE_ACCOUNT_KEY.');
    console.log('Reading the backup Sheet');
    const t = await readSheetTabs(sheetId, ['Baptisms', 'Marriages', 'History']);
    tabs = { baptisms: t.Baptisms, marriages: t.Marriages, history: t.History };
  } else {
    throw new Error('Say where the backup is: --csv <folder> or --sheet [<sheet id>]. Add --write to restore.');
  }

  const backup = parseBackup(tabs);
  const count = (type: string, status?: string) =>
    backup.records.filter((r) => r.type === type && (!status || r.status === status)).length;
  console.log(
    `\nBackup has ${count('baptism')} baptism records (${count('baptism', 'issued')} issued), ` +
      `${count('marriage')} marriage records (${count('marriage', 'issued')} issued), ` +
      `${backup.events.length} history entries.`,
  );
  if (backup.problems.length) console.log(`\nNotes:\n${backup.problems.map((p) => `  - ${p}`).join('\n')}`);
  if (!write) return console.log('\nNothing written. Add --write to restore into the database in DATABASE_URL.');

  const result = await withTransaction((client) => restoreBackup(client, backup, 'restore script'));
  console.log(`\nRestored ${result.records} records and ${result.history} history entries.`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`\nNot restored: ${err.message}`);
      process.exit(1);
    });
}
