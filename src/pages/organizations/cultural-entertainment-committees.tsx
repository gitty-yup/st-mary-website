import OrganizationPage from '@/components/OrganizationPage';
import React from 'react';

const officers = [
  { role: 'Chair', name: 'Dr. Nazeli Daphne Saharyildizi' },
  { role: 'Treasurer', name: 'Anet Özdere' },
  { role: 'Assistant Treasurer', name: 'Ani Özdere' },
];

const members = ['Jim Yogurtian', 'Haig Altunian'];

export default function CulturalEntertainmentCommitteesPage() {
  return (
    <OrganizationPage
      name='Cultural and Entertainment Committees'
      tagline='Celebrating Armenian heritage and bringing our community together'
      sections={[
        {
          title: 'About Our Committee',
          content: (
            <>
              <p>
                The Cultural Committee of St. Mary Armenian Apostolic Church works to present and
                promote Armenian culture, heritage, and traditions — both past and present — through
                rich educational, engaging, and interactive events.
              </p>
              <p>
                Our aim is to spark the interest of church members, guests, and youth in the
                deep-rooted ancient Armenian culture, and to encourage them to further explore and
                deepen their knowledge of it.
              </p>
            </>
          ),
        },
        {
          title: 'Officers & Leadership',
          content: (
            <>
              <ul className='space-y-1'>
                {officers.map((o) => (
                  <li key={o.role}>
                    <strong>{o.role}:</strong> {o.name}
                  </li>
                ))}
              </ul>
              <p className='mt-4'>
                <strong>Members:</strong> {members.join(', ')}
              </p>
            </>
          ),
        },
        {
          title: 'Events & Activities',
          content: (
            <>
              <p>
                Throughout the year, the Cultural and Entertainment Committees bring Armenian culture
                to life through a variety of programs and gatherings, including:
              </p>
              <ul className='list-disc list-inside space-y-1'>
                <li>Lectures</li>
                <li>Musical programs</li>
                <li>Art exhibitions</li>
                <li>Fishermen&apos;s Night</li>
                <li>Our annual New Year&apos;s Eve party</li>
              </ul>
            </>
          ),
        },
      ]}
    />
  );
}
