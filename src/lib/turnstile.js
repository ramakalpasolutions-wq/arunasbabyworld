// Server-side check of a Cloudflare Turnstile (human verification) token.
//
// Real keys come from .env:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY=...   (shown in the browser)
//   TURNSTILE_SECRET_KEY=...             (server only)
// Until they are set, Cloudflare's public test keys are used. Those always pass,
// so the widget works but gives NO protection.

const TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

let warned = false;

export async function verifyCaptcha(token, remoteIp) {
  if (!token || typeof token !== 'string') return false;

  // Local development always uses the test key, matching the widget (see TurnstileWidget.js)
  let secret = process.env.NODE_ENV === 'development' ? TEST_SECRET_KEY : process.env.TURNSTILE_SECRET_KEY;
  if (process.env.NODE_ENV !== 'development' && !secret) {
    if (!warned) {
      console.warn('⚠️ TURNSTILE_SECRET_KEY is not set: using the Cloudflare test key (captcha always passes).');
      warned = true;
    }
  }
  if (!secret) secret = TEST_SECRET_KEY;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);

    const res = await fetch(VERIFY_URL, { method: 'POST', body, cache: 'no-store' });
    const data = await res.json();
    if (!data.success) {
      console.warn('Captcha rejected:', data['error-codes']);
    }
    return data.success === true;
  } catch (error) {
    console.error('Captcha verification failed:', error);
    return false;
  }
}

export function clientIp(headers) {
  const get = (name) =>
    typeof headers?.get === 'function' ? headers.get(name) : headers?.[name];
  const forwarded = get('x-forwarded-for');
  return (forwarded ? String(forwarded).split(',')[0].trim() : get('x-real-ip')) || undefined;
}
