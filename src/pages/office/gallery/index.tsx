import type { GetServerSideProps } from 'next';
import React, { useCallback, useMemo, useState } from 'react';
import OfficeLayout from '@/components/office/OfficeLayout';
import { GalleryTabs, Notice, sendJson } from '@/components/office/gallery/shared';
import { requireOfficePage, type OfficeArea } from '@/lib/office/auth';
import { MAX_CAPTION, TAG_GROUPS, monthYear, type CountedEvent, type CountedTag, type OfficePhoto, type PhotoChange } from '@/lib/gallery/types';

interface Props {
  email: string;
  areas: OfficeArea[];
  photos: OfficePhoto[];
  events: CountedEvent[];
  tags: CountedTag[];
  initial: { event: string; tag: string };
}

interface Filter {
  year: string;
  /** '' all, 'none' no event, or an event ID */
  event: string;
  /** '' all, 'untagged', or a tag ID */
  tag: string;
  /** '' all, 'published', 'hidden', 'missing' */
  status: string;
}

const isPublic = (p: OfficePhoto) => p.status === 'published' && !p.fileMissing;

export default function GalleryPhotos(props: Props) {
  const [photos, setPhotos] = useState(props.photos);
  const [events, setEvents] = useState(props.events);
  const [filter, setFilter] = useState<Filter>({ year: '', event: props.initial.event, tag: props.initial.tag, status: '' });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: '', error: false });
  const clearNotice = useCallback(() => setNotice({ message: '', error: false }), []);

  const tags = props.tags;
  const years = useMemo(() => Array.from(new Set(photos.map((p) => p.takenOn.slice(0, 4)))), [photos]);
  const eventById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  const shown = useMemo(
    () =>
      photos.filter(
        (p) =>
          (!filter.year || p.takenOn.startsWith(filter.year)) &&
          (!filter.event || (filter.event === 'none' ? !p.eventId : p.eventId === filter.event)) &&
          (!filter.tag || (filter.tag === 'untagged' ? !p.tagIds.length : p.tagIds.includes(filter.tag))) &&
          (!filter.status ||
            (filter.status === 'missing' ? p.fileMissing : filter.status === 'published' ? isPublic(p) : p.status === 'hidden' && !p.fileMissing)),
      ),
    [photos, filter],
  );
  const chosen = useMemo(() => photos.filter((p) => selected.has(p.id)), [photos, selected]);

  const counts = {
    total: photos.length,
    untagged: photos.filter((p) => !p.tagIds.length).length,
    noEvent: photos.filter((p) => !p.eventId).length,
    hidden: photos.filter((p) => !isPublic(p)).length,
  };

  function toggle(index: number, shift: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shift && anchor !== null) {
        const [a, b] = anchor < index ? [anchor, index] : [index, anchor];
        shown.slice(a, b + 1).forEach((p) => next.add(p.id));
      } else {
        const id = shown[index].id;
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      return next;
    });
    setAnchor(index);
  }

  function selectMany(ids: string[]) {
    setSelected((prev) => new Set([...Array.from(prev), ...ids]));
  }

  async function apply(change: PhotoChange, message: string) {
    if (!chosen.length) return;
    setBusy(true);
    try {
      const ids = chosen.map((p) => p.id);
      const res = await sendJson<{ updated: number; refreshed: boolean }>('/api/office/gallery/photos', { ids, change });
      const idSet = new Set(ids);
      setPhotos((all) =>
        all.map((p) => {
          if (!idSet.has(p.id)) return p;
          let tagIds = p.tagIds;
          if (change.addTagIds) tagIds = Array.from(new Set([...tagIds, ...change.addTagIds]));
          if (change.removeTagIds) tagIds = tagIds.filter((t) => !change.removeTagIds!.includes(t));
          return {
            ...p,
            tagIds,
            eventId: change.eventId !== undefined ? change.eventId : p.eventId,
            status: change.status ?? p.status,
            caption: change.caption ?? p.caption,
          };
        }),
      );
      setNotice({ message: res.refreshed ? message : `${message} The public gallery will catch up within the hour.`, error: false });
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function makeCover(photo: OfficePhoto) {
    const event = photo.eventId ? eventById.get(photo.eventId) : null;
    if (!event) return;
    setBusy(true);
    try {
      await sendJson('/api/office/gallery/events', { id: event.id, coverPhotoId: photo.id });
      setEvents((all) => all.map((e) => (e.id === event.id ? { ...e, coverPhotoId: photo.id } : e)));
      setNotice({ message: `Cover photo set for ${event.title}.`, error: false });
    } catch (err) {
      setNotice({ message: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  const byYear: { year: string; items: { photo: OfficePhoto; index: number }[] }[] = [];
  shown.forEach((photo, index) => {
    const year = photo.takenOn.slice(0, 4);
    if (byYear[byYear.length - 1]?.year !== year) byYear.push({ year, items: [] });
    byYear[byYear.length - 1].items.push({ photo, index });
  });

  return (
    <OfficeLayout title='Photos' email={props.email} areas={props.areas}>
      <GalleryTabs current='/office/gallery' />

      <p className='text-sm text-gray-600 mb-4'>
        {counts.total} photos · {counts.untagged} without tags · {counts.noEvent} without an event · {counts.hidden} not shown publicly
      </p>

      <div className='flex flex-wrap gap-3 mb-4 text-sm'>
        <Select label='Year' value={filter.year} onChange={(year) => setFilter({ ...filter, year })}
          options={[['', 'All years'], ...years.map((y) => [y, y] as [string, string])]} />
        <Select label='Event' value={filter.event} onChange={(event) => setFilter({ ...filter, event })}
          options={[['', 'All'], ['none', 'No event'], ...events.map((e) => [e.id, e.title] as [string, string])]} />
        <label className='flex items-center gap-2'>
          <span className='text-gray-600'>Tag</span>
          <select value={filter.tag} onChange={(e) => setFilter({ ...filter, tag: e.target.value })} className='border border-gray-300 rounded-lg px-2 py-1.5 bg-white max-w-[14rem]'>
            <option value=''>All</option>
            <option value='untagged'>No tags yet</option>
            {TAG_GROUPS.map((g) => (
              <optgroup key={g.key} label={g.label}>
                {tags.filter((t) => t.group === g.key).map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <Select label='Shown' value={filter.status} onChange={(status) => setFilter({ ...filter, status })}
          options={[['', 'All'], ['published', 'In the public gallery'], ['hidden', 'Hidden'], ['missing', 'File missing']]} />
      </div>

      <div className='flex flex-wrap items-center gap-3 mb-4 text-sm'>
        <span className='text-gray-700'>
          {shown.length} shown · <strong>{selected.size} selected</strong>
        </span>
        <button onClick={() => selectMany(shown.map((p) => p.id))} className='text-primary hover:underline'>Select all shown</button>
        {selected.size > 0 && (
          <button onClick={() => setSelected(new Set())} className='text-primary hover:underline'>Clear selection</button>
        )}
        <span className='text-gray-500'>Click photos to select them; Shift-click selects a range.</span>
      </div>

      <div className={chosen.length ? 'pb-[48vh]' : 'pb-8'}>
        {byYear.map(({ year, items }) => (
          <section key={year} className='mb-6'>
            <div className='flex items-baseline gap-3 mb-2'>
              <h2 className='font-secondary font-semibold text-primary text-lg'>{year}</h2>
              <button onClick={() => selectMany(items.map((i) => i.photo.id))} className='text-xs text-primary hover:underline'>
                Select these {items.length}
              </button>
            </div>
            <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5'>
              {items.map(({ photo, index }) => {
                const on = selected.has(photo.id);
                const event = photo.eventId ? eventById.get(photo.eventId) : null;
                const tagNames = photo.tagIds.map((id) => tags.find((t) => t.id === id)?.label).filter(Boolean);
                return (
                  <button
                    key={photo.id}
                    onClick={(e) => toggle(index, e.shiftKey)}
                    aria-pressed={on}
                    title={[monthYear(photo.takenOn), event?.title, tagNames.join(', ')].filter(Boolean).join(' · ')}
                    className={`relative aspect-square overflow-hidden rounded bg-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary ${on ? 'ring-4 ring-primary' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumb} alt={photo.caption || monthYear(photo.takenOn)} loading='lazy' decoding='async'
                      className={`object-cover w-full h-full ${isPublic(photo) ? '' : 'opacity-40'}`} />
                    {on && <span className='absolute top-1 left-1 bg-primary text-white rounded-full w-6 h-6 text-sm leading-6 text-center'>✓</span>}
                    <span className='absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 justify-start'>
                      {photo.fileMissing ? <Badge tone='red'>File missing</Badge> : photo.status === 'hidden' && <Badge tone='gray'>Hidden</Badge>}
                      {photo.tagIds.length > 0 && <Badge>{photo.tagIds.length} {photo.tagIds.length === 1 ? 'tag' : 'tags'}</Badge>}
                      {event && <Badge>Event</Badge>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {!shown.length && <p className='text-gray-600 py-8'>No photos match these filters.</p>}
      </div>

      {chosen.length > 0 && (
        <SelectionPanel
          chosen={chosen}
          tags={tags}
          events={events}
          busy={busy}
          onApply={apply}
          onCover={makeCover}
          onClear={() => setSelected(new Set())}
        />
      )}
      <Notice message={notice.message} error={notice.error} onDone={clearNotice} />
    </OfficeLayout>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: 'red' | 'gray' }) {
  const color = tone === 'red' ? 'bg-red-700' : tone === 'gray' ? 'bg-gray-700' : 'bg-black/60';
  return <span className={`${color} text-white text-[10px] leading-4 px-1.5 rounded`}>{children}</span>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <label className='flex items-center gap-2'>
      <span className='text-gray-600'>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className='border border-gray-300 rounded-lg px-2 py-1.5 bg-white max-w-[14rem]'>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function SelectionPanel(props: {
  chosen: OfficePhoto[];
  tags: CountedTag[];
  events: CountedEvent[];
  busy: boolean;
  onApply: (change: PhotoChange, message: string) => void;
  onCover: (photo: OfficePhoto) => void;
  onClear: () => void;
}) {
  const { chosen, busy, onApply } = props;
  const n = chosen.length;
  const one = n === 1 ? chosen[0] : null;
  const [caption, setCaption] = useState(one?.caption ?? '');
  const oneId = one?.id;
  React.useEffect(() => setCaption(one?.caption ?? ''), [oneId]); // eslint-disable-line react-hooks/exhaustive-deps
  const what = n === 1 ? 'this photo' : `these ${n} photos`;
  const eventIds = Array.from(new Set(chosen.map((p) => p.eventId ?? 'none')));
  const sameEvent = eventIds.length === 1 ? eventIds[0] : '';
  const anyShown = chosen.some(isPublic);
  const anyHidden = chosen.some((p) => p.status === 'hidden');
  const oneEvent = one?.eventId ? props.events.find((e) => e.id === one.eventId) : null;

  return (
    <div className='fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-300 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]'>
      <div className='max-w-6xl mx-auto px-4 py-3 max-h-[46vh] overflow-y-auto'>
        <div className='flex flex-wrap items-center gap-3 mb-3'>
          <strong className='text-gray-800'>{n} selected</strong>
          <button onClick={props.onClear} className='text-sm text-primary hover:underline'>Clear selection</button>
          <span className='ml-auto flex gap-2'>
            {anyShown && (
              <button disabled={busy} onClick={() => onApply({ status: 'hidden' }, `Hidden ${what} from the public gallery.`)}
                className='border border-gray-400 rounded-lg px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50'>
                Hide from gallery
              </button>
            )}
            {anyHidden && (
              <button disabled={busy} onClick={() => onApply({ status: 'published' }, `${n === 1 ? 'This photo is' : `These ${n} photos are`} in the public gallery again.`)}
                className='border border-primary text-primary rounded-lg px-3 py-1 text-sm hover:bg-primary hover:text-white disabled:opacity-50'>
                Show in gallery
              </button>
            )}
          </span>
        </div>

        <div className='grid md:grid-cols-[1fr_auto] gap-x-8 gap-y-3'>
          <div className='space-y-2'>
            <p className='text-xs text-gray-500'>Tags: click to add to all selected; click a tag they all have (filled) to remove it.</p>
            {TAG_GROUPS.map((g) => {
              const groupTags = props.tags.filter((t) => t.group === g.key);
              if (!groupTags.length) return null;
              return (
                <div key={g.key} className='flex flex-wrap items-center gap-1.5'>
                  <span className='text-sm text-gray-600 w-28 shrink-0'>{g.label}</span>
                  {groupTags.map((t) => {
                    const have = chosen.filter((p) => p.tagIds.includes(t.id)).length;
                    const all = have === n;
                    return (
                      <button
                        key={t.id}
                        disabled={busy}
                        aria-pressed={all}
                        onClick={() =>
                          all
                            ? onApply({ removeTagIds: [t.id] }, `Removed “${t.label}” from ${what}.`)
                            : onApply({ addTagIds: [t.id] }, `Tagged ${what} “${t.label}”.`)
                        }
                        className={`px-2.5 py-0.5 rounded-full text-xs border disabled:opacity-50 ${
                          all ? 'bg-primary text-white border-primary' : have ? 'bg-primary/10 text-primary border-primary border-dashed' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                        }`}
                      >
                        {t.label}
                        {have > 0 && !all && <span className='ml-1 opacity-70'>({have})</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className='space-y-3 md:w-72'>
            <label className='block text-sm'>
              <span className='text-gray-600'>Event</span>
              <select
                disabled={busy}
                value={sameEvent}
                onChange={(e) => {
                  const v = e.target.value;
                  const ev = props.events.find((x) => x.id === v);
                  onApply({ eventId: v === 'none' ? null : v }, ev ? `Added ${what} to ${ev.title}.` : `Removed ${what} from their event.`);
                }}
                className='mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 bg-white'
              >
                {!sameEvent && <option value=''>(different events)</option>}
                <option value='none'>No event</option>
                {props.events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </label>
            {one && (
              <>
                <label className='block text-sm'>
                  <span className='text-gray-600'>Caption (optional; don’t name children)</span>
                  <textarea value={caption} maxLength={MAX_CAPTION} rows={2} onChange={(e) => setCaption(e.target.value)}
                    className='mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5' />
                </label>
                <div className='flex flex-wrap gap-3 items-center text-sm'>
                  <button disabled={busy || caption.trim() === one.caption} onClick={() => onApply({ caption }, 'Caption saved.')}
                    className='bg-primary text-white rounded-lg px-3 py-1 disabled:opacity-50'>
                    Save caption
                  </button>
                  {oneEvent && (
                    <button disabled={busy || oneEvent.coverPhotoId === one.id} onClick={() => props.onCover(one)} className='text-primary hover:underline disabled:opacity-50 disabled:no-underline'>
                      {oneEvent.coverPhotoId === one.id ? 'Cover of its event' : 'Use as event cover'}
                    </button>
                  )}
                  <a href={one.src} target='_blank' rel='noreferrer' className='text-primary hover:underline'>Full size ↗</a>
                </div>
                <p className='text-xs text-gray-500'>
                  {monthYear(one.takenOn)} · <code className='select-all'>{one.src}</code>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireOfficePage(ctx, 'gallery');
  if ('redirect' in auth) return auth;
  const { officeGallery } = await import('@/lib/gallery/store');
  const data = await officeGallery();
  const one = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    props: {
      email: auth.session.email,
      areas: auth.session.areas,
      ...data,
      initial: { event: one(ctx.query.event), tag: one(ctx.query.tag) },
    },
  };
};
