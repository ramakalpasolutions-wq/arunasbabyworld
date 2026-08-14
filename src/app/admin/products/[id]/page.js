import ProductForm from '../ProductForm';

export const metadata = { title: 'Edit Product' };

// ✅ Await params
export default async function EditProductPage({ params }) {
  const { id } = await params;
  return <ProductForm id={id} />;
}