import AppLayout from '@/components/layout/AppLayout';
import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { verifyToken } from '@/lib/magicLink';
import { getRecord, ParishionerRecord } from '@/lib/sheets';
import { useRouter } from 'next/router';
import type { VerifiedAddress } from '../api/verify-address';

interface Props {
  record: ParishionerRecord;
  token: string;
}

// ─── Phone helpers ────────────────────────────────────────────────────────────

function stripPhone(value: string): string {
  return value.replace(/\D/g, '');
}

function formatPhone(digits: string): string {
  const d = stripPhone(digits);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

// ─── US address check ─────────────────────────────────────────────────────────

function isUS(country: string): boolean {
  const c = country.trim().toLowerCase().replace(/[\s.]/g, '');
  return !c || c === 'us' || c === 'usa' || c.startsWith('unitedstate') || c === 'america';
}

function addressesMatch(a: VerifiedAddress, b: typeof emptyForm): boolean {
  return (
    a.Address_Line_1.toLowerCase() === b.Address_Line_1.toLowerCase().trim() &&
    a.Address_Line_2.toLowerCase() === b.Address_Line_2.toLowerCase().trim() &&
    a.City.toLowerCase() === b.City.toLowerCase().trim() &&
    a.State.toLowerCase() === b.State.toLowerCase().trim() &&
    a.ZIP === b.ZIP.trim()
  );
}

const emptyForm = {
  First_Name: '', Middle_Name: '', Last_Name: '', Preferred_Name: '',
  Email: '', Phone: '',
  Address_Line_1: '', Address_Line_2: '', City: '', State: '', ZIP: '', Country: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, name, value, onChange, onBlur, type = 'text', required = false, hint,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className='block text-sm font-semibold text-gray-700 mb-1' htmlFor={name}>
        {label}{required && <span className='text-secondary ml-0.5'>*</span>}
      </label>
      <input
        id={name} name={name} type={type} value={value}
        onChange={onChange} onBlur={onBlur} required={required}
        className='w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent'
      />
      {hint && <p className='text-xs text-gray-400 mt-1'>{hint}</p>}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-sm font-semibold text-gray-500 mb-1'>{label}</p>
      <p className='px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700'>{value || '—'}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SubmitStage = 'idle' | 'verifying-address' | 'address-suggestion' | 'address-unverified' | 'submitting';

export default function UpdateFormPage({ record, token }: Props) {
  const router = useRouter();

  const [form, setForm] = useState({
    First_Name: record.First_Name,
    Middle_Name: record.Middle_Name,
    Last_Name: record.Last_Name,
    Preferred_Name: record.Preferred_Name,
    Email: record.Email,
    Phone: formatPhone(record.Phone), // display as (xxx) xxx-xxxx
    Address_Line_1: record.Address_Line_1,
    Address_Line_2: record.Address_Line_2,
    City: record.City,
    State: record.State,
    ZIP: record.ZIP,
    Country: record.Country,
  });

  const [phoneError, setPhoneError] = useState('');
  const [stage, setStage] = useState<SubmitStage>('idle');
  const [suggestion, setSuggestion] = useState<VerifiedAddress | null>(null);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'Phone') setPhoneError('');
    // Reset address verification if address fields change
    if (['Address_Line_1', 'Address_Line_2', 'City', 'State', 'ZIP'].includes(name)) {
      if (stage === 'address-suggestion' || stage === 'address-unverified') {
        setStage('idle');
        setSuggestion(null);
      }
    }
  }

  function handlePhoneBlur(e: React.FocusEvent<HTMLInputElement>) {
    const digits = stripPhone(e.target.value);
    setForm((prev) => ({ ...prev, Phone: formatPhone(digits) }));
  }

  function validatePhone(): boolean {
    const digits = stripPhone(form.Phone);
    if (form.Phone && digits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit US phone number, e.g. (714) 231-8662');
      return false;
    }
    return true;
  }

  async function doUpdate(overrideAddress?: VerifiedAddress) {
    setStage('submitting');
    setError('');

    const payload = {
      ...form,
      Phone: stripPhone(form.Phone), // always store digits only
      ...(overrideAddress ?? {}),
    };

    try {
      const res = await fetch('/api/update-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, data: payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push('/update-my-info?error=expired'); return; }
        setError(json.error ?? 'Update failed. Please try again.');
        setStage('idle');
        return;
      }
      router.push('/update-my-info/success');
    } catch {
      setError('Something went wrong. Please try again.');
      setStage('idle');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!validatePhone()) return;

    // Skip address verification if not a US address or address fields are empty
    const hasAddress = form.Address_Line_1.trim() && form.City.trim() && form.State.trim();
    if (!hasAddress || !isUS(form.Country)) {
      await doUpdate();
      return;
    }

    setStage('verifying-address');

    try {
      const res = await fetch('/api/verify-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street: form.Address_Line_1,
          street2: form.Address_Line_2,
          city: form.City,
          state: form.State,
          zip: form.ZIP,
        }),
      });
      const json = await res.json();

      if (json.verified) {
        if (!addressesMatch(json.address, form)) {
          // USPS returned a corrected address — show both for user to choose
          setSuggestion(json.address);
          setStage('address-suggestion');
          return;
        }
        // Address confirmed as-is — still save USPS version to capture ZIP+4
        await doUpdate(json.address);
        return;
      }

      if (!json.verified && !json.serviceError) {
        // Address genuinely couldn't be verified — ask how to proceed
        setStage('address-unverified');
        return;
      }

      // Service unavailable — proceed with user's input
      await doUpdate();
    } catch {
      // If our own API fails, don't block the user
      await doUpdate();
    }
  }

  function applySuggestion() {
    if (!suggestion) return;
    setForm((prev) => ({ ...prev, ...suggestion }));
    doUpdate(suggestion);
  }

  const isSubmitting = stage === 'submitting';
  const isVerifying = stage === 'verifying-address';
  const showSuggestion = stage === 'address-suggestion';
  const showUnverified = stage === 'address-unverified';

  return (
    <AppLayout>
      <header className='worship-header-bg px-primary h-[205px] md:h-[265px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Parish Records</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Update My Information
        </h1>
      </header>

      <section className='px-primary py-12 bg-white'>
        <div className='max-w-2xl mx-auto'>
          <p className='text-gray-500 text-sm mb-8'>
            Review and update your information below. Fields marked{' '}
            <span className='text-secondary font-semibold'>*</span> are required.
          </p>

          <form onSubmit={handleSubmit} className='space-y-10'>

            {/* Personal */}
            <div className='bg-[#FFF5F2] rounded-2xl p-6 space-y-4'>
              <h2 className='font-secondary font-bold text-primary text-lg'>Personal Information</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <Field label='First Name' name='First_Name' value={form.First_Name} onChange={handleChange} required />
                <Field label='Middle Name' name='Middle_Name' value={form.Middle_Name} onChange={handleChange} />
                <Field label='Last Name' name='Last_Name' value={form.Last_Name} onChange={handleChange} required />
                <Field label='Preferred Name' name='Preferred_Name' value={form.Preferred_Name} onChange={handleChange} />
              </div>
            </div>

            {/* Contact */}
            <div className='bg-[#FFF5F2] rounded-2xl p-6 space-y-4'>
              <h2 className='font-secondary font-bold text-primary text-lg'>Contact Information</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <Field label='Email' name='Email' type='email' value={form.Email} onChange={handleChange} required />
                <div>
                  <Field
                    label='Phone'
                    name='Phone'
                    type='tel'
                    value={form.Phone}
                    onChange={handleChange}
                    onBlur={handlePhoneBlur}
                    hint='US numbers only — 10 digits'
                  />
                  {phoneError && <p className='text-red-500 text-xs mt-1'>{phoneError}</p>}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className='bg-[#FFF5F2] rounded-2xl p-6 space-y-4'>
              <h2 className='font-secondary font-bold text-primary text-lg'>Address</h2>
              <Field label='Address Line 1' name='Address_Line_1' value={form.Address_Line_1} onChange={handleChange} />
              <Field label='Address Line 2' name='Address_Line_2' value={form.Address_Line_2} onChange={handleChange} />
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                <div className='col-span-2'>
                  <Field label='City' name='City' value={form.City} onChange={handleChange} />
                </div>
                <Field label='State' name='State' value={form.State} onChange={handleChange} />
                <Field label='ZIP' name='ZIP' value={form.ZIP} onChange={handleChange} hint='ZIP+4 auto-filled' />
              </div>
              <Field label='Country' name='Country' value={form.Country} onChange={handleChange} />

              {/* Address suggestion */}
              {showSuggestion && suggestion && (
                <div className='mt-2 border border-secondary rounded-xl overflow-hidden'>
                  <div className='bg-secondary text-white px-5 py-3'>
                    <p className='font-secondary font-bold text-sm'>We found a standardized version of your address</p>
                  </div>
                  <div className='bg-white grid grid-cols-2 divide-x divide-gray-100'>
                    <div className='p-4'>
                      <p className='text-xs font-bold text-gray-400 uppercase tracking-wide mb-2'>You entered</p>
                      <p className='text-sm text-gray-600 leading-relaxed'>
                        {form.Address_Line_1}<br />
                        {form.Address_Line_2 && <>{form.Address_Line_2}<br /></>}
                        {form.City}, {form.State} {form.ZIP}
                      </p>
                    </div>
                    <div className='p-4'>
                      <p className='text-xs font-bold text-secondary uppercase tracking-wide mb-2'>Suggested</p>
                      <p className='text-sm text-gray-800 leading-relaxed font-medium'>
                        {suggestion.Address_Line_1}<br />
                        {suggestion.Address_Line_2 && <>{suggestion.Address_Line_2}<br /></>}
                        {suggestion.City}, {suggestion.State} {suggestion.ZIP}
                      </p>
                    </div>
                  </div>
                  <div className='bg-gray-50 px-5 py-3 flex gap-3 flex-wrap'>
                    <button
                      type='button'
                      onClick={applySuggestion}
                      disabled={isSubmitting}
                      className='bg-secondary text-white font-secondary font-bold text-sm px-5 py-2 rounded-xl hover:brightness-90 transition disabled:opacity-60'
                    >
                      Use Suggested Address
                    </button>
                    <button
                      type='button'
                      onClick={() => doUpdate()}
                      disabled={isSubmitting}
                      className='text-gray-600 text-sm px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition disabled:opacity-60'
                    >
                      Keep What I Entered
                    </button>
                  </div>
                </div>
              )}

              {/* Unverified address warning */}
              {showUnverified && (
                <div className='mt-2 bg-amber-50 border border-amber-300 rounded-xl p-5'>
                  <p className='font-secondary font-bold text-amber-800 text-sm mb-1'>Address could not be verified</p>
                  <p className='text-amber-700 text-sm mb-4'>
                    We weren&apos;t able to confirm this address with the USPS database. Please double-check it,
                    or submit as entered if you&apos;re confident it&apos;s correct.
                  </p>
                  <div className='flex gap-3 flex-wrap'>
                    <button
                      type='button'
                      onClick={() => doUpdate()}
                      disabled={isSubmitting}
                      className='bg-amber-600 text-white font-secondary font-bold text-sm px-5 py-2 rounded-xl hover:brightness-90 transition disabled:opacity-60'
                    >
                      Submit Anyway
                    </button>
                    <button
                      type='button'
                      onClick={() => setStage('idle')}
                      className='text-amber-800 text-sm px-4 py-2 rounded-xl border border-amber-400 hover:bg-amber-100 transition'
                    >
                      Go Back &amp; Edit
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Membership — read only */}
            <div className='bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-200'>
              <h2 className='font-secondary font-bold text-gray-500 text-lg'>Membership Status</h2>
              <p className='text-xs text-gray-400'>Managed by the parish office — not editable here.</p>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <ReadOnlyField label='Dues Status' value={record.Dues_Status} />
                <ReadOnlyField label='Last Verified' value={record.Last_Verified} />
              </div>
            </div>

            {error && (
              <p className='text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3'>{error}</p>
            )}

            {/* Only show the main submit button when not in a confirmation state */}
            {!showSuggestion && !showUnverified && (
              <button
                type='submit'
                disabled={isSubmitting || isVerifying}
                className='w-full bg-secondary text-white font-secondary font-bold py-3 rounded-xl hover:brightness-90 transition disabled:opacity-60'
              >
                {isVerifying ? 'Verifying address…' : isSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
            )}

          </form>
        </div>
      </section>
    </AppLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = (ctx.query.token as string) ?? '';
  if (!token) return { redirect: { destination: '/update-my-info', permanent: false } };

  try {
    const payload = verifyToken(token);
    const record = await getRecord(payload.rowIndex);

    if (!record || record.Email.toLowerCase().trim() !== payload.email.toLowerCase().trim()) {
      return { redirect: { destination: '/update-my-info?error=expired', permanent: false } };
    }

    return { props: { record, token } };
  } catch {
    return { redirect: { destination: '/update-my-info?error=expired', permanent: false } };
  }
};
