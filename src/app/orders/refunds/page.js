import MainLayout from '@/components/layout/MainLayout';
import RefundsHistoryClient from './RefundsHistoryClient';

export const metadata = { title: 'My Refunds | BabyBliss' };

export default function MyRefundsPage() {
  return (
    <MainLayout>
      <RefundsHistoryClient />
    </MainLayout>
  );
}