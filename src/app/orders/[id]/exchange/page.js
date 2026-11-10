import MainLayout from '@/components/layout/MainLayout';
import ExchangeRequestClient from './ExchangeRequestClient';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Exchange Product');

export default async function ExchangeRequestPage({ params }) {
  const { id } = await params;

  return (
    <MainLayout>
      <ExchangeRequestClient id={id} />
    </MainLayout>
  );
}