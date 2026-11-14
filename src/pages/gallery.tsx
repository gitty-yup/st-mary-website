import AppLayout from '@/components/layout/AppLayout';
import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TAG_GROUPS,
  monthYear,
  photoAlt,
  type GalleryEvent,
  type GalleryPhoto,
  type GalleryTag,
  type TagGroup,
} from '@/lib/gallery/types';

interface GalleryProps {
  photos: GalleryPhoto[];
  events: GalleryEvent[];
  tags: GalleryTag[];
}

/** Filters, as kept in the address (/gallery?year=2018&org=acyo): slugs, or '' for all. */
type Filters = { year: string; event: string } & Record<TagGroup, string>;
const NO_FILTERS: Filters = { year: '', event: '', organization: '', occasion: '', people: '' };

function filtersFromQuery(q: Record<string, string | string[] | undefined>): Filters {
  const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');
  const f: Filters = { ...NO_FILTERS, year: one(q.year), event: one(q.event) };
  for (const g of TAG_GROUPS) f[g.key] = one(q[g.param]);
  return f;
}

function queryFromFilters(f: Filters): Record<string, string> {
  const q: Record<string, string> = {};
  if (f.year) q.year = f.year;
  if (f.event) q.event = f.event;
  for (const g of TAG_GROUPS) if (f[g.key]) q[g.param] = f[g.key];
  return q;
}

export default function Gallery({ photos, events, tags }: GalleryProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (router.isReady) setFilters(filtersFromQuery(router.query));
  }, [router.isReady, router.query]);

  const update = useCallback(
    (change: Partial<Filters>) => {
      const next = { ...filters, ...change };
      setFilters(next);
      setOpen(null);
      router.replace({ pathname: '/gallery', query: queryFromFilters(next) }, undefined, { shallow: true, scroll: false });
    },
    [filters, router],
  );

  const eventById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const tagById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
  const years = useMemo(() => Array.from(new Set(photos.map((p) => p.takenOn.slice(0, 4)))), [photos]);
  const activeEvent = events.find((e) => e.slug === filters.event) ?? null;

  const shown = useMemo(() => {
    const wanted = TAG_GROUPS.map((g) => tags.find((t) => t.group === g.key && t.slug === filters[g.key])?.id ?? (filters[g.key] ? 'none' : ''));
    return photos.filter(
      (p) =>
        (!filters.year || p.takenOn.startsWith(filters.year)) &&
        (!filters.event || (activeEvent && p.eventId === activeEvent.id)) &&
        wanted.every((id) => !id || p.tagIds.includes(id)),
    );
  }, [photos, tags, filters, activeEvent]);

  const filtering = Object.values(filters).some(Boolean);
  const byYear = useMemo(() => {
    const groups: { year: string; photos: { photo: GalleryPhoto; index: number }[] }[] = [];
    shown.forEach((photo, index) => {
      const year = photo.takenOn.slice(0, 4);
      if (groups[groups.length - 1]?.year !== year) groups.push({ year, photos: [] });
      groups[groups.length - 1].photos.push({ photo, index });
    });
    return groups;
  }, [shown]);

  const eventCards = useMemo(
    () =>
      events.map((e) => {
        const own = photos.filter((p) => p.eventId === e.id);
        return { event: e, count: own.length, cover: own.find((p) => p.id === e.coverPhotoId) ?? own[0] };
      }),
    [events, photos],
  );

  return (
    <AppLayout>
      <header className='gallery-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Our Community</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>Photo Gallery</h1>
        <p className='font-normal text-lg'>Memories from parish life at St. Mary</p>
      </header>

      <section className='px-primary py-12 bg-white'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-wrap gap-2 mb-4 justify-center' role='group' aria-label='Year'>
            {['', ...years].map((yr) => (
              <button
                key={yr || 'all'}
                onClick={() => update({ year: yr })}
                aria-pressed={filters.year === yr}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                  filters.year === yr ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'
                }`}
              >
                {yr || 'All'}
              </button>
            ))}
          </div>

          <div className='flex flex-wrap gap-3 justify-center mb-6'>
            {events.length > 0 && (
              <FilterSelect label='Event' value={filters.event} onChange={(v) => update({ event: v })} all='All events'
                options={events.map((e) => ({ value: e.slug, label: e.title }))} />
            )}
            {TAG_GROUPS.map((g) => {
              const groupTags = tags.filter((t) => t.group === g.key);
              if (!groupTags.length) return null;
              return (
                <FilterSelect key={g.key} label={g.label} value={filters[g.key]} onChange={(v) => update({ [g.key]: v })}
                  all={`All ${g.label === 'People' ? 'people' : `${g.label.toLowerCase()}s`}`}
                  options={groupTags.map((t) => ({ value: t.slug, label: t.label }))} />
              );
            })}
          </div>

          <p className='text-center text-gray-500 text-sm mb-8' aria-live='polite'>
            {shown.length} {shown.length === 1 ? 'photo' : 'photos'}
            {filtering && (
              <>
                {' · '}
                <button onClick={() => update(NO_FILTERS)} className='text-primary underline hover:no-underline'>
                  Show all photos
                </button>
              </>
            )}
          </p>

          {activeEvent && (
            <div className='text-center mb-8'>
              <h2 className='font-secondary font-bold text-primary text-2xl'>{activeEvent.title}</h2>
              {activeEvent.eventDate && <p className='text-gray-500 text-sm mt-1'>{monthYear(activeEvent.eventDate)}</p>}
              {activeEvent.description && <p className='text-gray-700 mt-3 max-w-2xl mx-auto whitespace-pre-line'>{activeEvent.description}</p>}
            </div>
          )}

          {!filtering && eventCards.length > 0 && (
            <div className='mb-12'>
              <h2 className='font-secondary font-bold text-primary text-2xl mb-4 border-b border-gray-200 pb-2'>Events</h2>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                {eventCards.map(({ event, count, cover }) => (
                  <button key={event.id} onClick={() => update({ event: event.slug })} className='text-left group focus:outline-none focus:ring-2 focus:ring-secondary rounded-lg'>
                    <div className='aspect-[4/3] overflow-hidden rounded-lg bg-gray-100'>
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover.thumb} alt='' loading='lazy' decoding='async' className='object-cover w-full h-full group-hover:opacity-90 transition' />
                      )}
                    </div>
                    <p className='font-medium text-gray-800 mt-2 leading-snug'>{event.title}</p>
                    <p className='text-xs text-gray-500'>
                      {[monthYear(event.eventDate), `${count} ${count === 1 ? 'photo' : 'photos'}`].filter(Boolean).join(' · ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {shown.length === 0 && filtering && (
            <p className='text-center text-gray-600 py-12'>No photos match these filters yet.</p>
          )}

          {byYear.map(({ year, photos: group }) => (
            <div key={year} className='mb-12'>
              {!filters.year && (
                <h2 className='font-secondary font-bold text-primary text-2xl mb-4 border-b border-gray-200 pb-2'>{year}</h2>
              )}
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
                {group.map(({ photo, index }) => (
                  <button
                    key={photo.id}
                    onClick={() => setOpen(index)}
                    className='relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-secondary'
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumb}
                      alt={photoAlt(photo, photo.eventId ? eventById.get(photo.eventId) : null)}
                      width={photo.width}
                      height={photo.height}
                      className='object-cover w-full h-full'
                      loading='lazy'
                      decoding='async'
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {open !== null && shown[open] && (
        <Lightbox
          photos={shown}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          event={shown[open].eventId ? eventById.get(shown[open].eventId!) ?? null : null}
          tags={shown[open].tagIds.map((id) => tagById.get(id)).filter((t): t is GalleryTag => !!t)}
          onEvent={(slug) => update({ ...NO_FILTERS, event: slug })}
          onTag={(t) => update({ ...NO_FILTERS, [t.group]: t.slug })}
        />
      )}
    </AppLayout>
  );
}

function FilterSelect(props: { label: string; value: string; all: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <label className='flex items-center gap-2 text-sm text-gray-600'>
      <span>{props.label}</span>
      <select
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className='border border-gray-300 rounded-lg px-3 py-1.5 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-secondary max-w-[14rem]'
      >
        <option value=''>{props.all}</option>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Lightbox(props: {
  photos: GalleryPhoto[];
  index: number;
  event: GalleryEvent | null;
  tags: GalleryTag[];
  onIndex: (i: number) => void;
  onClose: () => void;
  onEvent: (slug: string) => void;
  onTag: (t: GalleryTag) => void;
}) {
  const { photos, index, onIndex, onClose } = props;
  const photo = photos[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const go = useCallback((step: number) => onIndex((index + step + photos.length) % photos.length), [index, photos.length, onIndex]);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      before?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const many = photos.length > 1;
  return (
    <div
      className='fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4'
      role='dialog'
      aria-modal='true'
      aria-label='Photo viewer'
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - (touchX.current ?? e.changedTouches[0].clientX);
        if (many && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <button ref={closeRef} onClick={onClose} className='absolute top-3 right-4 text-white text-4xl leading-none hover:text-secondary p-2' aria-label='Close'>
        &times;
      </button>
      {many && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label='Previous photo'
            className='absolute left-1 md:left-4 top-1/2 -translate-y-1/2 text-white text-4xl md:text-5xl hover:text-secondary p-3'>
            &#8249;
          </button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label='Next photo'
            className='absolute right-1 md:right-4 top-1/2 -translate-y-1/2 text-white text-4xl md:text-5xl hover:text-secondary p-3'>
            &#8250;
          </button>
        </>
      )}
      <figure className='relative max-w-5xl w-full' onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photoAlt(photo, props.event)} className='max-w-full max-h-[78vh] mx-auto rounded-lg object-contain block' />
        <figcaption className='mt-3 text-center text-gray-200 text-sm space-y-2'>
          {photo.caption && <p className='text-base text-white'>{photo.caption}</p>}
          <p className='text-gray-400'>
            {monthYear(photo.takenOn)}
            {props.event && (
              <>
                {' · '}
                <button onClick={() => props.onEvent(props.event!.slug)} className='underline hover:text-white'>{props.event.title}</button>
              </>
            )}
            {many && <span className='ml-2'>({index + 1} of {photos.length})</span>}
          </p>
          {props.tags.length > 0 && (
            <p className='flex flex-wrap gap-2 justify-center'>
              {props.tags.map((t) => (
                <button key={t.id} onClick={() => props.onTag(t)} className='px-3 py-0.5 rounded-full border border-white/40 text-xs hover:bg-white/10'>
                  {t.label}
                </button>
              ))}
            </p>
          )}
        </figcaption>
      </figure>
    </div>
  );
}

export const getStaticProps: GetStaticProps<GalleryProps> = async () => {
  // Local development without a database: an empty gallery rather than an error.
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && process.env.VERCEL_ENV !== 'production') {
    return { props: { photos: [], events: [], tags: [] }, revalidate: 60 };
  }
  const { publicGallery } = await import('@/lib/gallery/store');
  // Office changes refresh the page straight away; this is only a fallback.
  return { props: await publicGallery(), revalidate: 3600 };
};
