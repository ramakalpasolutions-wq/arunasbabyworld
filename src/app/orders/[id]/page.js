import MainLayout from '@/components/layout/MainLayout';
import OrderDetailClient from './OrderDetailClient';

export const metadata = { title: 'Order Details' };

export default function OrderDetailPage({ params }) {
  return (
    <MainLayout>
      <OrderDetailClient id={params.id} />
    </MainLayout>
  );
}
