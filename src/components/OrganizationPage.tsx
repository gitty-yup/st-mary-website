import AppLayout from '@/components/layout/AppLayout';
import Button from '@/common/Button';
import Link from 'next/link';
import React from 'react';

export interface OrgSection {
  title: string;
  content: React.ReactNode;
}

export interface OrgContact {
  email?: string;
  phone?: string;
  whatsapp?: string;
  signupForm?: string;
}

export interface OrgSocial {
  facebook?: string;
  instagram?: string;
}

export interface OrganizationPageProps {
  name: string;
  fullName?: string;
  tagline?: string;
  headerBgClass?: string;
  sections: OrgSection[];
  contact?: OrgContact;
  social?: OrgSocial;
}

export default function OrganizationPage({
  name,
  fullName,
  tagline,
  headerBgClass = 'parish-life-header-bg',
  sections,
  contact,
  social,
}: OrganizationPageProps) {
  return (
    <AppLayout>
      <header
        className={`${headerBgClass} px-primary h-[205px] md:h-[305px] flex flex-col items-center justify-center text-center gap-3 text-white`}
      >
        {fullName && fullName !== name && (
          <p className='font-cursive text-secondary text-2xl'>{fullName}</p>
        )}
        <h1 className='font-secondary font-bold text-2xl md:text-[32px] lg:text-[40px]'>
          {name}
        </h1>
        {tagline && <p className='font-normal text-lg max-w-2xl'>{tagline}</p>}
      </header>

      {sections.map((section, idx) => (
        <section
          key={section.title}
          className={`px-primary py-12 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FFF5F2]'}`}
        >
          <div className='max-w-3xl mx-auto'>
            <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>
              {section.title}
            </h2>
            <div className='text-gray-700 leading-relaxed space-y-4'>{section.content}</div>
          </div>
        </section>
      ))}

      {(contact || social) && (
        <section className={`px-primary py-12 ${sections.length % 2 === 0 ? 'bg-white' : 'bg-[#FFF5F2]'}`}>
          <div className='max-w-3xl mx-auto'>
            <h2 className='text-primary font-secondary font-bold text-2xl mb-4'>Connect With Us</h2>
            <div className='text-gray-700 leading-relaxed space-y-2'>
              {contact?.email && (
                <p>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${contact.email}`} className='text-secondary underline'>
                    {contact.email}
                  </a>
                </p>
              )}
              {contact?.phone && (
                <p>
                  <strong>Phone:</strong> {contact.phone}
                </p>
              )}
              {contact?.whatsapp && (
                <p>
                  <strong>WhatsApp Group:</strong>{' '}
                  <a
                    href={contact.whatsapp}
                    target='_blank'
                    rel='noreferrer'
                    className='text-secondary underline'
                  >
                    Join the chat
                  </a>
                </p>
              )}
              {contact?.signupForm && (
                <p>
                  <strong>Membership Sign-up:</strong>{' '}
                  <a
                    href={contact.signupForm}
                    target='_blank'
                    rel='noreferrer'
                    className='text-secondary underline'
                  >
                    Become a member
                  </a>
                </p>
              )}
              {social?.facebook && (
                <p>
                  <strong>Facebook:</strong>{' '}
                  <a
                    href={social.facebook}
                    target='_blank'
                    rel='noreferrer'
                    className='text-secondary underline'
                  >
                    Follow us
                  </a>
                </p>
              )}
              {social?.instagram && (
                <p>
                  <strong>Instagram:</strong>{' '}
                  <a
                    href={social.instagram}
                    target='_blank'
                    rel='noreferrer'
                    className='text-secondary underline'
                  >
                    Follow us
                  </a>
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className='px-primary py-12 bg-primary text-white text-center'>
        <h2 className='font-secondary font-bold text-2xl mb-4'>Want to learn more?</h2>
        <p className='text-gray-200 max-w-xl mx-auto mb-6'>
          Reach out to the parish office or come visit us on a Sunday — we&apos;d love to meet you.
        </p>
        <div className='flex gap-3 justify-center flex-wrap'>
          <Link href='/contact'>
            <Button className='!w-[200px] !bg-secondary !border-secondary hover:!brightness-90'>
              Contact Us
            </Button>
          </Link>
          <Link href='/parish-life'>
            <Button className='!w-[200px] !bg-transparent !border-white !border-2 hover:!bg-white hover:!text-primary'>
              All Ministries
            </Button>
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
