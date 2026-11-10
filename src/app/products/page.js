import MainLayout from '@/components/layout/MainLayout';
import ProductsClient from './ProductsClient';
import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { pageMetadata, JsonLd, absoluteUrl, cleanText, SITE_NAME } from '@/lib/seo';

// Finds the category named in ?category= (slug, name or old database ID)
async function findCategory(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const select = { id: true, name: true, slug: true, description: true, banner: true };

  try {
    if (/^[a-f0-9]{24}$/i.test(raw)) {
      return await prisma.category.findUnique({ where: { id: raw }, select });
    }
    const slug = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return (
      (await prisma.category.findFirst({ where: { slug }, select })) ||
      (await prisma.category.findFirst({
        where: { name: { equals: raw, mode: 'insensitive' } },
        select,
      }))
    );
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const category = await findCategory(params?.category);
  const search = typeof params?.search === 'string' ? params.search.trim() : '';

  // Search result pages are endless variations: keep them out of the index
  if (search) {
    return pageMetadata({
      title: `Search results for "${search.slice(0, 60)}"`,
      description: `Baby and kids products matching "${search.slice(0, 60)}" at ${SITE_NAME}.`,
      path: '/products',
      index: false,
    });
  }

  if (category) {
    return pageMetadata({
      title: `${category.name} for Babies & Kids - Buy Online`,
      description:
        cleanText(category.description) ||
        `Shop ${category.name} for babies and kids online at ${SITE_NAME}. Trusted brands, great prices and fast delivery across India.`,
      path: `/products?category=${category.slug}`,
      image: category.banner?.url || undefined,
      keywords: [category.name, `${category.name} online`, `buy ${category.name}`, SITE_NAME],
    });
  }

  if (params?.trending === 'true') {
    return pageMetadata({
      title: 'Trending Baby & Kids Products',
      description: `See what parents are buying right now: trending baby and kids products at ${SITE_NAME}.`,
      path: '/products?trending=true',
    });
  }

  if (params?.featured === 'true') {
    return pageMetadata({
      title: 'Featured Baby & Kids Products',
      description: `Hand-picked baby and kids products featured at ${SITE_NAME}.`,
      path: '/products?featured=true',
    });
  }

  return pageMetadata({
    title: 'All Baby & Kids Products - Shop Online',
    description: `Browse the complete range of baby and kids products at ${SITE_NAME}: clothing, toys, baby gear, feeding, bath and skin care, strollers, cradles and more.`,
    path: '/products',
  });
}

// Structured data so search engines see the breadcrumb and the products on the page
async function getListingJsonLd(category) {
  let products = [];
  try {
    products = await prisma.product.findMany({
      where: { isActive: true, ...(category ? { categoryId: category.id } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 24,
      select: { name: true, slug: true, id: true },
    });
  } catch {
    products = [];
  }

  const listUrl = category ? `/products?category=${category.slug}` : '/products';
  const crumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
    ...(category ? [{ name: category.name, url: listUrl }] : []),
  ];

  return [
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
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: category ? category.name : 'All Products',
      url: absoluteUrl(listUrl),
      numberOfItems: products.length,
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: absoluteUrl(`/products/${p.slug || p.id}`),
      })),
    },
  ];
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const category = await findCategory(params?.category);
  const jsonLd = params?.search ? null : await getListingJsonLd(category);

  return (
    <MainLayout>
      {jsonLd && <JsonLd data={jsonLd} />}
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductsClient />
      </Suspense>
    </MainLayout>
  );
}
