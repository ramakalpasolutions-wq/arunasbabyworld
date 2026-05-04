import { Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProfileClient from './ProfileClient';

export const metadata = {
  title: 'My Profile | BabyBliss',
};

export default function ProfilePage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{
            width: '40px', height: '40px',
            border: '4px solid #fce4ec',
            borderTop: '4px solid #ff6b9d',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: '#888' }}>Loading profile...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }>
        <ProfileClient />
      </Suspense>
    </MainLayout>
  );
}