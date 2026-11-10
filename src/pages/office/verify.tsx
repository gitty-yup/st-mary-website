import { useRouter } from 'next/router';
import React, { useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { safeOfficePath } from '@/lib/office/nav';

/**
 * Landing page for the emailed sign-in link. Signing in takes a button press
 * (a POST), because email security scanners open links automatically and
 * would otherwise use up the one-time link.
 */
export default function OfficeVerify() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function signIn() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/office/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: router.query.token }),
      });
      if (res.status === 401) {
        router.replace('/office/login?expired=1');
        return;
      }
      if (!res.ok) throw new Error();
      router.replace(safeOfficePath(router.query.next) ?? '/office');
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <OfficeLayout title='Sign in'>
      <div className='max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-6 mt-8 space-y-4'>
        <h1 className='font-secondary text-xl font-semibold text-primary'>Certificate Office</h1>
        <p className='text-gray-700'>Press the button to finish signing in.</p>
        {error && <p className='text-sm text-error'>{error}</p>}
        <button
          onClick={signIn}
          disabled={busy || !router.query.token}
          className='w-full bg-primary text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50'
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </OfficeLayout>
  );
}
