import MainLayout from '@/components/layout/MainLayout';
import WishlistClient from './WishlistClient';

export const metadata = { title: 'My Wishlist | Arunas Baby World' };

export default function WishlistPage() {
  return (
    <MainLayout>
      <WishlistClient />
    </MainLayout>
  );
}