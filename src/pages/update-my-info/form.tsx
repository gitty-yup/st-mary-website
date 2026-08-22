import AppLayout from '@/components/layout/AppLayout';
import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { verifyToken } from '@/lib/magicLink';
import { getRecord, ParishionerRecord } from '@/lib/sheets';
import { useRouter } from 'next/router';

interface Props {
  record: ParishionerRecord;
  token: string;
}

function Field({
  label, name, value, onChange, type = 'text', required = false,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className='block text-sm font-semibold text-gray-700 mb-1' htmlFor={name}>
        {label}{required && <span className='text-secondary ml-0.5'>*</span>}
      </label>
      <input
        id={name} name={name} type={type} value={value} onChange={onChange} required={required}
        className='w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent'
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-sm font-semibold text-gray-500 mb-1'>{label}</p>
      <p className='px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700'>
        {value || '—'}
      </p>
    </div>
  );
}

export default function UpdateFormPage({ record, token }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    First_Name: record.First_Name,
    Middle_Name: record.Middle_Name,
    Last_Name: record.Last_Name,
    Preferred_Name: record.Preferred_Name,
    Email: record.Email,
    Phone: record.Phone,
    Address_Line_1: record.Address_Line_1,
    Address_Line_2: record.Address_Line_2,
    City: record.City,
    State: record.State,
    ZIP: record.ZIP,
    Country: record.Country,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/update-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, data: form }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/update-my-info?error=expired');
          return;
        }
        setError(json.error ?? 'Update failed. Please try again.');
        return;
      }
      router.push('/update-my-info/success');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
            {/* Personal Information */}
            <div className='bg-[#FFF5F2] rounded-2xl p-6 space-y-4'>
              <h2 className='font-secondary font-bold text-primary text-lg'>Personal Information</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <Field label='First Name' name='First_Name' value={form.First_Name} onChange={handleChange} required />
                <Field label='Middle Name' name='Middle_Name' value={form.Middle_Name} onChange={handleChange} />
                <Field label='Last Name' name='Last_Name' value={form.Last_Name} onChange={handleChange} required />
                <Field label='Preferred Name' name='Preferred_Name' value={form.Preferred_Name} onChange={handleChange} />
              </div>
            </div>

            {/* Contact Information */}
            <div className='bg-[#FFF5F2] rounded-2xl p-6 space-y-4'>
              <h2 className='font-secondary font-bold text-primary text-lg'>Contact Information</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <Field label='Email' name='Email' type='email' value={form.Email} onChange={handleChange} required />
                <Field label='Phone' name='Phone' type='tel' value={form.Phone} onChange={handleChange} />
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
                <Field label='ZIP' name='ZIP' value={form.ZIP} onChange={handleChange} />
              </div>
              <Field label='Country' name='Country' value={form.Country} onChange={handleChange} />
            </div>

            {/* Membership Status — read only */}
            <div className='bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-200'>
              <h2 className='font-secondary font-bold text-gray-500 text-lg'>Membership Status</h2>
              <p className='text-xs text-gray-400'>This information is managed by the parish office and cannot be edited here.</p>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <ReadOnlyField label='Dues Status' value={record.Dues_Status} />
                <ReadOnlyField label='Last Verified' value={record.Last_Verified} />
              </div>
            </div>

            {error && (
              <p className='text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3'>{error}</p>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-secondary text-white font-secondary font-bold py-3 rounded-xl hover:brightness-90 transition disabled:opacity-60'
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
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
