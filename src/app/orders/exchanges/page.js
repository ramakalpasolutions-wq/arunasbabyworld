import MainLayout from '@/components/layout/MainLayout';
import ExchangesHistoryClient from './ExchangesHistoryClient';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('My Exchanges');

export default function MyExchangesPage() {
  return (
    <MainLayout>
      <ExchangesHistoryClient />
    </MainLayout>
  );
}