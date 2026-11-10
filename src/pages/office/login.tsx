import { useRouter } from 'next/router';
import React, { useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';

export default function OfficeLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const expired = router.query.expired === '1';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      const res = await fetch('/api/office/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong. Please try again.');
        setState('idle');
        return;
      }
      setState('sent');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setState('idle');
    }
  }

  return (
    <OfficeLayout title='Sign in'>
      <div className='max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-6 mt-8'>
        <h1 className='font-secondary text-xl font-semibold text-primary mb-2'>Sign in</h1>
        {state === 'sent' ? (
          <p className='text-gray-700'>
            Check your email for a sign-in link. It works once and expires in 20 minutes. Open it on this device.
          </p>
        ) : (
          <form onSubmit={submit} className='space-y-4'>
            {expired && <p className='text-sm text-gray-600'>That sign-in link has expired or was already used. Request a new one below.</p>}
            <p className='text-sm text-gray-600'>Enter your parish email address and we’ll send you a sign-in link.</p>
            <input
              type='email'
              required
              autoComplete='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary'
              placeholder='name@example.com'
            />
            {error && <p className='text-sm text-error'>{error}</p>}
            <button
              type='submit'
              disabled={state === 'sending'}
              className='w-full bg-primary text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50'
            >
              {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
            </button>
          </form>
        )}
      </div>
    </OfficeLayout>
  );
}
