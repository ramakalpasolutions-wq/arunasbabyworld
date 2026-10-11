
import MainLayout from '@/components/layout/MainLayout';
import ProductDetailClient from './ProductDetailClient';
import prisma from '@/lib/prisma';

const SITE_URL = 'https://www.arunasbabyworld.com';

// ================================================
// HELPERS
// ================================================

function cleanDescription(value) {
  if (!value) return '';

  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

async function getProduct(id) {
  // Prisma MongoDB ObjectId validation
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return null;
  }

  return prisma.product.findUnique({
    where: { id },
  });
}

// ================================================
// DYNAMIC PRODUCT SEO METADATA
// ================================================

export async function generateMetadata({ params }) {
  const { id } = await params;

  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'This product is not available.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const productName = product.name;

  const description =
    cleanDescription(
      product.shortDescription || product.description
    ) ||
    `Shop ${productName} online at Arunas Baby World. Explore baby products, clothing, toys and more.`;

  const productUrl = `${SITE_URL}/products/${id}`;

  // Product image or first available variant image
  const imageUrl =
    product.images?.[0]?.url ||
    product.colorVariants?.[0]?.images?.[0]?.url ||
    null;

  const images = imageUrl
    ? [
        {
          url: imageUrl,
          alt: productName,
        },
      ]
    : [];

  return {
    title: productName,
    description,

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      title: `${productName} | Arunas Baby World`,
      description,
      url: productUrl,
      siteName: 'Arunas Baby World',
      type: 'website',
      images,
    },

    twitter: {
      card: 'summary_large_image',
      title: `${productName} | Arunas Baby World`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

// ================================================
// PRODUCT DETAIL PAGE
// ================================================

export default async function ProductDetailPage({ params }) {
  const { id } = await params;

  return (
    <MainLayout>
      <ProductDetailClient id={id} />
    </MainLayout>
  );
}
