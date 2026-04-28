import MainLayout from '@/components/layout/MainLayout';
import CartClient from './CartClient';

export const metadata = { title: 'Shopping Cart' };

export default function CartPage() {
  return (
    <MainLayout>
      <CartClient />
    </MainLayout>
  );
}
