import React from 'react';
import { INTAKE_FORMS, intakeDisplayValue } from '@/certificates/intake';
import type { CertificateType } from '@/certificates/types';

/** Read-only view of exactly what the family submitted online. */
export default function SubmissionPanel({
  type,
  submitted,
  createdAt,
  defaultOpen,
}: {
  type: CertificateType;
  submitted: Record<string, string>;
  createdAt: string;
  defaultOpen: boolean;
}) {
  const when = new Date(createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <details open={defaultOpen} className='bg-white rounded-xl border border-gray-200 p-5 mb-6'>
      <summary className='cursor-pointer font-secondary font-semibold text-primary'>
        Submitted by the family <span className='font-primary font-normal text-sm text-gray-500'>({when})</span>
      </summary>
      <p className='text-sm text-gray-500 mt-2'>
        The family’s original answers, unchanged. The certificate fields below started as a copy of these; edit those,
        not these.
      </p>
      <div className='grid gap-x-8 gap-y-4 md:grid-cols-2 mt-4'>
        {INTAKE_FORMS[type].map((section) => (
          <div key={section.title}>
            <h3 className='text-sm font-semibold text-gray-700 mb-1'>{section.title}</h3>
            <dl className='text-sm'>
              {section.fields.map((f) => {
                const value = intakeDisplayValue(type, f.key, submitted[f.key] ?? '');
                const hy = f.armenian ? submitted[`${f.key}_hy`] : '';
                return (
                  <div key={f.key} className='flex gap-3 py-0.5'>
                    <dt className='text-gray-500 w-40 shrink-0'>{f.label}</dt>
                    <dd className='min-w-0 break-words whitespace-pre-line'>
                      {value || <span className='text-gray-400'>—</span>}
                      {hy && (
                        <span lang='hy' className='block text-gray-600'>
                          {hy}
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </details>
  );
}
