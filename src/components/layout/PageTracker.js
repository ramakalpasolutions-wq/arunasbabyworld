'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function PageTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        userId: session?.user?.id || null
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.sessionId && !document.cookie.includes('store_session')) {
          document.cookie = `store_session=${data.sessionId}; path=/; max-age=86400`;
        }
      })
      .catch(() => {});
  }, [pathname, session]);

  return null;
}