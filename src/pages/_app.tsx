import HeadElement from '@/components/layout/HeadElement';
import { store } from '@/store/store';
import '@/styles/globals.css';
import '@/styles/backgrounds.css';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <HeadElement />
      <Component {...pageProps} />
    </Provider>
  );
}
