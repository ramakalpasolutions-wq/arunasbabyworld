import MainLayout from '@/components/layout/MainLayout';
import CheckoutClient from './CheckoutClient';

export const metadata = { title: 'Checkout' };

export default function CheckoutPage() {
  return <MainLayout><CheckoutClient /></MainLayout>;
}
