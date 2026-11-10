import MainLayout from '@/components/layout/MainLayout';
import CartClient from './CartClient';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Shopping Cart');

export default function CartPage() {
  return (
    <MainLayout>
      <CartClient />
    </MainLayout>
  );
}
