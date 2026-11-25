import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TURNSTILE_SITE_KEY as SITE_KEY, useTurnstile } from '@/components/forms/useTurnstile';
import {
  GIVE_ONLINE_URL,
  MAX_NAMES,
  OCCASIONS,
  OFFERINGS,
  SAME_DAY_CUTOFF_LABEL,
  cleanRequiem,
  emptyRemembrance,
  isMerelots,
  nextServiceDays,
  ordinal,
  parishToday,
  serviceDateLabel,
  serviceDateProblem,
  type Offering,
  type RemembranceInput,
} from '@/lib/requiem/rules';

const inputClass =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent';

type Contact = { name: string; address: string; city: string; state: string; zip: string; phone: string; email: string };

/** Field ids are `f-` plus the error key with dots as dashes (names.0.name → f-names-0-name). */
const fieldId = (key: string) => `f-${key.replace(/\./g, '-')}`;

/** "Nov 29", "Today", or "Mon, Mar 29 · Merelots" for the date chips. */
function chipLabel(d: string, today: string): string {
  if (d === today) return 'Today';
  const date = new Date(`${d}T12:00:00Z`);
  const short = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return isMerelots(d) ? `${date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}, ${short} · Merelots` : short;
}

/**
 * The Hokihankist request form. `public` (the website, /requiem/request): with the office's
 * same-day link (?sameday=…), today may also be chosen until 1:00 pm. `office`: the parish office
 * typing in a paper form (today allowed, phone or email enough, no human check).
 */
export default function RequiemForm({ mode = 'public' }: { mode?: 'public' | 'office' }) {
  const office = mode === 'office';
  const blankContact: Contact = { name: '', address: '', city: '', state: 'CA', zip: '', phone: '', email: '' };
  const [serviceDate, setServiceDate] = useState('');
  const [names, setNames] = useState<RemembranceInput[]>([emptyRemembrance()]);
  const [contact, setContact] = useState<Contact>(blankContact);
  const [others, setOthers] = useState('');
  // Online: ticked to start with (the parish's choice); people can untick it. Paper: as written on the form.
  const [newsletter, setNewsletter] = useState(!office);
  const [hokijash, setHokijash] = useState(false);
  const [fellowship, setFellowship] = useState(false);
  const [arrangements, setArrangements] = useState('');
  const [offering, setOffering] = useState<Offering>('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const turnstile = useTurnstile();
  const topRef = useRef<HTMLDivElement>(null);
  // The page is built ahead of time, so today's date is worked out in the browser.
  const [today, setToday] = useState('');
  useEffect(() => setToday(parishToday()), []);
  // The office's same-day link: the server says whether it's valid and whether today is open now.
  const [sameDay, setSameDay] = useState<{ token: string; today: string | null } | null>(null);
  useEffect(() => {
    if (office) return;
    const token = new URLSearchParams(window.location.search).get('sameday');
    if (!token) return;
    fetch(`/api/forms/requiem-same-day?t=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((b) => b.valid && setSameDay({ token, today: b.today ?? null }))
      .catch(() => {});
  }, [office]);
  const todayAllowed = office ? !!today && !serviceDateProblem(today, today, { office: true }) : !!sameDay?.today;
  const todayDate = office ? today : sameDay?.today ?? '';
  const dateRules = { office, sameDay: !office && !!sameDay?.today };
  const suggestions = useMemo(
    () => (today ? [...(todayAllowed ? [todayDate] : []), ...nextServiceDays(todayAllowed ? 2 : 3, today)] : []),
    [today, todayAllowed, todayDate],
  );

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
    return { serviceDate, ...contact, others, names, newsletter, hokijash, fellowship, arrangements, offering };
  }

  function showErrors(errs: Record<string, string>, message: string) {
    setErrors(errs);
    setFormError(message);
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) document.getElementById(fieldId(first))?.focus();
  }

  const [receiptSent, setReceiptSent] = useState(false);
  // Whether the server counted it as a same-day request (its clock decides, not the device's).
  const [sentSameDay, setSentSameDay] = useState(false);

  function startOver() {
    setServiceDate('');
    setNames([emptyRemembrance()]);
    setContact(blankContact);
    setOthers('');
    setNewsletter(!office);
    setHokijash(false);
    setFellowship(false);
    setArrangements('');
    setOffering('');
    setErrors({});
    setFormError('');
    setState('idle');
    window.scrollTo({ top: 0 });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const check = cleanRequiem(payload(), today || parishToday(), dateRules);
    if (Object.keys(check.errors).length) return showErrors(check.errors, 'Please fix the highlighted fields.');
    if (!office && SITE_KEY && !turnstile.token) return setFormError('Please complete the “verify you are human” check below.');
    setState('sending');
    try {
      const res = await fetch(office ? '/api/office/requiem' : '/api/forms/requiem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          office ? { data: payload() } : { data: payload(), website: honeypot, turnstileToken: turnstile.token, sameDay: sameDay?.token },
        ),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!office) turnstile.reset();
        setState('idle');
        return showErrors(body.errors ?? {}, body.error ?? 'Something went wrong. Please try again.');
      }
      setReceiptSent(!!body.receipt);
      setSentSameDay(!!body.sameDay);
      setState('done');
      setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        topRef.current?.focus({ preventScroll: true });
      }, 0);
    } catch {
      if (!office) turnstile.reset();
      setState('idle');
      setFormError('Could not reach the server. Check your connection and try again.');
    }
  }

  if (state === 'done' && office) {
    return (
      <div ref={topRef} tabIndex={-1} className='bg-white rounded-2xl shadow-sm p-8 space-y-3 outline-none'>
        <h2 className='font-secondary font-bold text-2xl text-primary'>Saved</h2>
        <p className='text-gray-700'>
          The paper request for <strong>{serviceDateLabel(serviceDate)}</strong> is in the list and was emailed to Hayr
          Eremia and the office.{' '}
          {receiptSent ? `A receipt went to ${contact.email}.` : contact.email ? 'The receipt to the family could not be sent.' : 'No receipt was sent (no email address).'}
        </p>
        {sentSameDay && (
          <p className='text-amber-800 bg-amber-50 rounded-lg px-3 py-2'>This is for today. Please make sure Hayr Eremia knows before the service ends.</p>
        )}
        <p className='text-gray-700'>Tick “Entered on the website” on the paper form.</p>
        <div className='flex flex-wrap gap-3 pt-2'>
          <button type='button' onClick={startOver} className='bg-secondary text-white rounded-xl px-6 py-3 font-semibold'>
            Add another paper request
          </button>
          <a href='/office/requiem' className='border border-primary text-primary rounded-xl px-6 py-3 font-semibold'>
            Back to the list
          </a>
        </div>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div ref={topRef} tabIndex={-1} className='bg-white rounded-2xl shadow-sm p-8 text-center space-y-3 outline-none'>
        <h2 className='font-secondary font-bold text-2xl text-primary'>Thank you</h2>
        <p className='text-gray-700'>
          Your request for a Hokihankist on <strong>{serviceDateLabel(serviceDate)}</strong> was sent to Hayr Eremia and
          the parish office. We also emailed you a receipt.
        </p>
        {sentSameDay && (
          <p className='text-gray-700'>Because it&apos;s for today, please also let someone in the parish office know you sent it.</p>
        )}
        {(hokijash || fellowship) && (
          <p className='text-gray-700'>
            Someone from the church will contact you to arrange{' '}
            {[hokijash && 'the Hokijash', fellowship && 'the fellowship hour'].filter(Boolean).join(' and ')}.
          </p>
        )}
        {offering === 'online' && (
          <div className='bg-[#FFF5F2] rounded-xl p-5 my-2 space-y-3'>
            <p className='text-gray-700'>Thank you for remembering your loved ones with a memorial offering.</p>
            <a
              href={GIVE_ONLINE_URL}
              target='_blank'
              rel='noreferrer'
              className='inline-block bg-secondary text-white rounded-xl px-8 py-3 font-semibold hover:brightness-90'
            >
              Give online ↗
            </a>
            <p className='text-xs text-gray-500'>Opens our secure giving page in a new tab.</p>
          </div>
        )}
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
        <p className='text-sm text-gray-600 mt-1'>Choose the Sunday you would like, or tap one of the upcoming dates.</p>
        {!office && sameDay && (
          <p className='mt-3 rounded-lg bg-amber-50 text-amber-900 px-3 py-2 text-sm' data-testid='same-day-note'>
            {sameDay.today
              ? `You can also choose today, ${serviceDateLabel(sameDay.today)}. Same-day requests can be made until ${SAME_DAY_CUTOFF_LABEL}.`
              : `Same-day requests can be made on Sundays and Merelots days until ${SAME_DAY_CUTOFF_LABEL}. Please choose an upcoming date, or ask in the parish office.`}
          </p>
        )}
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
              {serviceDate ? serviceDateLabel(serviceDate) : 'A Sunday or Merelots day. Not offered on the five major feast days.'}
            </p>
          )}
          {serviceDate && serviceDate === today && !err('serviceDate') && (
            <p className='mt-2 rounded-lg bg-amber-50 text-amber-900 px-3 py-2 text-sm'>
              {office
                ? 'This is for today. Please make sure Hayr Eremia knows before the service ends.'
                : 'This is for today. After sending it, please also let someone in the parish office know.'}
            </p>
          )}
          <div className='flex flex-wrap gap-2 mt-3 min-h-[2.25rem]' role='group' aria-label='Upcoming dates'>
            {suggestions.length > 0 && <span className='text-sm text-gray-600 self-center'>Upcoming:</span>}
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
                {chipLabel(d, today)}
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
              <div className='sm:col-span-3'>
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
              {row.occasion === 'darelits' && (
                <div className='sm:col-span-3'>
                  <Label htmlFor={fieldId(`names.${i}.anniversary`)} required>
                    Which anniversary of their passing?
                  </Label>
                  <div className='flex items-center gap-3'>
                    <input
                      id={fieldId(`names.${i}.anniversary`)}
                      type='number'
                      inputMode='numeric'
                      min={1}
                      max={150}
                      value={row.anniversary}
                      placeholder='1'
                      aria-invalid={!!err(`names.${i}.anniversary`)}
                      onChange={(e) => setRow(i, 'anniversary', e.target.value)}
                      className={`${inputClass} !w-24${err(`names.${i}.anniversary`) ? ' !border-error' : ''}`}
                    />
                    <span className='text-gray-600'>
                      {/^\d+$/.test(row.anniversary) && Number(row.anniversary) > 0 ? `${ordinal(Number(row.anniversary))} anniversary` : 'anniversary'}
                    </span>
                  </div>
                  {err(`names.${i}.anniversary`) && <p className='text-xs text-error mt-1'>{err(`names.${i}.anniversary`)}</p>}
                </div>
              )}
              {row.occasion === 'other' && (
                <div className='sm:col-span-3'>
                  <Label htmlFor={fieldId(`names.${i}.details`)} required>
                    What is the occasion?
                  </Label>
                  <Input
                    id={fieldId(`names.${i}.details`)}
                    value={row.details}
                    placeholder='e.g. her birthday'
                    error={err(`names.${i}.details`)}
                    onChange={(v) => setRow(i, 'details', v)}
                  />
                </div>
              )}
              {names.length > 1 && (
                <div className='sm:col-span-6'>
                  <button
                    type='button'
                    onClick={() => {
                      setNames((rows) => rows.filter((_, k) => k !== i));
                      setErrors({});
                    }}
                    className='text-sm text-gray-600 underline hover:text-error'
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
        <legend className='sr-only'>Others requesting the same service</legend>
        <h2 className='font-secondary font-bold text-xl text-primary' aria-hidden>
          Others requesting the same service <Optional />
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

      <fieldset className='bg-white rounded-2xl shadow-sm p-6'>
        <legend className='sr-only'>Hokijash and fellowship hour</legend>
        <h2 className='font-secondary font-bold text-xl text-primary' aria-hidden>
          Hokijash and fellowship hour <Optional />
        </h2>
        <p className='text-sm text-gray-600 mt-1'>
          Families often honor a loved one with a Hokijash (memorial meal) or by sponsoring the fellowship hour (coffee
          hour) after the Divine Liturgy. Tick any you would like, and someone from the church will contact you to make
          the arrangements.
        </p>
        <div className='mt-4 space-y-3'>
          <Check id='f-hokijash' checked={hokijash} onChange={setHokijash}>
            I would like to arrange a <strong>Hokijash</strong> (memorial meal)
          </Check>
          <Check id='f-fellowship' checked={fellowship} onChange={setFellowship}>
            I would like to <strong>sponsor the fellowship hour</strong> after the service
          </Check>
        </div>
        {(hokijash || fellowship) && (
          <div className='mt-4'>
            <label htmlFor={fieldId('arrangements')} className='block text-sm font-semibold text-gray-700 mb-1'>
              Anything we should know? <span className='text-gray-400 font-normal'>(optional)</span>
            </label>
            <textarea
              id={fieldId('arrangements')}
              rows={3}
              maxLength={1000}
              value={arrangements}
              placeholder='e.g. about how many guests, or the best time to reach you'
              onChange={(e) => setArrangements(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </fieldset>

      <fieldset className='bg-white rounded-2xl shadow-sm p-6'>
        <legend className='sr-only'>A memorial offering</legend>
        <h2 className='font-secondary font-bold text-xl text-primary' aria-hidden>
          A memorial offering <Optional />
        </h2>
        <p className='text-sm text-gray-600 mt-1'>
          It is customary to make an offering to the Church in loving memory of the departed: an expression of
          stewardship and gratitude, not a payment for prayers. If you plan to, how would you like to give?
        </p>
        <div className='mt-4 space-y-3' role='radiogroup' aria-label='How would you like to give?'>
          {[
            ...(office ? [{ value: 'enclosed' as const, label: 'Enclosed with the paper form', help: '' }] : []),
            ...OFFERINGS.map((o) => (office ? { ...o, help: '' } : o)),
          ].map((o) => (
            <label key={o.value} className='flex items-start gap-3 text-gray-700 cursor-pointer'>
              <input
                type='radio'
                name='offering'
                value={o.value}
                checked={offering === o.value}
                onChange={() => setOffering(o.value)}
                className='mt-1 h-4 w-4 accent-secondary'
              />
              <span>
                {o.label}
                {o.help && <span className='block text-xs text-gray-500'>{o.help}</span>}
              </span>
            </label>
          ))}
          {offering && (
            <button type='button' onClick={() => setOffering('')} className='text-xs text-gray-500 underline'>
              Clear my choice
            </button>
          )}
        </div>
      </fieldset>

      <fieldset className='bg-white rounded-2xl shadow-sm p-6'>
        <legend className='sr-only'>{office ? 'Contact information' : 'Your contact information'}</legend>
        <h2 className='font-secondary font-bold text-xl text-primary' aria-hidden>
          {office ? 'Contact information' : 'Your contact information'}
        </h2>
        <p className='text-sm text-gray-600 mt-1'>
          {office
            ? 'As written on the paper form. A phone number or an email address is needed, so someone can reach the family.'
            : 'We use this to contact you about the service and to keep the parish mailing list up to date.'}
        </p>
        <div className='grid gap-4 sm:grid-cols-6 mt-4'>
          <ContactField k='name' label={office ? 'Name of the person requesting' : 'Your name'} width='sm:col-span-6' autoComplete='name' contact={contact} err={err} set={setField} />
          <ContactField k='phone' label='Phone' optional={office} width='sm:col-span-3' type='tel' autoComplete='tel' contact={contact} err={err} set={setField} />
          <ContactField k='email' label='Email' optional={office} width='sm:col-span-3' type='email' autoComplete='email' contact={contact} err={err} set={setField} />
          <ContactField k='address' label='Street address' optional={office} width='sm:col-span-6' autoComplete='street-address' contact={contact} err={err} set={setField} />
          <ContactField k='city' label='City' optional={office} width='sm:col-span-3' autoComplete='address-level2' contact={contact} err={err} set={setField} />
          <ContactField k='state' label='State' optional={office} width='sm:col-span-1' autoComplete='address-level1' contact={contact} err={err} set={setField} />
          <ContactField k='zip' label='ZIP' optional={office} width='sm:col-span-2' autoComplete='postal-code' inputMode='numeric' contact={contact} err={err} set={setField} />
        </div>
        <label className='flex items-start gap-3 mt-5 text-gray-700'>
          <input id='f-newsletter' type='checkbox' checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className='mt-1 h-4 w-4 accent-secondary' />
          <span>{office ? 'They ticked “Send me St. Mary’s email newsletter”.' : 'Send me St. Mary’s email newsletter with parish news and events.'}</span>
        </label>
      </fieldset>

      {!office && (
        // Honeypot: hidden from people and screen readers.
        <div aria-hidden className='absolute -left-[9999px] w-px h-px overflow-hidden'>
          <label>
            Website
            <input tabIndex={-1} autoComplete='off' value={honeypot} onChange={(e) => setHoneypot(e.target.value)} name='website' />
          </label>
        </div>
      )}

      <div className='bg-white rounded-2xl shadow-sm p-6 space-y-4'>
        <p className='text-sm text-gray-600'>
          {office
            ? 'Saving emails it to Hayr Eremia and the office, and sends the family a receipt if there’s an email address.'
            : 'Your request goes to Hayr Eremia and the parish office. We’ll email you a receipt.'}
        </p>
        {!office && SITE_KEY && <div ref={turnstile.ref} />}
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
          {state === 'sending' ? (office ? 'Saving…' : 'Sending…') : office ? 'Save paper request' : 'Send request'}
        </button>
      </div>
    </form>
  );
}

function Optional() {
  return <span className='text-gray-400 text-base font-normal'>(optional)</span>;
}

function Check({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className='flex items-start gap-3 text-gray-700 cursor-pointer'>
      <input id={id} type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} className='mt-1 h-4 w-4 accent-secondary' />
      <span>{children}</span>
    </label>
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
  optional,
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
  optional?: boolean;
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
      <Label htmlFor={fieldId(k)} required={!optional}>
        {label}
      </Label>
      <Input id={fieldId(k)} type={type} autoComplete={autoComplete} inputMode={inputMode} value={contact[k]} error={err(k)} onChange={(v) => set(k, v)} />
    </div>
  );
}
