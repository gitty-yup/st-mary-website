import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_TAB = process.env.GOOGLE_SHEET_TAB ?? 'Sheet1';

function getAuth() {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetsClient() {
  const auth = getAuth();
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client as any });
}

async function getAllRows(): Promise<string[][]> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A1:ZZ`,
  });
  return (res.data.values ?? []) as string[][];
}

export interface ParishionerRecord {
  rowIndex: number; // 1-based sheet row (row 1 = headers, row 2 = first data row)
  First_Name: string;
  Middle_Name: string;
  Last_Name: string;
  Preferred_Name: string;
  Email: string;
  Phone: string;
  Address_Line_1: string;
  Address_Line_2: string;
  City: string;
  State: string;
  ZIP: string;
  Country: string;
  Dues_Status: string;
  Last_Verified: string;
}

const EDITABLE_FIELDS: (keyof ParishionerRecord)[] = [
  'First_Name', 'Middle_Name', 'Last_Name', 'Preferred_Name',
  'Email', 'Phone', 'Address_Line_1', 'Address_Line_2',
  'City', 'State', 'ZIP', 'Country', 'Last_Verified',
];

function rowToRecord(headers: string[], row: string[], rowIndex: number): ParishionerRecord {
  const get = (col: string) => {
    const idx = headers.indexOf(col);
    return idx !== -1 ? (row[idx] ?? '') : '';
  };
  return {
    rowIndex,
    First_Name: get('First_Name'),
    Middle_Name: get('Middle_Name'),
    Last_Name: get('Last_Name'),
    Preferred_Name: get('Preferred_Name'),
    Email: get('Email'),
    Phone: get('Phone'),
    Address_Line_1: get('Address_Line_1'),
    Address_Line_2: get('Address_Line_2'),
    City: get('City'),
    State: get('State'),
    ZIP: get('ZIP'),
    Country: get('Country'),
    Dues_Status: get('Dues_Status'),
    Last_Verified: get('Last_Verified'),
  };
}

export async function findByEmail(email: string): Promise<ParishionerRecord[]> {
  const rows = await getAllRows();
  if (rows.length < 2) return [];
  const headers = rows[0];
  const emailCol = headers.indexOf('Email');
  if (emailCol === -1) throw new Error('Email column not found in sheet');

  const matches: ParishionerRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if ((row[emailCol] ?? '').toLowerCase().trim() === email.toLowerCase().trim()) {
      matches.push(rowToRecord(headers, row, i + 1)); // i+1: sheet rows are 1-based, row 1 is headers
    }
  }
  return matches;
}

export async function getRecord(rowIndex: number): Promise<ParishionerRecord | null> {
  const rows = await getAllRows();
  if (rows.length < 2) return null;
  const headers = rows[0];
  const row = rows[rowIndex - 1]; // rowIndex is 1-based; index 0 = headers, index 1 = sheet row 2
  if (!row) return null;
  return rowToRecord(headers, row, rowIndex);
}

export async function updateRecord(
  rowIndex: number,
  data: Partial<Omit<ParishionerRecord, 'rowIndex' | 'Dues_Status'>>
): Promise<void> {
  const sheets = await getSheetsClient();

  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!1:1`,
  });
  const headers = (headerRes.data.values?.[0] ?? []) as string[];

  const rowRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!${rowIndex}:${rowIndex}`,
  });
  const currentRow = [...((rowRes.data.values?.[0] ?? []) as string[])];
  while (currentRow.length < headers.length) currentRow.push('');

  for (const field of EDITABLE_FIELDS) {
    const colIdx = headers.indexOf(field);
    if (colIdx !== -1 && data[field as keyof typeof data] !== undefined) {
      currentRow[colIdx] = data[field as keyof typeof data] as string;
    }
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [currentRow] },
  });
}
