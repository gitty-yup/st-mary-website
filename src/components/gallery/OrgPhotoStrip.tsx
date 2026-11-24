import Link from 'next/link';
import React from 'react';
import { monthYear, orgGalleryHref, type OrgPhotos } from '@/lib/gallery/types';

/**
 * An organization's newest gallery photos, with a link to all of them in the gallery.
 * Shows nothing until the organization has photos (tagged with its Organization tag).
 */
export default function OrgPhotoStrip({ data, className = '' }: { data: OrgPhotos | null; className?: string }) {
  if (!data || !data.photos.length) return null;
  const href = orgGalleryHref(data.slug);
  return (
    <section id='photos' className={`px-primary py-12 ${className}`}>
      <div className='max-w-3xl mx-auto'>
        <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>Photos</h2>
        <div className='grid grid-cols-3 sm:grid-cols-6 gap-2'>
          {data.photos.map((p) => (
            <Link key={p.id} href={href} className='block rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumb}
                alt={p.caption || `${data.label} photo, ${monthYear(p.takenOn)}`}
                loading='lazy'
                decoding='async'
                className='w-full aspect-square object-cover'
              />
            </Link>
          ))}
        </div>
        <p className='mt-5'>
          <Link href={href} className='inline-block text-secondary font-semibold hover:underline'>
            {data.count === 1 ? 'See it in the photo gallery →' : `See all ${data.label} photos in the gallery →`}
          </Link>
        </p>
      </div>
    </section>
  );
}
