import React, { useEffect, useRef, useState } from 'react';
import { INTAKE_FORMS, cleanIntake, type IntakeField } from '@/certificates/intake';
import type { CertificateType } from '@/certificates/types';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
    __stmTurnstileReady?: () => void;
  }
}

const inputClass =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent';

const WIDTH: Record<string, string> = {
  full: 'sm:col-span-6',
  half: 'sm:col-span-3',
  third: 'sm:col-span-2',
};

export default function IntakeForm({ type }: { type: CertificateType }) {
  const [data, setData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [formError, setFormError] = useState('');
  const turnstile = useTurnstile();
  const topRef = useRef<HTMLDivElement>(null);

  function set(key: string, value: string) {
    setData((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function focusFirstError(errs: Record<string, string>) {
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) document.getElementById(`f-${first}`)?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const check = cleanIntake(type, data);
    if (Object.keys(check.errors).length) {
      setErrors(check.errors);
      setFormError('Please fix the highlighted fields.');
      focusFirstError(check.errors);
      return;
    }
    if (SITE_KEY && !turnstile.token) {
      setFormError('Please complete the “verify you are human” check below.');
      return;
    }
    setState('sending');
    try {
      const res = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, website: honeypot, turnstileToken: turnstile.token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.errors ?? {});
        setFormError(body.error ?? 'Something went wrong. Please try again.');
        turnstile.reset();
        setState('idle');
        if (body.errors) focusFirstError(body.errors);
        return;
      }
      setState('done');
      // The thank-you panel replaces the form; bring it into view once rendered.
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        topRef.current?.focus({ preventScroll: true });
      }, 0);
    } catch {
      setFormError('Could not reach the server. Check your connection and try again.');
      turnstile.reset();
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div ref={topRef} tabIndex={-1} className='bg-white rounded-2xl shadow-sm p-8 text-center space-y-3 outline-none'>
        <h2 className='font-secondary font-bold text-2xl text-primary'>Thank you</h2>
        <p className='text-gray-700'>
          Your information was sent to Father Eremia and the parish office. We also emailed you a receipt.
        </p>
        <p className='text-gray-700'>If anything changes, reply to that email or call the office at 949.650.8367.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className='space-y-6'>
      {INTAKE_FORMS[type].map((section) => (
        <fieldset key={section.title} className='bg-white rounded-2xl shadow-sm p-6'>
          <legend className='sr-only'>{section.title}</legend>
          <h2 className='font-secondary font-bold text-xl text-primary' aria-hidden>
            {section.title}
          </h2>
          {section.description && <p className='text-sm text-gray-600 mt-1'>{section.description}</p>}
          <div className='grid gap-4 sm:grid-cols-6 mt-4'>
            {section.fields.map((f) => (
              <Field key={f.key} field={f} data={data} errors={errors} set={set} />
            ))}
          </div>
        </fieldset>
      ))}

      {/* Honeypot: hidden from people and screen readers. */}
      <div aria-hidden className='absolute -left-[9999px] w-px h-px overflow-hidden'>
        <label>
          Website
          <input tabIndex={-1} autoComplete='off' value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name='website' />
        </label>
      </div>

      <div className='bg-white rounded-2xl shadow-sm p-6 space-y-4'>
        <p className='text-sm text-gray-600'>
          Your information goes only to Father Eremia and the parish office. It is kept with the church’s sacramental
          records and used to prepare the certificate.
        </p>
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
          {state === 'sending' ? 'Sending…' : 'Submit information'}
        </button>
      </div>
    </form>
  );
}

function Field({
  field: f,
  data,
  errors,
  set,
}: {
  field: IntakeField;
  data: Record<string, string>;
  errors: Record<string, string>;
  set: (key: string, value: string) => void;
}) {
  const id = `f-${f.key}`;
  const err = errors[f.key];
  const cls = inputClass + (err ? ' !border-error' : '');
  const common = {
    id,
    value: data[f.key] ?? '',
    'aria-invalid': !!err,
    'aria-describedby': err ? `${id}-err` : f.help ? `${id}-help` : undefined,
    autoComplete: f.autoComplete,
  };
  let control: React.ReactNode;
  if (f.kind === 'select') {
    control = (
      <select {...common} className={cls} onChange={(e) => set(f.key, e.target.value)}>
        <option value=''>Choose…</option>
        {f.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else if (f.kind === 'textarea') {
    control = <textarea {...common} rows={4} maxLength={2000} className={cls} onChange={(e) => set(f.key, e.target.value)} />;
  } else {
    control = (
      <input
        {...common}
        type={f.kind}
        inputMode={f.kind === 'tel' ? 'tel' : undefined}
        placeholder={f.placeholder}
        maxLength={200}
        className={cls}
        onChange={(e) => set(f.key, e.target.value)}
      />
    );
  }
  const hyKey = `${f.key}_hy`;
  return (
    <div className={`col-span-1 ${WIDTH[f.width ?? 'full']}`}>
      <label htmlFor={id} className='block text-sm font-semibold text-gray-700 mb-1'>
        {f.label}
        {f.required && <span className='text-secondary ml-0.5'>*</span>}
      </label>
      {control}
      {err && (
        <p id={`${id}-err`} className='text-xs text-error mt-1'>
          {err}
        </p>
      )}
      {!err && f.help && (
        <p id={`${id}-help`} className='text-xs text-gray-500 mt-1'>
          {f.help}
        </p>
      )}
      {f.armenian && (
        <div className='mt-2'>
          <label htmlFor={`f-${hyKey}`} className='block text-xs text-gray-600 mb-1'>
            Armenian spelling, if known <span className='text-gray-400'>(optional)</span>
          </label>
          <input
            id={`f-${hyKey}`}
            lang='hy'
            value={data[hyKey] ?? ''}
            maxLength={200}
            className={inputClass + (errors[hyKey] ? ' !border-error' : '')}
            onChange={(e) => set(hyKey, e.target.value)}
          />
          {errors[hyKey] && <p className='text-xs text-error mt-1'>{errors[hyKey]}</p>}
        </div>
      )}
    </div>
  );
}

/** Loads Cloudflare Turnstile when a site key is configured. */
function useTurnstile() {
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string>();
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!SITE_KEY) return;
    const render = () => {
      if (!ref.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    };
    if (window.turnstile) return render();
    window.__stmTurnstileReady = render;
    if (!document.getElementById('cf-turnstile')) {
      const s = document.createElement('script');
      s.id = 'cf-turnstile';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__stmTurnstileReady';
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  return {
    ref,
    token,
    reset: () => {
      setToken('');
      if (widget.current) window.turnstile?.reset(widget.current);
    },
  };
}
