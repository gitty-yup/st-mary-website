'use client';
import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import React, { useState } from 'react';

const ACCESS_KEY = 'e00f3f7e-62c3-4973-8962-8e38501c9936';

export default function Facilities() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_key: ACCESS_KEY, subject: 'St. Mary Website — Rental Inquiry', ...data }),
    });
    if (res.ok) {
      setStatus('success');
      form.reset();
    } else {
      setStatus('error');
    }
  }

  return (
    <AppLayout>
      <header className='facilities-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>Host Your Event Here</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Our Facilities
        </h1>
        <p className='font-normal text-lg'>Beautiful venues in the heart of Costa Mesa</p>
      </header>

      {/* Stambolian Hall */}
      <section id='stambolian-hall' className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Our Flagship Venue</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-6'>
            Stambolian Family Hall
          </h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 items-start'>
            <div>
              <p className='text-gray-700 leading-relaxed mb-4'>
                Our stunning new Stambolian Family Hall is the crown jewel of St. Mary&apos;s recently
                completed campus redevelopment. Named in honor of the Stamboulian family whose lead gift
                made it possible, this modern assembly hall is designed for the most meaningful moments
                in your life.
              </p>
              <p className='text-gray-700 leading-relaxed mb-6'>
                Whether you&apos;re planning a wedding reception, a baptism banquet, a memorial dinner, a
                corporate event, or a community fundraiser — the Stambolian Family Hall offers the space,
                beauty, and service to make your event truly special.
              </p>
              <div className='grid grid-cols-2 gap-4'>
                {[
                  { label: 'Capacity', value: '~300 guests' },
                  { label: 'Features', value: 'Stage & dance floor' },
                  { label: 'Kitchen', value: 'Full catering kitchen' },
                  { label: 'Parking', value: 'Ample on-site parking' },
                ].map((f) => (
                  <div key={f.label} className='bg-[#FFF2EE] rounded-xl p-4'>
                    <p className='text-secondary font-semibold text-sm'>{f.label}</p>
                    <p className='text-primary font-bold'>{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className='bg-[#FFF5F2] rounded-2xl p-6'>
              <h3 className='font-secondary font-bold text-primary text-lg mb-4'>Ideal For</h3>
              <ul className='space-y-2 text-gray-700'>
                {[
                  'Wedding receptions & rehearsal dinners',
                  'Baptism & confirmation celebrations',
                  'Memorial banquets & tributes',
                  'Anniversary celebrations',
                  'Corporate events & galas',
                  'Community fundraisers & festivals',
                  'Armenian cultural events',
                ].map((use) => (
                  <li key={use} className='flex items-start gap-2'>
                    <span className='text-secondary mt-1'>✓</span>
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Small Hall */}
      <section id='small-hall' className='px-primary py-16 bg-[#FFF5F2]'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Intimate &amp; Versatile</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-6'>Small Hall</h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 items-start'>
            <div>
              <p className='text-gray-700 leading-relaxed mb-4'>
                Our Small Hall is a flexible and welcoming space, ideal for smaller gatherings where
                community and connection are at the heart of the event. It is used throughout the week
                for parish meetings, classes, and community events.
              </p>
              <ul className='space-y-2 text-gray-700'>
                {[
                  'Meetings, workshops & classes',
                  'Smaller celebrations & showers',
                  'Community organization events',
                  'Religious education sessions',
                ].map((use) => (
                  <li key={use} className='flex items-start gap-2'>
                    <span className='text-secondary mt-1'>✓</span>
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className='bg-white rounded-2xl p-6 shadow-sm'>
              <h3 className='font-secondary font-bold text-primary text-lg mb-3'>Booking Policy</h3>
              <p className='text-gray-700 text-sm leading-relaxed mb-2'>
                Parishioner bookings are given priority for both halls. Community and outside rentals
                are welcome subject to availability.
              </p>
              <p className='text-gray-700 text-sm leading-relaxed'>
                All events must align with the mission and values of St. Mary Armenian Apostolic Church.
                The church office is happy to assist you with planning and logistics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* General Rental Info */}
      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2'>Before You Book</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-6'>Hall Rental Guidelines</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
            {[
              { title: 'Parishioner Priority', desc: 'Parish members receive priority scheduling and preferred rates for both halls.' },
              { title: 'General Availability', desc: 'Non-parishioner rentals are welcome based on availability and alignment with parish values.' },
              { title: 'Catering & Setup', desc: 'Our kitchen is available for use with catering arrangements. Tables and chairs are included.' },
            ].map((item) => (
              <div key={item.title} className='bg-[#FFF2EE] rounded-2xl p-6'>
                <h3 className='font-secondary font-semibold text-primary text-lg mb-2'>{item.title}</h3>
                <p className='text-gray-700 text-sm leading-relaxed'>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rental Inquiry Form */}
      <section id='rental-inquiry' className='px-primary py-16 bg-[#FFF5F2]'>
        <div className='max-w-2xl mx-auto'>
          <p className='text-secondary font-cursive text-2xl mb-2 text-center'>Ready to Book?</p>
          <h2 className='text-primary font-secondary font-bold text-3xl mb-6 text-center'>
            Rental Inquiry
          </h2>
          <p className='text-gray-600 text-center mb-8'>
            Fill out the form below and our office will be in touch within 2 business days.
          </p>

          {status === 'success' ? (
            <div className='bg-green-50 border border-green-200 rounded-2xl p-10 text-center'>
              <p className='text-green-700 font-semibold text-lg mb-2'>Inquiry Sent!</p>
              <p className='text-green-600 text-sm'>Thank you for your interest. Our office will be in touch within 2 business days.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='bg-white rounded-2xl p-8 shadow-sm space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Full Name *</label>
                  <input
                    type='text'
                    name='name'
                    required
                    className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Email *</label>
                  <input
                    type='email'
                    name='email'
                    required
                    className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary'
                  />
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Phone</label>
                  <input
                    type='tel'
                    name='phone'
                    className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Event Type *</label>
                  <select
                    name='event_type'
                    required
                    className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary'
                  >
                    <option value=''>Select...</option>
                    <option>Wedding Reception</option>
                    <option>Baptism Celebration</option>
                    <option>Anniversary / Birthday</option>
                    <option>Memorial / Tribute</option>
                    <option>Corporate Event</option>
                    <option>Community / Fundraiser</option>
                    <option>Meeting / Workshop</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Preferred Date</label>
                  <input
                    type='date'
                    name='date'
                    className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Estimated Guest Count</label>
                  <input
                    type='number'
                    name='guest_count'
                    placeholder='e.g. 150'
                    className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary'
                  />
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Additional Notes</label>
                <textarea
                  name='notes'
                  rows={4}
                  className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary'
                />
              </div>
              {status === 'error' && (
                <p className='text-red-600 text-sm'>Something went wrong. Please try again or call us at (949) 650-8367.</p>
              )}
              <Button type='submit' className='!w-full' disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Submit Inquiry'}
              </Button>
            </form>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
