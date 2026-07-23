import MainLayout from '@/components/layout/MainLayout';
import ExchangeRequestClient from './ExchangeRequestClient';

export const metadata = { title: 'Exchange Product | Arunas Baby World' };

export default async function ExchangeRequestPage({ params }) {
  const { id } = await params;

  return (
    <MainLayout>
      <ExchangeRequestClient id={id} />
    </MainLayout>
  );
}