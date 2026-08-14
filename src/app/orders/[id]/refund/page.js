import MainLayout from '@/components/layout/MainLayout';
import RefundRequestClient from './RefundRequestClient';

export const metadata = { title: 'Request Refund | Arunas Baby World' };

export default async function RefundRequestPage({ params }) {
  const { id } = await params;

  return (
    <MainLayout>
      <RefundRequestClient id={id} />
    </MainLayout>
  );
}