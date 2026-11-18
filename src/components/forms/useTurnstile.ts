import { useEffect, useRef, useState } from 'react';

/** Cloudflare Turnstile ("verify you are human"); off when no site key is configured. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
    __stmTurnstileReady?: () => void;
  }
}

/** Loads Cloudflare Turnstile when a site key is configured. Put `ref` on an empty div. */
export function useTurnstile() {
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string>();
  const [token, setToken] = useState('');

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    const render = () => {
      if (!ref.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      });
    };
    if (window.turnstile) return render();
    window.__stmTurnstileReady = render;
    if (!document.getElementById('cf-turnstile')) {
      const s = document.createElement('script');
      s.id = 'cf-turnstile';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__stmTurnstileReady';
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  return {
    ref,
    token,
    reset: () => {
      setToken('');
      if (widget.current) window.turnstile?.reset(widget.current);
    },
  };
}
