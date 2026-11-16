'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function PageTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userId = session?.user?.id || null;

  // One visit per page: wait for the session to resolve instead of firing
  // once while it loads and again when it arrives.
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || status === 'loading') return;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        userId,
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.sessionId && !document.cookie.includes('store_session')) {
          document.cookie = `store_session=${data.sessionId}; path=/; max-age=86400`;
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, status === 'loading']);

  return null;
}