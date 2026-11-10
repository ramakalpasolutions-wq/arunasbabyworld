import MainLayout from '@/components/layout/MainLayout';
import WishlistClient from './WishlistClient';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('My Wishlist');

export default function WishlistPage() {
  return (
    <MainLayout>
      <WishlistClient />
    </MainLayout>
  );
}