import React, { useState } from 'react';
import type { AuditEntry, CertificateRecord } from '@/lib/office/records';
import { DECLINE_REASONS, STATUS_ACTIONS, type StatusAction } from '@/lib/office/status';

interface Props {
  record: CertificateRecord;
  /** Unsaved edits: actions wait until they're saved. */
  dirty: boolean;
  onChanged: (record: CertificateRecord, audit: AuditEntry[], notice: string) => void;
}

const BUTTON: Record<StatusAction, { label: string; style: string }> = {
  approve: { label: 'Mark ready to issue', style: 'border border-primary text-primary' },
  needs_info: { label: 'Ask for more information…', style: 'border border-gray-300 text-gray-700' },
  decline: { label: 'Decline…', style: 'border border-gray-300 text-gray-700' },
  reopen: { label: 'Reopen', style: 'border border-primary text-primary' },
  void: { label: 'Void certificate…', style: 'border border-red-300 text-error' },
};

const ORDER: StatusAction[] = ['approve', 'needs_info', 'decline', 'reopen', 'void'];

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white';

/** Review actions for a record: approve, ask for info, decline, reopen, void. */
export default function StatusActions({ record, dirty, onChanged }: Props) {
  const [open, setOpen] = useState<StatusAction | null>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [emailFamily, setEmailFamily] = useState(!!record.contactEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const available = ORDER.filter((a) => STATUS_ACTIONS[a].from.includes(record.status));
  if (!available.length) return null;

  function start(action: StatusAction) {
    setOpen(action);
    setNote('');
    setReason('');
    setError('');
    setEmailFamily(!!record.contactEmail);
  }

  async function submit(action: StatusAction) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/office/records/${record.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, version: record.version, note, reason, emailFamily: action === 'needs_info' && emailFamily }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 401 ? 'Your session has ended. Sign in again in another tab, then try again.' : body.error ?? 'Something went wrong.');
        return;
      }
      setOpen(null);
      let notice = {
        approve: 'Marked ready to issue.',
        needs_info: 'Marked as needing information.',
        decline: 'Declined.',
        reopen: 'Reopened.',
        void: 'Certificate voided.',
      }[action];
      if (body.emailed === true) notice += ' The family was emailed.';
      if (body.emailed === false) notice += ' The email to the family FAILED; please contact them directly.';
      onChanged(body.record, body.audit, notice);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || dirty;
  const needsNote = open === 'needs_info' || open === 'void' || (open === 'decline' && reason === 'other');
  const ready = !!open && (!needsNote || !!note.trim()) && (open !== 'decline' || !!reason);

  return (
    <div className='border-t pt-3 space-y-2'>
      {!open && (
        <div className='flex flex-col gap-2'>
          {available.map((a) =>
            a === 'approve' || a === 'reopen' ? (
              <button key={a} onClick={() => submit(a)} disabled={disabled} className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${BUTTON[a].style}`}>
                {busy ? 'Saving…' : BUTTON[a].label}
              </button>
            ) : (
              <button key={a} onClick={() => start(a)} disabled={disabled} className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${BUTTON[a].style}`}>
                {BUTTON[a].label}
              </button>
            ),
          )}
          {dirty && <p className='text-xs text-gray-500'>Save your changes first.</p>}
        </div>
      )}

      {open === 'needs_info' && (
        <div className='space-y-2 text-sm'>
          <label className='block'>
            <span className='block font-semibold text-gray-700 mb-1'>What information is needed?</span>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              className={inputClass}
              placeholder='e.g. Please send a copy of the marriage license.'
            />
          </label>
          {record.contactEmail ? (
            <label className='flex items-start gap-2'>
              <input type='checkbox' checked={emailFamily} onChange={(e) => setEmailFamily(e.target.checked)} className='mt-1' />
              <span>
                Email this to the family ({record.contactName ?? 'contact'}). Their replies go to info@.
              </span>
            </label>
          ) : (
            <p className='text-gray-500'>No family email on file; contact them directly.</p>
          )}
        </div>
      )}

      {open === 'decline' && (
        <div className='space-y-2 text-sm'>
          <span className='block font-semibold text-gray-700'>Reason</span>
          {Object.entries(DECLINE_REASONS).map(([value, label]) => (
            <label key={value} className='flex items-center gap-2'>
              <input type='radio' name='decline-reason' value={value} checked={reason === value} onChange={() => setReason(value)} />
              {label}
            </label>
          ))}
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            className={inputClass}
            placeholder={reason === 'other' ? 'Describe the reason' : 'Note (optional)'}
          />
          <p className='text-gray-500'>The family is not emailed. Declined records can be reopened.</p>
        </div>
      )}

      {open === 'void' && (
        <div className='space-y-2 text-sm'>
          <p>
            Voiding marks certificate <strong>{record.registryNumber}</strong> as not valid. The number stays assigned to this
            record and is never reused. To fix a typo, edit and reprint instead of voiding.
          </p>
          <label className='block'>
            <span className='block font-semibold text-gray-700 mb-1'>Reason for voiding</span>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} className={inputClass} />
          </label>
        </div>
      )}

      {open && (
        <div className='flex gap-2'>
          <button
            onClick={() => submit(open)}
            disabled={busy || !ready}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 ${open === 'void' ? 'bg-error' : 'bg-primary'}`}
          >
            {busy
              ? 'Saving…'
              : open === 'needs_info'
                ? emailFamily && record.contactEmail
                  ? 'Send and mark'
                  : 'Mark as needing info'
                : open === 'void'
                  ? 'Void certificate'
                  : 'Decline'}
          </button>
          <button onClick={() => setOpen(null)} disabled={busy} className='px-3 py-2 text-sm text-gray-600'>
            Cancel
          </button>
        </div>
      )}
      {error && <div className='text-sm text-error bg-red-50 rounded-lg p-3'>{error}</div>}
    </div>
  );
}
