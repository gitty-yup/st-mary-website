import AppLayout from '@/components/layout/AppLayout';
import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function UpdateMyInfoPage() {
  const router = useRouter();
  const expired = router.query.error === 'expired';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/request-update-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Something went wrong.'); return; }
      router.push('/update-my-info/sent');
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

      <section className='px-primary py-16 bg-white'>
        <div className='max-w-lg mx-auto'>
          {expired && (
            <div className='bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 mb-8 text-sm'>
              Your link has expired. Links are only valid for 15 minutes — please request a new one below.
            </div>
          )}

          <p className='text-gray-600 leading-relaxed mb-8'>
            Enter the email address associated with your parish record. We&apos;ll send you a secure
            link to view and update your information.
          </p>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-1' htmlFor='email'>
                Email Address
              </label>
              <input
                id='email'
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@example.com'
                className='w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent'
              />
            </div>

            {error && (
              <p className='text-red-600 text-sm'>{error}</p>
            )}

            <button
              type='submit'
              disabled={loading}
              className='w-full bg-secondary text-white font-secondary font-bold py-3 rounded-xl hover:brightness-90 transition disabled:opacity-60'
            >
              {loading ? 'Sending…' : 'Send Me a Link'}
            </button>
          </form>

          <p className='text-xs text-gray-400 mt-6 text-center'>
            The link will expire after 15 minutes. Your information is kept private and secure.
          </p>
        </div>
      </section>
    </AppLayout>
  );
}
