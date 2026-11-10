import MainLayout from '@/components/layout/MainLayout';
import CheckoutClient from './CheckoutClient';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Checkout');

export default function CheckoutPage() {
  return <MainLayout><CheckoutClient /></MainLayout>;
}
