'use client';

import { useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function TurnstileCheck({
  onToken,
  resetRef,
}: {
  onToken: (token: string) => void;
  resetRef: { current: (() => void) | null };
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    let cancelled = false;

    const render = () => {
      if (cancelled || !hostRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(hostRef.current, {
        sitekey: SITE_KEY,
        theme: 'light',
        size: 'flexible',
        appearance: 'always',
        language: 'ja',
        callback: (token: string) => onTokenRef.current(token),
        'expired-callback': () => onTokenRef.current(''),
        'error-callback': () => onTokenRef.current(''),
      });
    };

    resetRef.current = () => {
      onTokenRef.current('');
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    };

    if (window.turnstile) {
      render();
    } else {
      const scriptId = 'cf-turnstile-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', render);
    }

    return () => {
      cancelled = true;
      resetRef.current = null;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [resetRef]);

  if (!SITE_KEY) return null;

  return <div ref={hostRef} style={{ marginTop: '0.75rem', width: '100%' }} />;
}
