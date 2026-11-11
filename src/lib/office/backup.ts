/**
 * Nightly backup of every certificate record to a Google Sheet owned by the
 * church (CERTIFICATE_BACKUP_SHEET_ID), shared with the site's Google service
 * account (GOOGLE_SERVICE_ACCOUNT_KEY, the same one used for the parishioner
 * sheet). Each run rewrites three tabs: Baptisms, Marriages, History. The
 * Sheet's own version history (File → Version history) keeps earlier copies.
 */
import { google } from 'googleapis';
import { query } from '@/lib/db';
import { recordAudit } from '@/lib/office/audit';
import { historyTable, recordsTable, type Table } from '@/lib/office/export';

export interface BackupResult {
  ok: boolean;
  counts?: Record<string, number>;
  error?: string;
}

export interface BackupRun {
  at: string;
  actor: string;
  ok: boolean;
  counts?: Record<string, number>;
  error?: string;
}

export function backupConfigured(): boolean {
  return !!process.env.CERTIFICATE_BACKUP_SHEET_ID && !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}

/** The service account's address, which the backup Sheet must be shared with. */
export function serviceAccountEmail(): string | null {
  try {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? '').client_email ?? null;
  } catch {
    return null;
  }
}

async function sheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth: (await auth.getClient()) as any });
}

async function writeTabs(tabs: Record<string, Table>): Promise<void> {
  const sheets = await sheetsClient();
  const spreadsheetId = process.env.CERTIFICATE_BACKUP_SHEET_ID!;
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
  const existing = new Map((meta.data.sheets ?? []).map((s) => [s.properties!.title!, s.properties!.sheetId!]));

  const missing = Object.keys(tabs).filter((t) => !existing.has(t));
  if (missing.length) {
    const added = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: missing.map((title) => ({ addSheet: { properties: { title } } })) },
    });
    for (const reply of added.data.replies ?? []) {
      const p = reply.addSheet?.properties;
      if (p?.title != null && p.sheetId != null) existing.set(p.title, p.sheetId);
    }
  }

  // Size each tab to fit (and freeze the header row) before writing.
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: Object.entries(tabs).map(([title, t]) => ({
        updateSheetProperties: {
          properties: {
            sheetId: existing.get(title),
            gridProperties: { rowCount: t.rows.length + 1, columnCount: t.headers.length, frozenRowCount: 1 },
          },
          fields: 'gridProperties(rowCount,columnCount,frozenRowCount)',
        },
      })),
    },
  });
  await sheets.spreadsheets.values.batchClear({ spreadsheetId, requestBody: { ranges: Object.keys(tabs).map((t) => `'${t}'`) } });
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      // RAW: values are stored as typed, never evaluated as formulas.
      valueInputOption: 'RAW',
      data: Object.entries(tabs).map(([title, t]) => ({ range: `'${title}'!A1`, values: [t.headers, ...t.rows] })),
    },
  });
}

/** Runs the backup and records the outcome (shown on the office backup page). */
export async function runBackup(actor: string): Promise<BackupResult> {
  if (!backupConfigured()) {
    return { ok: false, error: 'Backup is not set up yet (CERTIFICATE_BACKUP_SHEET_ID / GOOGLE_SERVICE_ACCOUNT_KEY).' };
  }
  let result: BackupResult;
  try {
    const [baptisms, marriages, history] = await Promise.all([recordsTable('baptism'), recordsTable('marriage'), historyTable()]);
    await writeTabs({ Baptisms: baptisms, Marriages: marriages, History: history });
    result = { ok: true, counts: { baptisms: baptisms.rows.length, marriages: marriages.rows.length, history: history.rows.length } };
  } catch (err) {
    result = { ok: false, error: describeError(err) };
  }
  await recordAudit(null, actor, 'backup', { ...result });
  return result;
}

function describeError(err: unknown): string {
  const e = err as { code?: number; message?: string };
  if (e?.code === 403) return 'Google refused access. Share the backup Sheet with the service account as an Editor.';
  if (e?.code === 404) return 'Google could not find the backup Sheet. Check CERTIFICATE_BACKUP_SHEET_ID.';
  if (/invalid_grant/.test(e?.message ?? '')) return 'Google rejected the service account key (GOOGLE_SERVICE_ACCOUNT_KEY). It may have been deleted or replaced.';
  return (e?.message ?? String(err)).slice(0, 300);
}

export async function recentBackups(limit = 10): Promise<BackupRun[]> {
  const rows = await query(
    `select created_at, actor, detail from audit_events
     where request_id is null and action = 'backup' order by created_at desc limit $1`,
    [limit],
  );
  return rows.map((r) => ({
    at: (r.created_at instanceof Date ? r.created_at : new Date(r.created_at)).toISOString(),
    actor: r.actor,
    ok: !!r.detail?.ok,
    counts: r.detail?.counts,
    error: r.detail?.error,
  }));
}
