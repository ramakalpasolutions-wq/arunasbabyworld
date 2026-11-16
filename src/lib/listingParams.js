// Turns the /products page URL into the /api/products query.
// Shared by the server render and ProductsClient so both load exactly the same first page.

export const LISTING_PAGE_SIZE = 24;

const FILTER_KEYS = ['category', 'brand', 'gender', 'featured', 'trending', 'discount', 'rating'];

/** @param {{ get(key: string): string | null }} sp URLSearchParams or the same shape */
export function listingQuery(sp, page = 1) {
  const search = (sp.get('search') || '').trim();
  const sort = sp.get('sort') || (search ? 'relevance' : 'createdAt-desc');
  const [sortField, sortOrder = 'desc'] = sort.split('-');

  const q = new URLSearchParams({
    page: String(page),
    limit: String(LISTING_PAGE_SIZE),
    sort: sortField,
    order: sortOrder,
  });
  if (search) q.set('search', search);
  for (const key of FILTER_KEYS) {
    const v = sp.get(key);
    if (v) q.set(key, v);
  }
  if (sp.get('inStock') === 'true') q.set('inStock', 'true');

  let minP = sp.get('minPrice') ? parseFloat(sp.get('minPrice')) : null;
  let maxP = sp.get('maxPrice') ? parseFloat(sp.get('maxPrice')) : null;
  if (Number.isNaN(minP)) minP = null;
  if (Number.isNaN(maxP)) maxP = null;
  if (minP !== null && maxP !== null && minP > maxP) [minP, maxP] = [maxP, minP];
  if (minP !== null) q.set('minPrice', String(minP));
  if (maxP !== null) q.set('maxPrice', String(maxP));
  return q;
}

/** Turns a Next.js `searchParams` object into URLSearchParams. */
export function toSearchParams(params = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else if (v !== undefined && v !== null) sp.set(k, String(v));
  }
  return sp;
}
