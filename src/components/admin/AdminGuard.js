'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminGuard({ children }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    // ✅ Allow admin login page freely
    if (pathname === '/admin/login') return;

    // ✅ Not admin — redirect to admin login
    if (!session || session.user.role !== 'admin') {
      router.replace('/admin/login');
    }
  }, [session, status, router, pathname]);

  // Loading spinner
  if (status === 'loading') return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: '#06060f',
    }}>
      <div style={{
        width: '44px', height: '44px',
        border: '4px solid rgba(255,107,53,0.2)',
        borderTop: '4px solid #FF6B35',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ✅ Admin login page — show freely
  if (pathname === '/admin/login') return children;

  // ✅ Not admin — show nothing
  if (!session || session.user.role !== 'admin') return null;

  // ✅ Admin confirmed
  return children;
}