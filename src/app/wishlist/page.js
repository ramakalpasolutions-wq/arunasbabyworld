import MainLayout from '@/components/layout/MainLayout';
import WishlistClient from './WishlistClient';

export const metadata = { title: 'My Wishlist | BabyBliss' };

export default function WishlistPage() {
  return (
    <MainLayout>
      <WishlistClient />
    </MainLayout>
  );
}