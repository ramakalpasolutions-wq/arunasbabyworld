import MainLayout from '@/components/layout/MainLayout';
import RefundsHistoryClient from './RefundsHistoryClient';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('My Refunds');

export default function MyRefundsPage() {
  return (
    <MainLayout>
      <RefundsHistoryClient />
    </MainLayout>
  );
}