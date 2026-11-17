import type { GetServerSideProps } from 'next';
import React, { useCallback, useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { ConfirmDelete, GalleryTabs, Notice, sendJson } from '@/components/office/gallery/shared';
import { requireOfficePage, type OfficeArea } from '@/lib/office/auth';
import type { SharingPerson, SharingRole } from '@/lib/gallery/sharing';

interface Props {
  email: string;
  areas: OfficeArea[];
  people: SharingPerson[];
}

const ROLES: { value: SharingRole; label: string; help: string }[] = [
  { value: 'uploader', label: 'Shares photos', help: 'Their photos wait for review before they appear.' },
  { value: 'leader', label: 'Leader: shares and reviews', help: 'Their photos go straight in, and they approve or turn down what others share.' },
];

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
const day = (iso: string | null) => (iso ? dayFormat.format(new Date(iso)) : '');

export default function GalleryPeople(props: Props) {
  const [people, setPeople] = useState(props.people);
  const [form, setForm] = useState({ name: '', email: '', role: 'uploader' as SharingRole });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: '', error: false });
  const clearNotice = useCallback(() => setNotice({ message: '', error: false }), []);

  const sorted = (list: SharingPerson[]) => [...list].sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
  const put = (p: SharingPerson) => setPeople((all) => sorted([...all.filter((x) => x.id !== p.id), p]));

  async function run<T>(work: () => Promise<T>, done: (r: T) => string) {
    setBusy(true);
    try {
      const r = await work();
      setNotice({ message: done(r), error: false });
      return true;
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run(
      () => sendJson<{ person: SharingPerson; invited: boolean }>('/api/office/gallery/people', { action: 'add', ...form }),
      (r) => {
        put(r.person);
        return r.invited
          ? `Added ${r.person.name} and emailed the invitation.`
          : `Added ${r.person.name}, but the invitation email didn’t send. Try “Send invitation again”.`;
      },
    );
    if (ok) setForm({ name: '', email: '', role: form.role });
  }

  return (
    <OfficeLayout title='People who share photos' email={props.email} areas={props.areas}>
      <GalleryTabs current='/office/gallery/people' areas={props.areas} />
      <div className='max-w-3xl space-y-2 text-sm text-gray-600 mb-6'>
        <p>
          People on this list can sign in at <strong>stmaryarmenianchurch.com/share-photos</strong> and send photos from their
          phone or computer. <strong>Leaders</strong> can also approve or turn down the photos others send, on the Review
          page, and get an email on days when photos are waiting. Adding someone emails them an invitation.
        </p>
        <p>The office (Hayr Eremia and info@) can always share and review. Removing someone signs them out at once; photos they already shared stay.</p>
      </div>

      <form onSubmit={add} className='bg-white border border-gray-200 rounded-xl p-4 mb-8 max-w-3xl grid gap-3 sm:grid-cols-2'>
        <h2 className='sm:col-span-2 font-semibold text-gray-900'>Add someone</h2>
        <label className='block text-sm'>
          <span className='text-gray-600'>Name</span>
          <input required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-2' autoComplete='off' />
        </label>
        <label className='block text-sm'>
          <span className='text-gray-600'>Email address</span>
          <input required type='email' maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className='mt-1 w-full border border-gray-300 rounded-lg px-3 py-2' autoComplete='off' />
        </label>
        <fieldset className='sm:col-span-2 text-sm'>
          <legend className='text-gray-600 mb-1'>What they can do</legend>
          <div className='grid gap-2 sm:grid-cols-2'>
            {ROLES.map((r) => (
              <label key={r.value} className={`flex gap-2 rounded-lg border p-3 cursor-pointer ${form.role === r.value ? 'border-primary bg-primary/5' : 'border-gray-300'}`}>
                <input type='radio' name='role' value={r.value} checked={form.role === r.value} onChange={() => setForm({ ...form, role: r.value })} className='mt-1' />
                <span>
                  <span className='font-medium text-gray-900'>{r.label}</span>
                  <span className='block text-gray-600'>{r.help}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className='sm:col-span-2'>
          <button type='submit' disabled={busy} className='bg-primary text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50'>
            Add and email the invitation
          </button>
        </div>
      </form>

      <h2 className='font-semibold text-gray-900 mb-3'>
        {people.length ? `${people.length} ${people.length === 1 ? 'person' : 'people'}` : 'No one yet'}
      </h2>
      <ul className='space-y-3 max-w-3xl'>
        {people.map((p) => (
          <li key={p.id} className='bg-white border border-gray-200 rounded-xl p-4'>
            <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
              <span className='font-semibold text-gray-900'>{p.name}</span>
              <span className='text-sm text-gray-600 break-all'>{p.email}</span>
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Added {day(p.addedAt)}
              {p.invitedAt ? ` · invited ${day(p.invitedAt)}` : ' · invitation not sent'}
              {` · ${p.photos} ${p.photos === 1 ? 'photo' : 'photos'} shared`}
              {p.lastShared && `, last ${day(p.lastShared)}`}
            </p>
            <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
              <label className='flex items-center gap-2'>
                <span className='text-gray-600'>Can</span>
                <select
                  value={p.role}
                  disabled={busy}
                  onChange={(e) => {
                    const role = e.target.value as SharingRole;
                    run(
                      () => sendJson<{ person: SharingPerson }>('/api/office/gallery/people', { action: 'role', id: p.id, role }),
                      (r) => {
                        put(r.person);
                        return role === 'leader' ? `${p.name} can now review photos too.` : `${p.name} now only shares photos.`;
                      },
                    );
                  }}
                  className='border border-gray-300 rounded-lg px-2 py-1.5 bg-white'
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.value === 'leader' ? 'share and review' : 'share photos'}</option>
                  ))}
                </select>
              </label>
              <button
                disabled={busy}
                onClick={() =>
                  run(
                    () => sendJson<{ person: SharingPerson; invited: boolean }>('/api/office/gallery/people', { action: 'invite', id: p.id }),
                    (r) => {
                      put(r.person);
                      return r.invited ? `Emailed the invitation to ${p.name} again.` : 'The invitation email didn’t send. Please try again later.';
                    },
                  )
                }
                className='text-primary hover:underline disabled:opacity-50'
              >
                Send invitation again
              </button>
              <ConfirmDelete
                label='Remove'
                title={`Remove ${p.name}?`}
                confirmLabel={`Remove ${p.name}`}
                workingLabel='Removing…'
                busy={busy}
                className='ml-auto text-sm text-red-700 hover:underline disabled:opacity-50'
                message={
                  <p>
                    {p.name} is signed out at once and can no longer {p.role === 'leader' ? 'share or review' : 'share'} photos.
                    Photos they already shared stay in the gallery. You can add them again later.
                  </p>
                }
                onConfirm={async () => {
                  await run(
                    () => sendJson('/api/office/gallery/people', { action: 'remove', id: p.id }),
                    () => {
                      setPeople((all) => all.filter((x) => x.id !== p.id));
                      return `Removed ${p.name}.`;
                    },
                  );
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <Notice message={notice.message} error={notice.error} onDone={clearNotice} />
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx, 'people');
  if ('redirect' in auth) return auth;
  const { listPeople } = await import('@/lib/gallery/sharing');
  return { props: { email: auth.session.email, areas: auth.session.areas, people: await listPeople() } };
};
