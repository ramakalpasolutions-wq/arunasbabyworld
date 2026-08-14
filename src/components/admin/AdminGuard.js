// src/components/admin/AdminGuard.js
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    console.log('🛡️ AdminGuard Check:', { status, session });

    // ✅ Wait for session to load
    if (status === 'loading') return;

    // ✅ Not authenticated → go to login
    if (status === 'unauthenticated') {
      console.log('❌ No session → redirecting to login');
      window.location.href = '/admin/login';
      return;
    }

    // ✅ Authenticated but check role
    if (status === 'authenticated') {
      if (!session?.user?.role) {
        console.log('❌ No role in session:', session);
        window.location.href = '/admin/login';
        return;
      }

      if (session.user.role !== 'admin') {
        console.log('❌ Not admin, role is:', session.user.role);
        window.location.href = '/';
        return;
      }

      console.log('✅ Admin verified!');
      setChecked(true);
    }

  }, [session, status]);

  // ── Show spinner during check ──
  if (status === 'loading' || !checked) {
    return <LoadingSpinner />;
  }

  return children;
}

function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#06060f',
      gap: '16px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid rgba(255,107,53,0.15)',
        borderTop: '4px solid #FF6B35',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{
        color: 'rgba(255,255,255,0.30)',
        fontSize: '0.84rem',
        fontFamily: 'Nunito, sans-serif',
        fontWeight: '600',
        margin: 0,
      }}>
        Verifying access...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}