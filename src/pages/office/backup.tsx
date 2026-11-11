import type { GetServerSideProps } from 'next';
import React, { useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { requireOfficePage } from '@/lib/office/auth';
import { backupConfigured, recentBackups, serviceAccountEmail, type BackupRun } from '@/lib/office/backup';

interface Props {
  email: string;
  configured: boolean;
  nightly: boolean;
  serviceAccount: string | null;
  sheetUrl: string | null;
  runs: BackupRun[];
}

function when(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function BackupPage({ email, configured, nightly, serviceAccount, sheetUrl, runs: initialRuns }: Props) {
  const [runs, setRuns] = useState(initialRuns);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function backUpNow() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/office/backup', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setMessage({ ok: false, text: 'Your session has ended. Sign in again, then try again.' });
        return;
      }
      if (body.runs) setRuns(body.runs);
      setMessage(body.ok ? { ok: true, text: 'Backup complete.' } : { ok: false, text: body.error ?? 'Backup failed.' });
    } catch {
      setMessage({ ok: false, text: 'Could not reach the server. Check your connection and try again.' });
    } finally {
      setBusy(false);
    }
  }

  const lastOk = runs.find((r) => r.ok);

  return (
    <OfficeLayout title='Export & backup' email={email}>
      <h1 className='font-secondary text-2xl font-semibold text-primary mb-4'>Export &amp; backup</h1>

      <section className='bg-white rounded-xl border border-gray-200 p-5 mb-6'>
        <h2 className='font-secondary font-semibold text-primary mb-2'>Download a spreadsheet</h2>
        <p className='text-sm text-gray-600 mb-4'>
          Every record of that type, all statuses, with certificate fields and the family&apos;s original answers. Opens in
          Excel, Numbers or Google Sheets. The file contains personal information, so store it carefully.
        </p>
        <div className='flex flex-wrap gap-3'>
          <a href='/api/office/export?type=baptism' className='bg-primary text-white rounded-lg px-4 py-2 font-semibold text-sm'>
            Baptisms (CSV)
          </a>
          <a href='/api/office/export?type=marriage' className='bg-primary text-white rounded-lg px-4 py-2 font-semibold text-sm'>
            Marriages (CSV)
          </a>
        </div>
      </section>

      <section className='bg-white rounded-xl border border-gray-200 p-5'>
        <h2 className='font-secondary font-semibold text-primary mb-2'>Nightly backup to Google Sheets</h2>
        {!configured ? (
          <div className='text-sm space-y-2'>
            <p className='text-error font-semibold'>Not set up yet.</p>
            <p className='text-gray-600'>
              Create a Google Sheet in the church&apos;s Google Drive, share it as an <strong>Editor</strong> with{' '}
              <code className='bg-gray-100 px-1 rounded'>{serviceAccount ?? 'the website’s Google service account'}</code>, and
              add its ID to Vercel as <code className='bg-gray-100 px-1 rounded'>CERTIFICATE_BACKUP_SHEET_ID</code>.
            </p>
          </div>
        ) : (
          <div className='text-sm space-y-3'>
            <p className='text-gray-600'>
              Every night, all records are copied to the{' '}
              {sheetUrl ? (
                <a href={sheetUrl} target='_blank' rel='noreferrer' className='text-primary underline'>
                  backup Sheet
                </a>
              ) : (
                'backup Sheet'
              )}{' '}
              (tabs: Baptisms, Marriages, History). Earlier copies are in the Sheet&apos;s File → Version history.
            </p>
            {!nightly && (
              <p className='text-error'>
                The nightly schedule isn&apos;t active: <code className='bg-gray-100 px-1 rounded'>CRON_SECRET</code> is not
                set in Vercel. &ldquo;Back up now&rdquo; still works.
              </p>
            )}
            <p>
              Last successful backup: <strong>{lastOk ? when(lastOk.at) : 'never'}</strong>
              {lastOk?.counts && (
                <span className='text-gray-500'>
                  {' '}
                  ({lastOk.counts.baptisms} baptisms, {lastOk.counts.marriages} marriages)
                </span>
              )}
            </p>
            <button
              onClick={backUpNow}
              disabled={busy}
              className='bg-secondary text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40'
            >
              {busy ? 'Backing up…' : 'Back up now'}
            </button>
            {message && <div className={`rounded-lg p-3 ${message.ok ? 'bg-green-50 text-success' : 'bg-red-50 text-error'}`}>{message.text}</div>}
          </div>
        )}

        {runs.length > 0 && (
          <div className='mt-5'>
            <div className='text-sm text-gray-500 mb-2'>Recent backups</div>
            <ul className='text-sm space-y-1'>
              {runs.map((r, i) => (
                <li key={i}>
                  <span className={r.ok ? 'text-success' : 'text-error'}>{r.ok ? 'OK' : 'Failed'}</span> · {when(r.at)} ·{' '}
                  <span className='text-gray-500'>{r.actor}</span>
                  {!r.ok && r.error && <div className='text-xs text-gray-600 pl-4'>{r.error}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx);
  if ('redirect' in auth) return auth;
  const sheetId = process.env.CERTIFICATE_BACKUP_SHEET_ID;
  return {
    props: {
      email: auth.session.email,
      configured: backupConfigured(),
      nightly: !!process.env.CRON_SECRET,
      serviceAccount: serviceAccountEmail(),
      sheetUrl: sheetId ? `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/edit` : null,
      runs: await recentBackups(),
    },
  };
};
