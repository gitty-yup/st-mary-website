import FullLoadLinks from '@/components/layout/FullLoadLinks';
import HeadElement from '@/components/layout/HeadElement';
import '@/styles/globals.css';
import '@/styles/backgrounds.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <HeadElement />
      <FullLoadLinks />
      <Component {...pageProps} />
    </>
  );
}
