import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  CERTIFICATE_FIELDS,
  SACRAMENT_DATE_FIELD,
  dataKeys,
  fieldLabel,
  formatCertificateDate,
  type FieldDef,
  type OfficeData,
} from '@/certificates/fields';
import type { CertificateType } from '@/certificates/types';
import type { AuditEntry, CertificateRecord } from '@/lib/office/records';
import { DECLINE_REASONS, STATUS_LABELS } from '@/lib/office/status';
import StatusActions from './StatusActions';

interface Unsupported {
  key: string;
  label: string;
  characters: string[];
}

interface Props {
  type: CertificateType;
  record: CertificateRecord | null;
  audit: AuditEntry[];
  initialData: OfficeData;
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 bg-white disabled:bg-gray-100 disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent';

export default function CertificateEditor({ type, record: initialRecord, audit: initialAudit, initialData }: Props) {
  const router = useRouter();
  const [record, setRecord] = useState(initialRecord);
  const [audit, setAudit] = useState(initialAudit);
  const [saved, setSaved] = useState<OfficeData>(initialData);
  const [data, setData] = useState<OfficeData>(initialData);
  const [busy, setBusy] = useState<'' | 'save' | 'preview' | 'issue'>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [unsupported, setUnsupported] = useState<Unsupported[]>([]);
  const [confirmIssue, setConfirmIssue] = useState(false);

  const dirty = useMemo(() => dataKeys(type).some((k) => (data[k] ?? '') !== (saved[k] ?? '')), [data, saved, type]);
  const issued = record?.status === 'issued' && !!record.registryNumber;
  /** Declined (until reopened) and voided records are read-only. */
  const locked = record?.status === 'declined' || record?.status === 'voided';
  const canIssue = !!record && !issued && !locked;
  // Why the record is in its current state (latest matching history entry).
  const statusEntry =
    record && ['needs_info', 'declined', 'voided'].includes(record.status)
      ? [...audit].reverse().find((a) => a.detail?.to === record.status)
      : undefined;
  const badKeys = new Set(unsupported.map((u) => u.key));

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function set(key: string, value: string) {
    setData((d) => ({ ...d, [key]: value }));
    setNotice('');
    if (badKeys.has(key)) setUnsupported((u) => u.filter((x) => x.key !== key));
  }

  async function handleError(res: Response) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setError('Your session has ended. Sign in again in another tab, then try again (your changes are still here).');
    } else {
      setError(body.unsupported?.length ? 'Some fields contain characters the certificate cannot print.' : body.error ?? 'Something went wrong.');
    }
    setUnsupported(body.unsupported ?? []);
  }

  async function save(): Promise<boolean> {
    setBusy('save');
    setError('');
    setUnsupported([]);
    try {
      const res = record
        ? await fetch(`/api/office/records/${record.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, version: record.version }),
          })
        : await fetch('/api/office/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data }),
          });
      if (!res.ok) {
        await handleError(res);
        return false;
      }
      const body = await res.json();
      setSaved(data);
      if (!record) {
        // Navigate to the new record's page (the beforeunload guard is off now: saved === data).
        await router.replace(`/office/records/${body.record.id}`);
        return true;
      }
      setRecord(body.record);
      setAudit(body.audit);
      setNotice('Saved.');
      return true;
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      return false;
    } finally {
      setBusy('');
    }
  }

  async function preview() {
    // Open the tab now, inside the click, so pop-up blockers allow it.
    const win = window.open('', '_blank');
    setBusy('preview');
    setError('');
    try {
      const res = await fetch('/api/office/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, id: record?.id }),
      });
      if (!res.ok) {
        win?.close();
        await handleError(res);
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      if (win) win.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      win?.close();
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy('');
    }
  }

  async function issue() {
    if (!record) return;
    setBusy('issue');
    setError('');
    try {
      const res = await fetch(`/api/office/records/${record.id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: record.version }),
      });
      if (!res.ok) {
        await handleError(res);
        return;
      }
      const body = await res.json();
      setRecord(body.record);
      setAudit(body.audit);
      setConfirmIssue(false);
      setNotice(`Issued as ${body.record.registryNumber}.`);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy('');
    }
  }

  const sacramentKey = SACRAMENT_DATE_FIELD[type];
  const emptyKeys = dataKeys(type).filter((k) => !data[k] && !k.startsWith('signature_'));

  return (
    <div className='grid gap-6 lg:grid-cols-[1fr_300px]'>
      <div className='space-y-6 min-w-0'>
        {CERTIFICATE_FIELDS[type].map((section) => {
          const body = (
            <fieldset disabled={locked} className='space-y-4 min-w-0'>
              {section.fields.map((f) => (
                <FieldRow key={f.key} field={f} data={data} set={set} bad={badKeys} />
              ))}
            </fieldset>
          );
          return section.parish ? (
            <details key={section.title} className='bg-white rounded-xl border border-gray-200 p-5'>
              <summary className='cursor-pointer font-secondary font-semibold text-primary'>
                {section.title} <span className='font-primary font-normal text-sm text-gray-500'>(officiant, church, city)</span>
              </summary>
              <div className='mt-4'>{body}</div>
            </details>
          ) : (
            <section key={section.title} className='bg-white rounded-xl border border-gray-200 p-5'>
              <h2 className='font-secondary font-semibold text-primary mb-4'>{section.title}</h2>
              {body}
            </section>
          );
        })}
      </div>

      <aside className='space-y-4 lg:sticky lg:top-4 self-start'>
        <div className='bg-white rounded-xl border border-gray-200 p-5 space-y-3'>
          <div className='text-sm text-gray-500'>Status</div>
          <div className='font-semibold'>{record ? STATUS_LABELS[record.status] : 'New (not saved yet)'}</div>
          {record?.registryNumber && (
            <div className='text-sm'>
              Registry number <span className='font-semibold'>{record.registryNumber}</span>
              <br />
              Certificate date {formatCertificateDate(record.certificateDate)}
            </div>
          )}
          {statusEntry && (
            <div className='text-sm bg-gray-50 rounded-lg p-3 whitespace-pre-line'>
              {typeof statusEntry.detail.reason === 'string' && (
                <div className='font-semibold'>{DECLINE_REASONS[statusEntry.detail.reason] ?? statusEntry.detail.reason}</div>
              )}
              {typeof statusEntry.detail.note === 'string' && <div>{statusEntry.detail.note}</div>}
              <div className='text-xs text-gray-500 mt-1'>
                {statusEntry.actor} · {new Date(statusEntry.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </div>
            </div>
          )}

          {error && <div className='text-sm text-error bg-red-50 rounded-lg p-3'>{error}</div>}
          {unsupported.length > 0 && (
            <ul className='text-sm text-error list-disc pl-5'>
              {unsupported.map((u) => (
                <li key={u.key}>
                  {u.label}: {u.characters.map((c) => `“${c}”`).join(' ')}
                </li>
              ))}
            </ul>
          )}
          {locked && (
            <p className='text-xs text-gray-500'>
              {record?.status === 'declined' ? 'Read-only. Reopen to edit or issue.' : 'Read-only. Its registry number is never reused.'}
            </p>
          )}
          {notice && !dirty && <div className='text-sm text-success'>{notice}</div>}

          <div className='flex flex-col gap-2 pt-1'>
            {!locked && (
              <button
                onClick={save}
                disabled={!!busy || (!!record && !dirty)}
                className='bg-primary text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40'
              >
                {busy === 'save' ? 'Saving…' : record ? (dirty ? 'Save changes' : 'All changes saved') : 'Save'}
              </button>
            )}
            {record?.status === 'voided' ? (
              <a
                href={`/api/office/records/${record.id}/pdf`}
                target='_blank'
                rel='noreferrer'
                className='text-center border border-primary text-primary rounded-lg px-4 py-2 font-semibold'
              >
                View voided certificate
              </a>
            ) : (
              <button
                onClick={preview}
                disabled={!!busy}
                className='border border-primary text-primary rounded-lg px-4 py-2 font-semibold disabled:opacity-40'
              >
                {busy === 'preview' ? 'Preparing…' : 'Preview PDF'}
              </button>
            )}

            {record && issued && (
              <>
                <a
                  href={`/api/office/records/${record.id}/pdf`}
                  target='_blank'
                  rel='noreferrer'
                  className={`text-center bg-secondary text-white rounded-lg px-4 py-2 font-semibold ${dirty ? 'pointer-events-none opacity-40' : ''}`}
                >
                  Open certificate to print
                </a>
                <a
                  href={`/api/office/records/${record.id}/pdf?download=1`}
                  className={`text-center text-sm text-primary underline ${dirty ? 'pointer-events-none opacity-40' : ''}`}
                >
                  Download PDF
                </a>
                {dirty && <p className='text-xs text-gray-500'>Save your changes to print the corrected certificate.</p>}
              </>
            )}

            {canIssue && !confirmIssue && (
              <button
                onClick={() => setConfirmIssue(true)}
                disabled={!!busy || dirty}
                className='bg-secondary text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40'
              >
                Issue certificate…
              </button>
            )}
            {canIssue && dirty && <p className='text-xs text-gray-500'>Save your changes before issuing.</p>}
            {!record && <p className='text-xs text-gray-500'>Save first; then you can issue the certificate.</p>}
          </div>

          {record && !confirmIssue && (
            <StatusActions
              key={`${record.id}-${record.status}`}
              record={record}
              dirty={dirty}
              onChanged={(r, a, message) => {
                setRecord(r);
                setAudit(a);
                setNotice(message);
                setError('');
                setUnsupported([]);
              }}
            />
          )}

          {canIssue && confirmIssue && (
            <div className='border-t pt-3 space-y-2 text-sm'>
              <p>
                Issuing assigns the next registry number for{' '}
                {data[sacramentKey] ? `${data[sacramentKey].slice(0, 4)}` : 'the sacrament year'} and dates the certificate today.
                Numbers are permanent.
              </p>
              {!data[sacramentKey] && (
                <p className='text-error'>Enter the {fieldLabel(type, sacramentKey).toLowerCase()} first.</p>
              )}
              {emptyKeys.length > 0 && (
                <div className='text-gray-600'>
                  These fields are blank and will print empty:
                  <ul className='list-disc pl-5'>
                    {emptyKeys.map((k) => (
                      <li key={k}>{fieldLabel(type, k)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className='flex gap-2'>
                <button
                  onClick={issue}
                  disabled={!!busy || !data[sacramentKey]}
                  className='bg-secondary text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-40'
                >
                  {busy === 'issue' ? 'Issuing…' : 'Issue now'}
                </button>
                <button onClick={() => setConfirmIssue(false)} className='px-3 py-2 text-gray-600'>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {record && audit.length > 0 && (
          <div className='bg-white rounded-xl border border-gray-200 p-5'>
            <div className='text-sm text-gray-500 mb-2'>History</div>
            <ul className='space-y-2 text-sm'>
              {audit.map((a, i) => (
                <li key={i}>
                  <div>{describe(type, a)}</div>
                  <div className='text-xs text-gray-500'>
                    {a.actor} · {new Date(a.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function describe(type: CertificateType, a: AuditEntry): string {
  switch (a.action) {
    case 'create':
      return 'Created';
    case 'submit':
      return 'Submitted online by the family';
    case 'notify': {
      const notice = a.detail.notice as { sent?: boolean; to?: string[] } | undefined;
      return notice?.sent
        ? `Notification emailed to ${(notice.to ?? []).join(', ')}`
        : 'Notification email FAILED; check this record was seen';
    }
    case 'issue':
      return `Issued as ${a.detail.registryNumber}`;
    case 'approve':
      return 'Marked ready to issue';
    case 'needs_info':
      return `Asked for more information: ${a.detail.note ?? ''}`;
    case 'decline': {
      const reason = DECLINE_REASONS[String(a.detail.reason)] ?? 'Declined';
      return `Declined (${reason.toLowerCase()})${a.detail.note ? `: ${a.detail.note}` : ''}`;
    }
    case 'reopen':
      return 'Reopened';
    case 'void':
      return `Voided: ${a.detail.note ?? ''}`;
    case 'email':
      return a.detail.sent
        ? `Emailed the family${a.detail.test ? ' (test site: sent to info@ instead)' : ''}`
        : 'Email to the family FAILED; contact them directly';
    case 'download':
      return 'Opened the issued certificate';
    case 'update': {
      const keys = Object.keys((a.detail.changes as object) ?? {});
      const what = keys.map((k) => fieldLabel(type, k)).join(', ');
      return `${a.detail.afterIssue ? 'Corrected after issue' : 'Edited'}: ${what}`;
    }
    default:
      return a.action;
  }
}

function FieldRow({
  field,
  data,
  set,
  bad,
}: {
  field: FieldDef;
  data: OfficeData;
  set: (key: string, value: string) => void;
  bad: Set<string>;
}) {
  const ring = (key: string) => (bad.has(key) ? ' ring-2 ring-red-400' : '');
  if (field.kind === 'bilingual') {
    const en = `${field.key}_en`;
    const hy = `${field.key}_hy`;
    return (
      <fieldset>
        <legend className='block text-sm font-semibold text-gray-700 mb-1'>{field.label}</legend>
        <div className='grid gap-2 sm:grid-cols-2'>
          <label className='block'>
            <span className='text-xs text-gray-500'>English</span>
            <input className={inputClass + ring(en)} value={data[en] ?? ''} onChange={(e) => set(en, e.target.value)} maxLength={200} />
          </label>
          <label className='block'>
            <span className='text-xs text-gray-500'>Armenian · Հայերէն</span>
            <input
              lang='hy'
              className={inputClass + ring(hy)}
              value={data[hy] ?? ''}
              onChange={(e) => set(hy, e.target.value)}
              maxLength={200}
            />
          </label>
        </div>
        {field.help && <p className='text-xs text-gray-500 mt-1'>{field.help}</p>}
      </fieldset>
    );
  }
  return (
    <label className='block max-w-sm'>
      <span className='block text-sm font-semibold text-gray-700 mb-1'>{field.label}</span>
      <input
        type={field.kind === 'date' ? 'date' : 'text'}
        className={inputClass + ring(field.key)}
        value={data[field.key] ?? ''}
        onChange={(e) => set(field.key, e.target.value)}
        maxLength={200}
      />
      {field.help && <p className='text-xs text-gray-500 mt-1'>{field.help}</p>}
    </label>
  );
}
