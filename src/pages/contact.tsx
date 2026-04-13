'use client';
import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import React, { useState } from 'react';

const ACCESS_KEY = 'e00f3f7e-62c3-4973-8962-8e38501c9936';

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_key: ACCESS_KEY, subject: 'St. Mary Website — Contact Form', ...data }),
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
      <header className='contact-header-bg px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white'>
        <p className='font-cursive text-secondary text-2xl'>We&apos;d Love to Hear from You</p>
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          Contact Us
        </h1>
      </header>

      <section className='px-primary py-16 bg-white'>
        <div className='max-w-4xl mx-auto'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
            {/* Contact Info */}
            <div>
              <p className='text-secondary font-cursive text-2xl mb-2'>Get in Touch</p>
              <h2 className='text-primary font-secondary font-bold text-2xl mb-6'>Contact Information</h2>
              <div className='space-y-5 text-gray-700'>
                <div className='flex items-start gap-3'>
                  <span className='text-secondary text-xl mt-1'>📍</span>
                  <div>
                    <p className='font-semibold text-primary'>Address</p>
                    <p>148 22nd Street</p>
                    <p>Costa Mesa, CA 92627</p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <span className='text-secondary text-xl mt-1'>📞</span>
                  <div>
                    <p className='font-semibold text-primary'>Phone</p>
                    <a href='tel:+19496508367' className='hover:text-secondary'>(949) 650-8367</a>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <span className='text-secondary text-xl mt-1'>📠</span>
                  <div>
                    <p className='font-semibold text-primary'>Fax</p>
                    <p>(949) 650-9489</p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <span className='text-secondary text-xl mt-1'>✉️</span>
                  <div>
                    <p className='font-semibold text-primary'>Email</p>
                    <a href='mailto:info@stmaryarmenianchurch.com' className='hover:text-secondary'>
                      info@stmaryarmenianchurch.com
                    </a>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <span className='text-secondary text-xl mt-1'>🕐</span>
                  <div>
                    <p className='font-semibold text-primary'>Office Hours</p>
                    <p>Monday – Friday: 9:00 AM – 5:00 PM</p>
                  </div>
                </div>
              </div>

              <div className='mt-8'>
                <p className='font-semibold text-primary mb-3'>Follow Us</p>
                <div className='flex gap-4'>
                  <a
                    href='https://m.facebook.com/profile.php?id=100064722127342'
                    target='_blank'
                    rel='noreferrer'
                    className='bg-[#1877F2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:brightness-90 transition'
                  >
                    Facebook
                  </a>
                </div>
              </div>

              {/* Map Embed */}
              <div className='mt-8 rounded-2xl overflow-hidden'>
                <iframe
                  src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3313.0!2d-117.9028!3d33.6492!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80dcde3a5a5a5a5a%3A0x1!2s148+22nd+St%2C+Costa+Mesa%2C+CA+92627!5e0!3m2!1sen!2sus!4v1'
                  width='100%'
                  height='250'
                  style={{ border: 0 }}
                  allowFullScreen
                  loading='lazy'
                  referrerPolicy='no-referrer-when-downgrade'
                  title='St. Mary Armenian Apostolic Church Location'
                />
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <p className='text-secondary font-cursive text-2xl mb-2'>Drop Us a Line</p>
              <h2 className='text-primary font-secondary font-bold text-2xl mb-6'>Send a Message</h2>

              {status === 'success' ? (
                <div className='bg-green-50 border border-green-200 rounded-2xl p-8 text-center'>
                  <p className='text-green-700 font-semibold text-lg mb-2'>Message Sent!</p>
                  <p className='text-green-600 text-sm'>Thank you for reaching out. We&apos;ll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-4'>
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
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Subject</label>
                    <input
                      type='text'
                      name='subject'
                      className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Message *</label>
                    <textarea
                      name='message'
                      rows={5}
                      required
                      className='w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary'
                    />
                  </div>
                  {status === 'error' && (
                    <p className='text-red-600 text-sm'>Something went wrong. Please try again or email us directly.</p>
                  )}
                  <Button type='submit' className='!w-full' disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : 'Send Message'}
                  </Button>
                </form>
              )}

              <div className='mt-8 bg-[#FFF2EE] rounded-2xl p-6'>
                <h3 className='font-secondary font-semibold text-primary text-lg mb-2'>
                  Facility Rental Inquiries
                </h3>
                <p className='text-gray-600 text-sm mb-3'>
                  Interested in renting the Stambolian Family Hall or Barsam Hall for your event?
                </p>
                <a href='/facilities#rental-inquiry'>
                  <Button className='!w-full !bg-transparent !text-primary !border-primary !border-2 hover:!bg-primary hover:!text-white'>
                    Rental Inquiry Form
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
