import Head from 'next/head';
import React from 'react';

const SITE_URL = 'https://stmaryarmenianchurch.com';

function HeadElement({
  pageTitle = 'St. Mary Armenian Apostolic Church — Costa Mesa, CA',
  description = 'St. Mary Armenian Apostolic Church in Costa Mesa, California. Join us for Sunday Badarak at 10:30 AM. Serving the Armenian community of Orange County since 1985.',
  noIndex = false,
}: {
  pageTitle?: string;
  description?: string;
  noIndex?: boolean;
}) {
  return (
    <Head>
      <meta charSet='utf-8' />
      <link rel='icon' href='/favicon.ico' />
      <meta name='viewport' content='width=device-width, initial-scale=1' />
      <meta name='theme-color' content='#002F72' />

      <title>{pageTitle}</title>
      <meta name='title' content={pageTitle} />
      <meta name='description' content={description} />

      <meta property='og:url' content={SITE_URL} />
      <meta property='og:type' content='website' />
      <meta property='og:title' content={pageTitle} />
      <meta property='og:description' content={description} />

      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={pageTitle} />
      <meta name='twitter:description' content={description} />

      {noIndex && <meta name='robots' content='noindex' />}
    </Head>
  );
}

export default HeadElement;
