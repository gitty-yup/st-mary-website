import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TURNSTILE_SITE_KEY as SITE_KEY, useTurnstile } from '@/components/forms/useTurnstile';
import {
  MAX_NAMES,
  OCCASIONS,
  cleanRequiem,
  emptyRemembrance,
  longDate,
  nextServiceSundays,
  parishToday,
  type RemembranceInput,
} from '@/lib/requiem/rules';

const inputClass =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent';

type Contact = { name: string; address: string; city: string; state: string; zip: string; phone: string; email: string };

/** Field ids are `f-` plus the error key with dots as dashes (names.0.name → f-names-0-name). */
const fieldId = (key: string) => `f-${key.replace(/\./g, '-')}`;

export default function RequiemForm() {
  const [serviceDate, setServiceDate] = useState('');
  const [names, setNames] = useState<RemembranceInput[]>([emptyRemembrance()]);
  const [contact, setContact] = useState<Contact>({ name: '', address: '', city: '', state: 'CA', zip: '', phone: '', email: '' });
  const [others, setOthers] = useState('');
  // Ticked to start with (the parish's choice); people can untick it.
  const [newsletter, setNewsletter] = useState(true);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const turnstile = useTurnstile();
  const topRef = useRef<HTMLDivElement>(null);
  // The page is built ahead of time, so today's date is worked out in the browser.
  const [today, setToday] = useState('');
  useEffect(() => setToday(parishToday()), []);
  const suggestions = useMemo(() => (today ? nextServiceSundays(3, today) : []), [today]);

  const clearError = (key: string) => errors[key] && setErrors((e) => ({ ...e, [key]: '' }));
  const setField = (key: keyof Contact, value: string) => {
    setContact((c) => ({ ...c, [key]: value }));
    clearError(key);
  };
  const setRow = (i: number, key: keyof RemembranceInput, value: string) => {
    setNames((rows) => rows.map((r, k) => (k === i ? { ...r, [key]: value } : r)));
    clearError(`names.${i}.${key}`);
  };
  const chooseDate = (d: string) => {
    setServiceDate(d);
    clearError('serviceDate');
  };

  function payload() {
    return { serviceDate, ...contact, others, names, newsletter };
  }

  function showErrors(errs: Record<string, string>, message: string) {
    setErrors(errs);
    setFormError(message);
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) document.getElementById(fieldId(first))?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const check = cleanRequiem(payload(), today || parishToday());
    if (Object.keys(check.errors).length) return showErrors(check.errors, 'Please fix the highlighted fields.');
    if (SITE_KEY && !turnstile.token) return setFormError('Please complete the “verify you are human” check below.');
    setState('sending');
    try {
      const res = await fetch('/api/forms/requiem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload(), website: honeypot, turnstileToken: turnstile.token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        turnstile.reset();
        setState('idle');
        return showErrors(body.errors ?? {}, body.error ?? 'Something went wrong. Please try again.');
      }
      setState('done');
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        topRef.current?.focus({ preventScroll: true });
      }, 0);
    } catch {
      turnstile.reset();
      setState('idle');
      setFormError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (state === 'done') {
    return (
      <div ref={topRef} tabIndex={-1} className='bg-white rounded-2xl shadow-sm p-8 text-center space-y-3 outline-none'>
        <h2 className='font-secondary font-bold text-2xl text-primary'>Thank you</h2>
        <p className='text-gray-700'>
          Your request for a Hokihankist on <strong>{longDate(serviceDate)}</strong> was sent to Hayr Eremia and the
          parish office. We also emailed you a receipt.
        </p>
        <p className='text-gray-700'>If anything changes, reply to that email or call the office at 949.650.8367.</p>
        <p lang='hy' className='text-primary font-semibold pt-2'>
          Աստուած հոգիները լուսաւորէ։
        </p>
        <p className='italic text-gray-600'>May God grant light to their souls.</p>
      </div>
    );
  }

  const err = (key: string) => errors[key];
  return (
    <form onSubmit={submit} noValidate className='space-y-6'>
      <fieldset className='bg-white rounded-2xl shadow-sm p-6'>
        <legend className='sr-only'>The service</legend>
        <h2 className='font-secondary font-bold text-xl text-primary' aria-hidden>
          The service
        </h2>
        <p className='text-sm text-gray-600 mt-1'>Choose the Sunday you would like, or tap one of the upcoming Sundays.</p>
        <div className='mt-4'>
          <Label htmlFor={fieldId('serviceDate')} required>
            Date of the service
          </Label>
          <input
            id={fieldId('serviceDate')}
            type='date'
            min={suggestions[0]}
            value={serviceDate}
            aria-invalid={!!err('serviceDate')}
            aria-describedby={err('serviceDate') ? `${fieldId('serviceDate')}-err` : `${fieldId('serviceDate')}-help`}
            onChange={(e) => chooseDate(e.target.value)}
            className={`${inputClass} sm:max-w-xs${err('serviceDate') ? ' !border-error' : ''}`}
          />
          {err('serviceDate') ? (
            <p id={`${fieldId('serviceDate')}-err`} className='text-xs text-error mt-1'>
              {err('serviceDate')}
            </p>
          ) : (
            <p id={`${fieldId('serviceDate')}-help`} className='text-xs text-gray-500 mt-1'>
              {serviceDate ? longDate(serviceDate) : 'A Sunday. Not offered on the five major feast days.'}
            </p>
          )}
          <div className='flex flex-wrap gap-2 mt-3 min-h-[2.25rem]' role='group' aria-label='Upcoming Sundays'>
            {suggestions.length > 0 && <span className='text-sm text-gray-600 self-center'>Upcoming Sundays:</span>}
            {suggestions.map((d) => (
              <button
                key={d}
                type='button'
                aria-pressed={serviceDate === d}
                onClick={() => chooseDate(d)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  serviceDate === d ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-primary hover:bg-primary/5'
                }`}
              >
                {new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <fieldset className='bg-white rounded-2xl shadow-sm p-6'>
        <legend className='sr-only'>In memory of</legend>
        <h2 className='font-secondary font-bold text-xl text-primary' aria-hidden>
          In memory of
        </h2>
        <p className='text-sm text-gray-600 mt-1'>The names will be read aloud during the service. Please spell them as they should be read.</p>
        {err('names') && <p className='text-xs text-error mt-2'>{err('names')}</p>}
        <div className='mt-4 space-y-5'>
          {names.map((row, i) => (
            <div key={i} className={`grid gap-3 sm:grid-cols-6 ${i ? 'pt-5 border-t border-gray-100' : ''}`}>
              <div className='sm:col-span-3'>
                <Label htmlFor={fieldId(`names.${i}.name`)} required>
                  Name of the departed{names.length > 1 ? ` (${i + 1})` : ''}
                </Label>
                <Input id={fieldId(`names.${i}.name`)} value={row.name} error={err(`names.${i}.name`)} onChange={(v) => setRow(i, 'name', v)} />
              </div>
              <div className='sm:col-span-3'>
                <Label htmlFor={fieldId(`names.${i}.relationship`)} required>
                  Relationship to you
                </Label>
                <Input
                  id={fieldId(`names.${i}.relationship`)}
                  value={row.relationship}
                  placeholder='e.g. Mother'
                  error={err(`names.${i}.relationship`)}
                  onChange={(v) => setRow(i, 'relationship', v)}
                />
              </div>
              <div className='sm:col-span-4'>
                <Label htmlFor={fieldId(`names.${i}.occasion`)} required>
                  Occasion
                </Label>
                <select
                  id={fieldId(`names.${i}.occasion`)}
                  value={row.occasion}
                  aria-invalid={!!err(`names.${i}.occasion`)}
                  onChange={(e) => setRow(i, 'occasion', e.target.value)}
                  className={inputClass + (err(`names.${i}.occasion`) ? ' !border-error' : '')}
                >
                  <option value=''>Choose…</option>
                  {OCCASIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {err(`names.${i}.occasion`) && <p className='text-xs text-error mt-1'>{err(`names.${i}.occasion`)}</p>}
              </div>
              {names.length > 1 && (
                <div className='sm:col-span-2 flex sm:items-end'>
                  <button
                    type='button'
                    onClick={() => {
                      setNames((rows) => rows.filter((_, k) => k !== i));
                      setErrors({});
                    }}
                    className='text-sm text-gray-600 underline hover:text-error sm:mb-3'
                  >
                    Remove this name
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {names.length < MAX_NAMES && (
          <button
            type='button'
            onClick={() => setNames((rows) => [...rows, emptyRemembrance()])}
            className='mt-5 text-secondary font-semibold hover:underline'
          >
            + Add another name
          </button>
        )}
      </fieldset>

      <fieldset className='bg-white rounded-2xl shadow-sm p-6'>
        <legend className='sr-only'>Your contact information</legend>
        <h2 className='font-secondary font-bold text-xl text-primary' aria-hidden>
          Your contact information
        </h2>
        <p className='text-sm text-gray-600 mt-1'>
          We use this to contact you about the service and to keep the parish mailing list up to date.
        </p>
        <div className='grid gap-4 sm:grid-cols-6 mt-4'>
          <ContactField k='name' label='Your name' width='sm:col-span-6' autoComplete='name' contact={contact} err={err} set={setField} />
          <ContactField k='phone' label='Phone' width='sm:col-span-3' type='tel' autoComplete='tel' contact={contact} err={err} set={setField} />
          <ContactField k='email' label='Email' width='sm:col-span-3' type='email' autoComplete='email' contact={contact} err={err} set={setField} />
          <ContactField k='address' label='Street address' width='sm:col-span-6' autoComplete='street-address' contact={contact} err={err} set={setField} />
          <ContactField k='city' label='City' width='sm:col-span-3' autoComplete='address-level2' contact={contact} err={err} set={setField} />
          <ContactField k='state' label='State' width='sm:col-span-1' autoComplete='address-level1' contact={contact} err={err} set={setField} />
          <ContactField k='zip' label='ZIP' width='sm:col-span-2' autoComplete='postal-code' inputMode='numeric' contact={contact} err={err} set={setField} />
        </div>
        <label className='flex items-start gap-3 mt-5 text-gray-700'>
          <input type='checkbox' checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className='mt-1 h-4 w-4 accent-secondary' />
          <span>Send me St. Mary&apos;s email newsletter with parish news and events.</span>
        </label>
      </fieldset>

      <fieldset className='bg-white rounded-2xl shadow-sm p-6'>
        <legend className='sr-only'>Others requesting the same service</legend>
        <h2 className='font-secondary font-bold text-xl text-primary' aria-hidden>
          Others requesting the same service <span className='text-gray-400 text-base font-normal'>(optional)</span>
        </h2>
        <p className='text-sm text-gray-600 mt-1'>Other family members or friends joining in this request.</p>
        <textarea
          id={fieldId('others')}
          aria-label='Others requesting the same service'
          rows={3}
          maxLength={1000}
          value={others}
          onChange={(e) => setOthers(e.target.value)}
          className={`${inputClass} mt-4`}
        />
      </fieldset>

      {/* Honeypot: hidden from people and screen readers. */}
      <div aria-hidden className='absolute -left-[9999px] w-px h-px overflow-hidden'>
        <label>
          Website
          <input tabIndex={-1} autoComplete='off' value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name='website' />
        </label>
      </div>

      <div className='bg-white rounded-2xl shadow-sm p-6 space-y-4'>
        <p className='text-sm text-gray-600'>Your request goes to Hayr Eremia and the parish office. We&apos;ll email you a receipt.</p>
        {SITE_KEY && <div ref={turnstile.ref} />}
        {formError && (
          <p role='alert' className='text-error text-sm'>
            {formError}
          </p>
        )}
        <button
          type='submit'
          disabled={state === 'sending'}
          className='w-full sm:w-auto bg-secondary text-white rounded-xl px-8 py-3 font-semibold disabled:opacity-50'
        >
          {state === 'sending' ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </form>
  );
}

function Label({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className='block text-sm font-semibold text-gray-700 mb-1'>
      {children}
      {required && <span className='text-secondary ml-0.5'>*</span>}
    </label>
  );
}

function Input({
  id,
  value,
  error,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
}: {
  id: string;
  value: string;
  error?: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'numeric' | 'tel' | 'email';
}) {
  return (
    <>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode ?? (type === 'tel' ? 'tel' : undefined)}
        maxLength={200}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass + (error ? ' !border-error' : '')}
      />
      {error && (
        <p id={`${id}-err`} className='text-xs text-error mt-1'>
          {error}
        </p>
      )}
    </>
  );
}

function ContactField({
  k,
  label,
  width,
  type,
  autoComplete,
  inputMode,
  contact,
  err,
  set,
}: {
  k: keyof Contact;
  label: string;
  width: string;
  type?: string;
  autoComplete?: string;
  inputMode?: 'numeric';
  contact: Contact;
  err: (key: string) => string | undefined;
  set: (key: keyof Contact, value: string) => void;
}) {
  return (
    <div className={`col-span-1 ${width}`}>
      <Label htmlFor={fieldId(k)} required>
        {label}
      </Label>
      <Input id={fieldId(k)} type={type} autoComplete={autoComplete} inputMode={inputMode} value={contact[k]} error={err(k)} onChange={(v) => set(k, v)} />
    </div>
  );
}
