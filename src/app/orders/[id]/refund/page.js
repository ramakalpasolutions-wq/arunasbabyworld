import MainLayout from '@/components/layout/MainLayout';
import RefundRequestClient from './RefundRequestClient';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Request Refund');

export default async function RefundRequestPage({ params }) {
  const { id } = await params;

  return (
    <MainLayout>
      <RefundRequestClient id={id} />
    </MainLayout>
  );
}