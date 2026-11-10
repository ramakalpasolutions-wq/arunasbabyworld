'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Cloudflare Turnstile "verify you are human" box.
// Uses Cloudflare's public test key until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set in .env.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise = null;

function loadScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load the human verification check'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * onVerify(token) is called with a token when the check passes and with '' when it
 * expires or fails. Tokens work once: call ref.current.reset() after each submit.
 */
const TurnstileWidget = forwardRef(function TurnstileWidget(
  { onVerify, theme = 'light', className, style },
  ref
) {
  const boxRef = useRef(null);
  const widgetId = useRef(null);
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;

  useImperativeHandle(ref, () => ({
    reset() {
      onVerifyRef.current?.('');
      if (window.turnstile && widgetId.current !== null) {
        window.turnstile.reset(widgetId.current);
      }
    },
  }));

  useEffect(() => {
    let cancelled = false;

    loadScript()
      .then((turnstile) => {
        if (cancelled || !boxRef.current || widgetId.current !== null) return;
        widgetId.current = turnstile.render(boxRef.current, {
          sitekey: SITE_KEY,
          theme,
          callback: (token) => onVerifyRef.current?.(token),
          'expired-callback': () => onVerifyRef.current?.(''),
          'error-callback': () => onVerifyRef.current?.(''),
        });
      })
      .catch(() => onVerifyRef.current?.(''));

    return () => {
      cancelled = true;
      if (window.turnstile && widgetId.current !== null) {
        try { window.turnstile.remove(widgetId.current); } catch {}
        widgetId.current = null;
      }
    };
  }, [theme]);

  return (
    <div
      ref={boxRef}
      className={className}
      style={{ minHeight: 65, display: 'flex', justifyContent: 'center', ...style }}
      aria-label="Human verification"
    />
  );
});

export default TurnstileWidget;
