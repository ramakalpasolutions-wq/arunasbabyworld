// Category list shared by /api/categories and server-rendered pages.
import prisma from '@/lib/prisma';
import { getSearchIndex } from '@/lib/search';

// Fixed display order for the original categories; others follow alphabetically
export const PREDEFINED_SLUGS = [
  'clothing',
  'personal-care',
  'health-care',
  'baby-gear',
  'walkers',
  'toys',
  'cradles-cribs',
  'electric-vehicles',
  'food',
];

export function sortByOrder(cats) {
  return [...cats].sort((a, b) => {
    const aIdx = PREDEFINED_SLUGS.indexOf(a.slug);
    const bIdx = PREDEFINED_SLUGS.indexOf(b.slug);
    const aOrder = aIdx === -1 ? 999 : aIdx;
    const bOrder = bIdx === -1 ? 999 : bIdx;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Categories in display order; with `withCount`, each gets `productCount`
 * from the cached catalog index (no query per category).
 */
export async function getCategories({ all = false, withCount = false } = {}) {
  const categories = await prisma.category.findMany({
    where: all ? {} : { isActive: true },
    orderBy: { order: 'asc' },
  });
  const sorted = sortByOrder(categories);
  if (!withCount) return sorted;

  const idx = await getSearchIndex();
  const counts = new Map();
  for (const d of idx.docs) counts.set(d.categoryId, (counts.get(d.categoryId) || 0) + 1);
  return sorted.map((cat) => ({ ...cat, productCount: counts.get(cat.id) || 0 }));
}
