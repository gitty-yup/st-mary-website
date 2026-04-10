import AppLayout from '@/components/layout/AppLayout';
import { GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';
import React, { useState } from 'react';

interface GalleryProps {
  years: {
    year: string;
    images: string[];
  }[];
}

export default function Gallery({ years }: GalleryProps) {
  const allYears = years.map((y) => y.year);
  const [activeYear, setActiveYear] = useState<string>('All');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered =
    activeYear === 'All' ? years : years.filter((y) => y.year === activeYear);

  const totalImages = filtered.reduce((sum, y) => sum + y.images.length, 0);

  return (
    <AppLayout>
      <header className='blog-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Our Community</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Photo Gallery
        </h1>
        <p className='font-normal text-lg'>
          Memories from parish life at St. Mary
        </p>
      </header>

      <section className='px-primary py-12 bg-white'>
        <div className='max-w-6xl mx-auto'>
          {/* Year filter */}
          <div className='flex flex-wrap gap-2 mb-8 justify-center'>
            {['All', ...allYears].map((yr) => (
              <button
                key={yr}
                onClick={() => setActiveYear(yr)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                  activeYear === yr
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-primary border-primary hover:bg-primary hover:text-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          <p className='text-center text-gray-500 text-sm mb-8'>
            {totalImages} {totalImages === 1 ? 'photo' : 'photos'}
            {activeYear !== 'All' ? ` from ${activeYear}` : ' total'}
          </p>

          {filtered.map(({ year, images }) => (
            <div key={year} className='mb-12'>
              {activeYear === 'All' && (
                <h2 className='font-secondary font-bold text-primary text-2xl mb-4 border-b border-gray-200 pb-2'>
                  {year}
                </h2>
              )}
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
                {images.map((src) => (
                  <button
                    key={src}
                    onClick={() => setLightbox(src)}
                    className='relative aspect-square overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-secondary'
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=''
                      className='object-cover w-full h-full'
                      loading='lazy'
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className='fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4'
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className='absolute top-4 right-6 text-white text-4xl leading-none hover:text-secondary'
            aria-label='Close'
          >
            &times;
          </button>
          <div
            className='relative max-w-4xl w-full max-h-[90vh]'
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox}
              alt=''
              className='max-w-full max-h-[85vh] mx-auto rounded-lg object-contain block'
            />
            <div className='mt-2 text-center'>
              <code className='text-xs text-gray-300 bg-black/50 px-3 py-1 rounded select-all'>
                {lightbox}
              </code>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const manifestPath = path.join(process.cwd(), 'public', 'gallery-manifest.json');
  const years = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  return { props: { years } };
};
