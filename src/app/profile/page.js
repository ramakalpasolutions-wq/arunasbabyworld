import { Suspense } from 'react';
import ProfileClient from './ProfileClient';

export const metadata = {
  title: 'My Profile | BabyBliss',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileClient />
    </Suspense>
  );
}