import MainLayout from '@/components/layout/MainLayout';
import ExchangesHistoryClient from './ExchangesHistoryClient';

export const metadata = { title: 'My Exchanges | Arunas Baby World' };

export default function MyExchangesPage() {
  return (
    <MainLayout>
      <ExchangesHistoryClient />
    </MainLayout>
  );
}