import MainLayout from '@/components/layout/MainLayout';
import ExchangesHistoryClient from './ExchangesHistoryClient';

export const metadata = { title: 'My Exchanges | Aruna's Baby World' };

export default function MyExchangesPage() {
  return (
    <MainLayout>
      <ExchangesHistoryClient />
    </MainLayout>
  );
}