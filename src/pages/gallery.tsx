import AppLayout from '@/components/layout/AppLayout';
import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  TAG_GROUPS,
  eventName,
  inMainView,
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
const NO_FILTERS: Filters = { year: '', event: '', organization: '', occasion: '', people: '', collection: '' };

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
  const activeEvent = events.find((e) => e.slug === filters.event) ?? null;

  // Photos with an "only when chosen" tag (e.g. flyers) are in view only while that tag is chosen.
  const filterOnlyIds = useMemo(() => new Set(tags.filter((t) => t.filterOnly).map((t) => t.id)), [tags]);
  const chosenTagIds = useMemo(
    () => TAG_GROUPS.map((g) => tags.find((t) => t.group === g.key && t.slug === filters[g.key])?.id).filter((id): id is string => !!id),
    [tags, filters],
  );
  const pool = useMemo(() => photos.filter((p) => inMainView(p, filterOnlyIds, chosenTagIds)), [photos, filterOnlyIds, chosenTagIds]);
  const poolEvents = useMemo(
    () => events.filter((e) => e.id === activeEvent?.id || pool.some((p) => p.eventId === e.id)),
    [events, pool, activeEvent],
  );

  // Everything the event and tag filters match; the year buttons offer only years found here.
  const matching = useMemo(() => {
    const wanted = TAG_GROUPS.map((g) => tags.find((t) => t.group === g.key && t.slug === filters[g.key])?.id ?? (filters[g.key] ? 'none' : ''));
    return pool.filter(
      (p) => (!filters.event || (activeEvent && p.eventId === activeEvent.id)) && wanted.every((id) => !id || p.tagIds.includes(id)),
    );
  }, [pool, tags, filters, activeEvent]);
  const years = useMemo(() => {
    const found = Array.from(new Set(matching.map((p) => p.takenOn.slice(0, 4))));
    // Keep the chosen year's button even if nothing matches, so it can be seen and changed.
    return filters.year && !found.includes(filters.year) ? [...found, filters.year].sort().reverse() : found;
  }, [matching, filters.year]);
  const shown = useMemo(() => matching.filter((p) => !filters.year || p.takenOn.startsWith(filters.year)), [matching, filters.year]);

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
      poolEvents
        .map((e) => {
          const own = pool.filter((p) => p.eventId === e.id);
          return { event: e, count: own.length, cover: own.find((p) => p.id === e.coverPhotoId) ?? own[0] };
        })
        .filter((c) => c.count > 0),
    [poolEvents, pool],
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
            {poolEvents.length > 0 && (
              <FilterSelect label='Event' value={filters.event} onChange={(v) => update({ event: v })} all='All events'
                options={poolEvents.map((e) => ({ value: e.slug, label: eventName(e) }))} />
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
          eventFor={(p) => (p.eventId ? eventById.get(p.eventId) ?? null : null)}
          tagsFor={(p) => p.tagIds.map((id) => tagById.get(id)).filter((t): t is GalleryTag => !!t)}
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

const SLIDE_MS = 280;

interface Gesture {
  x0: number;
  y0: number;
  t0: number;
  /** Decided after the first few pixels: sideways (next/previous) or down (close). */
  axis: '' | 'x' | 'y';
}

/**
 * Full-size photo viewer. On touch screens the photo follows the finger: a
 * quick flick or a drag across a fifth of the screen moves to the next or
 * previous photo (anything less springs back), and a drag down closes it.
 * Neighbouring photos are already loaded, so they slide in straight away.
 * Pinch-zoom still works; swiping pauses while zoomed in.
 */
function Lightbox(props: {
  photos: GalleryPhoto[];
  index: number;
  eventFor: (p: GalleryPhoto) => GalleryEvent | null;
  tagsFor: (p: GalleryPhoto) => GalleryTag[];
  onIndex: (i: number) => void;
  onClose: () => void;
  onEvent: (slug: string) => void;
  onTag: (t: GalleryTag) => void;
}) {
  const { photos, index, onIndex, onClose } = props;
  const n = photos.length;
  const many = n > 1;
  const overlayRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const busy = useRef(false);
  const justSwiped = useRef(false);
  const [zoomed, setZoomed] = useState(false);

  /** Moves the photo strip (x: sideways, y: down) and dims the backdrop as it's pulled down. */
  const place = useCallback((x: number, y: number, ms = 0) => {
    const track = trackRef.current;
    const overlay = overlayRef.current;
    if (!track || !overlay) return;
    const ease = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
    track.style.transition = ms ? `transform ${ms}ms ${ease}` : 'none';
    track.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    overlay.style.transition = ms ? `background-color ${ms}ms ${ease}` : 'none';
    overlay.style.backgroundColor = `rgba(0, 0, 0, ${0.92 * (1 - Math.min(1, Math.max(0, y) / (window.innerHeight * 0.8)))})`;
  }, []);

  // A new photo is centred without animation (the strip has already slid there).
  useLayoutEffect(() => place(0, 0), [index, place]);

  const motionMs = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : SLIDE_MS);

  const go = useCallback(
    (step: 1 | -1) => {
      if (!many || busy.current) return;
      const next = (index + step + n) % n;
      const ms = motionMs();
      if (!ms) return onIndex(next);
      busy.current = true;
      place(-step * window.innerWidth, 0, ms);
      window.setTimeout(() => {
        busy.current = false;
        onIndex(next);
      }, ms);
    },
    [many, index, n, onIndex, place],
  );

  const close = useCallback(
    (slideDown = false) => {
      const ms = slideDown ? motionMs() : 0;
      if (!ms) return onClose();
      busy.current = true;
      place(0, window.innerHeight, ms);
      window.setTimeout(onClose, ms);
    },
    [onClose, place],
  );

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
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, close]);

  // Pinch-zoomed in: let the browser pan the zoomed photo instead of swiping.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const check = () => setZoomed(vv.scale > 1.05);
    vv.addEventListener('resize', check);
    return () => vv.removeEventListener('resize', check);
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    if (busy.current || zoomed || e.touches.length !== 1) {
      gesture.current = null;
      return;
    }
    const t = e.touches[0];
    gesture.current = { x0: t.clientX, y0: t.clientY, t0: Date.now(), axis: '' };
  }

  function onTouchMove(e: React.TouchEvent) {
    const g = gesture.current;
    if (!g) return;
    if (e.touches.length !== 1) {
      // A second finger: it's a pinch, not a swipe.
      gesture.current = null;
      place(0, 0, motionMs());
      return;
    }
    const dx = e.touches[0].clientX - g.x0;
    const dy = e.touches[0].clientY - g.y0;
    if (!g.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }
    if (g.axis === 'x') place(many ? dx : dx / 4, 0);
    else place(0, dy > 0 ? dy : dy / 4);
  }

  function onTouchEnd(e: React.TouchEvent) {
    const g = gesture.current;
    gesture.current = null;
    if (!g || !g.axis) return;
    // The finger lifting after a swipe mustn't count as a tap on the backdrop (which closes).
    justSwiped.current = true;
    window.setTimeout(() => (justSwiped.current = false), 400);
    const t = e.changedTouches[0];
    const dx = t.clientX - g.x0;
    const dy = t.clientY - g.y0;
    const ms = Math.max(1, Date.now() - g.t0);
    if (g.axis === 'x') {
      const flick = Math.abs(dx) > 25 && Math.abs(dx) / ms > 0.35;
      if (many && (flick || Math.abs(dx) > window.innerWidth * 0.2)) go(dx < 0 ? 1 : -1);
      else place(0, 0, motionMs());
    } else {
      const flick = dy > 30 && dy / ms > 0.45;
      if (flick || dy > window.innerHeight * 0.18) close(true);
      else place(0, 0, motionMs());
    }
  }

  function onTouchCancel() {
    gesture.current = null;
    place(0, 0, motionMs());
  }

  // The photo, and its neighbours either side (loaded in advance, ready to slide in).
  const slots = many ? [-1, 0, 1] : [0];
  const arrow =
    'absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/45 hover:bg-black/70 text-white text-3xl leading-none flex items-center justify-center';

  return (
    <div
      ref={overlayRef}
      className='fixed inset-0 z-50 overflow-hidden select-none'
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)', touchAction: zoomed ? 'auto' : 'pinch-zoom', overscrollBehavior: 'contain' }}
      role='dialog'
      aria-modal='true'
      aria-label='Photo viewer'
      onClick={() => !justSwiped.current && close()}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      <div ref={trackRef} className='absolute inset-0' style={{ willChange: 'transform' }}>
        {slots.map((slot) => {
          const at = (index + slot + n) % n;
          const photo = photos[at];
          const event = props.eventFor(photo);
          const tags = props.tagsFor(photo);
          const current = slot === 0;
          return (
            <div
              // Keyed by photo, so a neighbour that becomes the current photo keeps its loaded image.
              key={n === 2 ? `slot${slot}` : photo.id}
              className='absolute inset-0 flex flex-col items-center justify-center px-3 md:px-20 py-14'
              style={{ transform: `translateX(${slot * 100}%)` }}
              aria-hidden={!current}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photoAlt(photo, event)}
                draggable={false}
                decoding='async'
                onClick={(e) => e.stopPropagation()}
                className='max-w-full max-h-[calc(100dvh-12rem)] min-h-0 rounded-lg object-contain block'
              />
              <div className='mt-3 text-center text-gray-200 text-sm space-y-2 max-w-3xl' onClick={(e) => e.stopPropagation()}>
                {photo.caption && <p className='text-base text-white'>{photo.caption}</p>}
                <p className='text-gray-400'>
                  {monthYear(photo.takenOn)}
                  {event && (
                    <>
                      {' · '}
                      <button tabIndex={current ? 0 : -1} onClick={() => props.onEvent(event.slug)} className='underline hover:text-white'>
                        {event.title}
                      </button>
                    </>
                  )}
                  {many && <span className='ml-2'>({at + 1} of {n})</span>}
                </p>
                {tags.length > 0 && (
                  <p className='flex flex-wrap gap-2 justify-center'>
                    {tags.map((t) => (
                      <button
                        key={t.id}
                        tabIndex={current ? 0 : -1}
                        onClick={() => props.onTag(t)}
                        className='px-3 py-0.5 rounded-full border border-white/40 text-xs hover:bg-white/10'
                      >
                        {t.label}
                      </button>
                    ))}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        ref={closeRef}
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label='Close'
        className='absolute top-2 right-2 md:top-3 md:right-4 z-10 w-11 h-11 rounded-full bg-black/45 hover:bg-black/70 text-white text-3xl leading-none flex items-center justify-center'
      >
        &times;
      </button>
      {many && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label='Previous photo'
            className={`${arrow} left-2 md:left-4`}
          >
            &#8249;
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label='Next photo'
            className={`${arrow} right-2 md:right-4`}
          >
            &#8250;
          </button>
        </>
      )}
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
