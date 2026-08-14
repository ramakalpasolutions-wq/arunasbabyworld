import MainLayout from '@/components/layout/MainLayout';
import ProductsClient from './ProductsClient';
import { Suspense } from 'react';

export const metadata = {
  title: 'All Products',
  description: 'Browse our complete range of baby & kids products'
};

export default function ProductsPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductsClient />
      </Suspense>
    </MainLayout>
  );
}