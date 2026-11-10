
import MainLayout from '@/components/layout/MainLayout';
import ProductDetailClient from './ProductDetailClient';
import { cache } from 'react';
import { permanentRedirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { JsonLd, absoluteUrl, SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo';

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

// The URL segment is the product slug; old links that carry the database ID still work
const getProduct = cache(async (idOrSlug) => {
  const key = decodeURIComponent(String(idOrSlug || '')).trim();
  if (!key) return null;

  if (/^[a-f0-9]{24}$/i.test(key)) {
    const byId = await prisma.product.findUnique({
      where: { id: key },
      include: { category: { select: { name: true, slug: true } } },
    });
    if (byId) return byId;
  }

  return prisma.product.findUnique({
    where: { slug: key },
    include: { category: { select: { name: true, slug: true } } },
  });
});

// ================================================
// DYNAMIC PRODUCT SEO METADATA
// ================================================

function productImages(product) {
  const urls = [
    ...(product.images || []).map((img) => img?.url),
    ...(product.colorVariants || []).flatMap((v) => (v.images || []).map((img) => img?.url)),
  ].filter(Boolean);
  return [...new Set(urls)].slice(0, 6);
}

// Long marketplace-style names are cut at the first " | " so titles stay readable in search results
function shortName(name) {
  const first = String(name || '').split(' | ')[0].trim();
  return first.length > 70 ? `${first.slice(0, 69).replace(/\s+\S*$/, '')}…` : first;
}

export async function generateMetadata({ params }) {
  const { id } = await params;

  const product = await getProduct(id);

  if (!product || !product.isActive) {
    return {
      title: 'Product Not Found',
      description: 'This product is not available.',
      robots: { index: false, follow: false },
    };
  }

  const title = shortName(product.name);
  const price = product.discountPrice || product.price;

  const description =
    cleanDescription(product.shortDescription || product.description) ||
    `Buy ${title} online at ${SITE_NAME}${price ? ` for ₹${price}` : ''}. Trusted baby and kids products with fast delivery across India.`;

  const productPath = `/products/${product.slug || product.id}`;
  const images = productImages(product);

  return {
    title,
    description,
    keywords: [
      title,
      product.brand,
      product.category?.name,
      ...(product.tags || []).slice(0, 8),
    ].filter(Boolean),
    alternates: { canonical: productPath },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: productPath,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      // Converted to a 1200x630 JPEG so WhatsApp and other apps show a preview picture
      images: [
        images.length
          ? { url: `/og/product/${product.id}`, width: 1200, height: 630, type: 'image/jpeg', alt: product.name }
          : { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, type: 'image/jpeg', alt: SITE_NAME },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [images.length ? `/og/product/${product.id}` : DEFAULT_OG_IMAGE],
    },
  };
}

// ================================================
// PRODUCT STRUCTURED DATA (rich results: price, stock, rating)
// ================================================

function productJsonLd(product) {
  const url = absoluteUrl(`/products/${product.slug || product.id}`);
  const price = product.discountPrice || product.price;
  const images = productImages(product);

  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    ...(product.category
      ? [{ name: product.category.name, url: `/products?category=${product.category.slug}` }]
      : []),
    { name: shortName(product.name), url: `/products/${product.slug || product.id}` },
  ];

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: cleanDescription(product.shortDescription || product.description) || product.name,
      url,
      ...(images.length ? { image: images } : {}),
      ...(product.sku ? { sku: product.sku } : {}),
      ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
      ...(product.category ? { category: product.category.name } : {}),
      ...(product.numReviews > 0 && product.rating > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: Number(product.rating.toFixed(1)),
              reviewCount: product.numReviews,
            },
          }
        : {}),
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'INR',
        price: Number(price || 0),
        availability:
          product.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: SITE_NAME },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: absoluteUrl(c.url),
      })),
    },
  ];
}

// ================================================
// PRODUCT DETAIL PAGE
// ================================================

export default async function ProductDetailPage({ params }) {
  const { id } = await params;

  const product = await getProduct(id);

  // Unknown products return a real 404 instead of an empty page
  if (!product) notFound();

  // Opened with the database ID: send the visitor to the readable URL
  if (product.slug && decodeURIComponent(id) !== product.slug) {
    permanentRedirect(`/products/${product.slug}`);
  }

  return (
    <MainLayout>
      {product.isActive && <JsonLd data={productJsonLd(product)} />}
      <ProductDetailClient id={product.id} />
    </MainLayout>
  );
}
