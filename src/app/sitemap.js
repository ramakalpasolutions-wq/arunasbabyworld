import prisma from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo';
import { getSearchIndex } from '@/lib/search';
import { isRealBrand } from '@/lib/categorySeo';

// Served at /sitemap.xml; rebuilt at most once an hour
export const revalidate = 3600;

// Date the legal and info pages last changed (see POLICY_UPDATED in src/lib/policies.js)
const INFO_PAGES_UPDATED = new Date('2026-11-10');

// Image URLs must be absolute and XML-safe
const imageUrl = (u) => (u ? encodeURI(u.startsWith('http') ? u : `${SITE_URL}${u}`).replace(/&/g, '&amp;') : null);

export default async function sitemap() {
  const now = new Date();

  const staticPages = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...['/about', '/contact'].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: INFO_PAGES_UPDATED, changeFrequency: 'monthly', priority: 0.5 })),
    ...['/terms', '/privacy', '/refund-policy', '/shipping-policy'].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: INFO_PAGES_UPDATED, changeFrequency: 'yearly', priority: 0.3 })),
  ];

  let categories = [];
  let products = [];
  let brandPages = [];

  try {
    const [cats, prods, idx] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, slug: true, updatedAt: true, images: true, colorVariants: true },
        orderBy: { updatedAt: 'desc' },
      }),
      getSearchIndex(),
    ]);
    products = prods;

    // Only categories with products, and brands with at least 3 products, are worth indexing
    const catCounts = new Map();
    const brandCounts = new Map();
    for (const d of idx.docs) {
      catCounts.set(d.categoryId, (catCounts.get(d.categoryId) || 0) + 1);
      if (d.brandKey) brandCounts.set(d.brandKey, (brandCounts.get(d.brandKey) || 0) + 1);
    }
    categories = cats.filter((c) => catCounts.get(c.id));
    brandPages = [...brandCounts.entries()]
      .filter(([, n]) => n >= 3)
      .map(([k]) => idx.brandLabels.get(k))
      .filter(isRealBrand);
  } catch (error) {
    console.error('Sitemap: could not load catalog', error);
  }

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: `${SITE_URL}/products?category=${encodeURIComponent(c.slug)}`,
      lastModified: c.updatedAt,
      changeFrequency: 'daily',
      priority: 0.8,
    })),
    ...brandPages.map((b) => ({
      url: `${SITE_URL}/products?brand=${encodeURIComponent(b)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    })),
    ...products.map((p) => {
      const imgs = [
        ...(p.images || []).map((i) => i?.url),
        ...(p.colorVariants || []).flatMap((v) => (v.images || []).map((i) => i?.url)),
      ].filter(Boolean);
      return {
        url: `${SITE_URL}/products/${encodeURIComponent(p.slug || p.id)}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
        images: [...new Set(imgs)].slice(0, 3).map(imageUrl).filter(Boolean),
      };
    }),
  ];
}
