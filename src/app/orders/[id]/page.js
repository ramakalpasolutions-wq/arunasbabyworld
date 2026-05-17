import MainLayout from '@/components/layout/MainLayout';
import OrderDetailClient from './OrderDetailClient';

export const metadata = { title: 'Order Details | BabyBliss' };

export default async function OrderDetailPage({ params }) {
  const { id } = await params;

  return (
    <MainLayout>
      <OrderDetailClient id={id} />
    </MainLayout>
  );
} 