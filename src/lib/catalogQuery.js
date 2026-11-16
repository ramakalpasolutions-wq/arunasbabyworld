/**
 * Shared catalog query pipeline used by /api/products and /api/products/brands.
 * Filters, searches, sorts and paginates over the in-memory search index,
 * so pagination covers the whole catalog and sorting uses the selling price.
 */
import prisma from '@/lib/prisma';
import { getSearchIndex, rankDocs, brandKey } from '@/lib/search';

const NO_MATCH = '000000000000000000000000';

/** Resolve a category param (id, slug or name) to a category id. */
export async function resolveCategoryId(category) {
  if (!category) return null;
  if (/^[a-f\d]{24}$/i.test(category)) return category;

  const raw = category.trim();
  const normalized = raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const tries = [
    { slug: normalized },
    { name: { equals: raw, mode: 'insensitive' } },
    { slug: { contains: normalized, mode: 'insensitive' } },
    { name: { contains: raw, mode: 'insensitive' } },
  ];
  const firstWord = raw.split(/\s+/)[0]?.toLowerCase();
  if (firstWord && firstWord.length >= 4) {
    tries.push({ OR: [
      { slug: { contains: firstWord, mode: 'insensitive' } },
      { name: { contains: firstWord, mode: 'insensitive' } },
    ] });
  }
  for (const where of tries) {
    const cat = await prisma.category.findFirst({ where: { ...where, isActive: true }, select: { id: true } });
    if (cat) return cat.id;
  }
  return NO_MATCH;
}

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * @param {URLSearchParams} sp
 * @param {{ ignoreBrand?: boolean }} opts
 */
export async function queryCatalog(sp, { ignoreBrand = false } = {}) {
  const idx = await getSearchIndex();

  const search = (sp.get('search') || '').trim().slice(0, 100);
  const brand = ignoreBrand ? '' : (sp.get('brand') || '').trim();
  const gender = (sp.get('gender') || '').trim().toLowerCase();
  const discount = num(sp.get('discount'));
  const rating = num(sp.get('rating'));
  const inStock = sp.get('inStock') === 'true';
  const featured = sp.get('featured') === 'true';
  const trending = sp.get('trending') === 'true';
  let minPrice = num(sp.get('minPrice'));
  let maxPrice = num(sp.get('maxPrice'));
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice];
  const categoryId = await resolveCategoryId(sp.get('category'));

  const bKey = brandKey(brand);
  let docs = idx.docs.filter((d) =>
    (!featured || d.isFeatured) &&
    (!trending || d.isTrending) &&
    (!bKey || d.brandKey === bKey) &&
    (!gender || d.gender === gender) &&
    (!discount || discount <= 0 || d.discountPercent >= discount) &&
    (!rating || rating <= 0 || d.rating >= rating) &&
    (!inStock || d.stock > 0) &&
    (minPrice === null || d.effPrice >= minPrice) &&
    (maxPrice === null || d.effPrice <= maxPrice) &&
    (!categoryId || d.categoryId === categoryId)
  );

  let correctedQuery = null;
  let relaxed = false;
  let scores = null;
  if (search) {
    const result = rankDocs(idx, docs, search, { mode: 'full' });
    docs = result.ranked.map((r) => r.doc);
    scores = result.ranked;
    correctedQuery = result.correctedQuery;
    relaxed = result.relaxed;
  }

  return { idx, docs, search, scores, correctedQuery, relaxed };
}

const SORTERS = {
  createdAt: (a, b) => a.createdAt - b.createdAt,
  price: (a, b) => a.effPrice - b.effPrice,
  discountPercent: (a, b) => a.discountPercent - b.discountPercent || a.createdAt - b.createdAt,
  rating: (a, b) => a.rating - b.rating || a.numReviews - b.numReviews,
  name: (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
};

/** Sort (relevance when searching unless another sort is chosen) + in-stock first. */
export function sortDocs(docs, sp, { searching }) {
  const sortParam = sp.get('sort') || (searching ? 'relevance' : 'createdAt');
  const order = sp.get('order') === 'asc' ? 'asc' : 'desc';
  let out = docs;

  if (!(searching && (sortParam === 'relevance' || !SORTERS[sortParam]))) {
    const cmp = SORTERS[sortParam] || SORTERS.createdAt;
    const dir = SORTERS[sortParam] ? order : 'desc';
    out = [...docs].sort((a, b) => (dir === 'asc' ? cmp(a, b) : cmp(b, a)));
  }

  if (sp.get('inStock') !== 'true') {
    out = [...out.filter((d) => d.stock > 0), ...out.filter((d) => d.stock <= 0)];
  }
  return out;
}

export function pageParams(sp, { defLimit = 12, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(sp.get('limit') || String(defLimit), 10) || defLimit));
  return { page, limit };
}

/**
 * Full listing: filter + search + sort + paginate, then load the visible page's
 * full product documents. Used by /api/products and by server-rendered pages.
 * @param {URLSearchParams} sp
 */
export async function listProducts(sp) {
  const { page, limit } = pageParams(sp);
  const { docs, search, correctedQuery, relaxed } = await queryCatalog(sp);
  const sorted = sortDocs(docs, sp, { searching: !!search });

  const total = sorted.length;
  const pageIds = sorted.slice((page - 1) * limit, page * limit).map((d) => d.id);

  const rows = pageIds.length
    ? await prisma.product.findMany({
        where: { id: { in: pageIds }, isActive: true },
        include: { category: { select: { id: true, name: true, slug: true } } },
      })
    : [];
  const byId = new Map(rows.map((p) => [p.id, p]));
  const products = pageIds.map((id) => byId.get(id)).filter(Boolean);

  return {
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    matchingCategories: search ? new Set(sorted.map((d) => d.categoryId)).size : undefined,
    ...(search && { correctedQuery, relaxed }),
  };
}
