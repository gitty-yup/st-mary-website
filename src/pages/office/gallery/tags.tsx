import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import React, { useCallback, useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { ConfirmDelete, GalleryTabs, Notice, sendJson } from '@/components/office/gallery/shared';
import { requireOfficePage, type OfficeArea } from '@/lib/office/auth';
import { MAX_LABEL, TAG_GROUPS, type CountedTag, type GalleryTag, type TagGroup } from '@/lib/gallery/types';

interface Props {
  email: string;
  areas: OfficeArea[];
  tags: CountedTag[];
}

export default function GalleryTags(props: Props) {
  const [tags, setTags] = useState(props.tags);
  const [adding, setAdding] = useState<Record<string, string>>({});
  const [renaming, setRenaming] = useState<{ id: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: '', error: false });
  const clearNotice = useCallback(() => setNotice({ message: '', error: false }), []);

  async function run(fn: () => Promise<string>) {
    setBusy(true);
    try {
      setNotice({ message: await fn(), error: false });
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  const sorted = (list: CountedTag[]) => [...list].sort((a, b) => a.label.localeCompare(b.label));

  const add = (group: TagGroup) =>
    run(async () => {
      const { tag } = await sendJson<{ tag: GalleryTag }>('/api/office/gallery/tags', { group, label: adding[group] ?? '' });
      setTags((all) => sorted([...all, { ...tag, photos: 0 }]));
      setAdding({ ...adding, [group]: '' });
      return `Added “${tag.label}”.`;
    });

  const rename = () =>
    run(async () => {
      const { tag } = await sendJson<{ tag: GalleryTag }>('/api/office/gallery/tags', renaming);
      setTags((all) => sorted(all.map((t) => (t.id === tag.id ? { ...t, label: tag.label } : t))));
      setRenaming(null);
      return 'Tag renamed.';
    });

  const remove = (t: CountedTag) =>
    run(async () => {
      await sendJson(`/api/office/gallery/tags?id=${t.id}`, undefined, 'DELETE');
      setTags((all) => all.filter((x) => x.id !== t.id));
      return `Deleted “${t.label}”${t.photos ? ` and took it off ${t.photos} photos` : ''}.`;
    });

  return (
    <OfficeLayout title='Photo tags' email={props.email} areas={props.areas}>
      <GalleryTabs current='/office/gallery/tags' />
      <p className='text-sm text-gray-600 mb-6 max-w-3xl'>
        Visitors can filter the gallery by these tags. Only tags on at least one photo are shown publicly. Renaming a tag keeps
        its web address, so links people have shared still work.
      </p>
      <div className='grid md:grid-cols-3 gap-6'>
        {TAG_GROUPS.map((g) => (
          <section key={g.key} className='bg-white border border-gray-200 rounded-xl p-4'>
            <h2 className='font-secondary font-semibold text-primary text-lg mb-3'>{g.label}</h2>
            <ul className='space-y-2 mb-4'>
              {tags.filter((t) => t.group === g.key).map((t) => (
                <li key={t.id} className='text-sm'>
                  {renaming?.id === t.id ? (
                    <span className='flex gap-2 items-center'>
                      <input value={renaming.label} maxLength={MAX_LABEL} autoFocus onChange={(e) => setRenaming({ id: t.id, label: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && rename()} className='flex-1 border border-gray-300 rounded px-2 py-1' />
                      <button onClick={rename} disabled={busy || !renaming.label.trim()} className='text-primary font-medium hover:underline'>Save</button>
                      <button onClick={() => setRenaming(null)} className='text-gray-600 hover:underline'>Cancel</button>
                    </span>
                  ) : (
                    <span className='flex flex-wrap gap-x-3 gap-y-1 items-baseline'>
                      <span className='text-gray-800'>{t.label}</span>
                      <Link href={`/office/gallery?tag=${t.id}`} className='text-xs text-gray-500 hover:underline'>
                        {t.photos} {t.photos === 1 ? 'photo' : 'photos'}
                      </Link>
                      <span className='ml-auto flex gap-3'>
                        <button onClick={() => setRenaming({ id: t.id, label: t.label })} className='text-primary hover:underline'>Rename</button>
                        <ConfirmDelete question={t.photos ? `Take it off ${t.photos} photos?` : 'Delete?'} busy={busy} onConfirm={() => remove(t)} />
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className='flex gap-2'>
              <input value={adding[g.key] ?? ''} maxLength={MAX_LABEL} placeholder={`New ${g.label.toLowerCase()} tag`}
                onChange={(e) => setAdding({ ...adding, [g.key]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (adding[g.key] ?? '').trim() && add(g.key)}
                className='flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-1.5 text-sm' />
              <button onClick={() => add(g.key)} disabled={busy || !(adding[g.key] ?? '').trim()} className='bg-primary text-white rounded-lg px-3 py-1.5 text-sm disabled:opacity-50'>
                Add
              </button>
            </div>
          </section>
        ))}
      </div>
      <Notice message={notice.message} error={notice.error} onDone={clearNotice} />
    </OfficeLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx, 'gallery');
  if ('redirect' in auth) return auth;
  const { officeGallery } = await import('@/lib/gallery/store');
  const { tags } = await officeGallery();
  return { props: { email: auth.session.email, areas: auth.session.areas, tags } };
};
