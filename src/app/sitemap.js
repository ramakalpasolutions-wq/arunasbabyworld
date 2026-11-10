import prisma from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo';

// Served at /sitemap.xml; rebuilt at most once an hour
export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();

  const staticPages = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/track-order`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  let categories = [];
  let products = [];

  try {
    [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);
  } catch (error) {
    console.error('Sitemap: could not load categories/products', error);
  }

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${SITE_URL}/products?category=${encodeURIComponent(c.slug)}`,
      lastModified: c.updatedAt,
      changeFrequency: 'daily',
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${encodeURIComponent(p.slug || p.id)}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
  ];
}
