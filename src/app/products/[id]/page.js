import MainLayout from '@/components/layout/MainLayout';
import ProductDetailClient from './ProductDetailClient';

// ✅ Await params
export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  return (
    <MainLayout>
      <ProductDetailClient id={id} />
    </MainLayout>
  );
}