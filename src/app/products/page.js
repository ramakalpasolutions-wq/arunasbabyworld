import MainLayout from '@/components/layout/MainLayout';
import ProductsClient from './ProductsClient';

export const metadata = { title: 'All Products', description: 'Browse our complete range of baby & kids products' };

export default function ProductsPage() {
  return (
    <MainLayout>
      <ProductsClient />
    </MainLayout>
  );
}
