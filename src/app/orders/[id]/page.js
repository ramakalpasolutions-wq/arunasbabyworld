import MainLayout from '@/components/layout/MainLayout';
import OrderDetailClient from './OrderDetailClient';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Order Details');

export default async function OrderDetailPage({ params }) {
  const { id } = await params;

  return (
    <MainLayout>
      <OrderDetailClient id={id} />
    </MainLayout>
  );
} 