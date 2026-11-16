import MainLayout from '@/components/layout/MainLayout';
import ProductsClient from './ProductsClient';
import CategorySeoContent from '@/components/seo/CategorySeoContent';
import { Suspense, cache } from 'react';
import prisma from '@/lib/prisma';
import { listProducts, queryCatalog } from '@/lib/catalogQuery';
import { getCategories } from '@/lib/categoryList';
import { getSearchIndex, brandKey } from '@/lib/search';
import { listingQuery, toSearchParams } from '@/lib/listingParams';
import { categorySeo, brandSeo, ALL_PRODUCTS_SEO, isRealBrand } from '@/lib/categorySeo';
import { pageMetadata, JsonLd, absoluteUrl, SITE_NAME } from '@/lib/seo';

// Finds the category named in ?category= (slug, name or old database ID)
const findCategory = cache(async (value) => {
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
});

// The brand's display label as stored in the catalog ("r for rabbit" -> "R for Rabbit"), or null
const findBrand = cache(async (value) => {
  if (!value) return null;
  try {
    const idx = await getSearchIndex();
    return idx.brandLabels.get(brandKey(value)) || null;
  } catch {
    return null;
  }
});

const str = (v) => (typeof v === 'string' ? v.trim() : '');

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const category = await findCategory(params?.category);
  const search = str(params?.search);
  const brand = await findBrand(str(params?.brand));

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
    const seo = categorySeo(category);
    // Filtered views (brand, price, sort...) point search engines at the main category page
    return pageMetadata({
      title: brand ? `${brand} ${seo.h1} Online in India` : seo.title,
      description: seo.description,
      path: `/products?category=${category.slug}`,
      image: category.banner?.url || undefined,
      keywords: [category.name, seo.h1, `${seo.h1} online`, `buy ${seo.h1} online India`, SITE_NAME],
    });
  }

  if (brand) {
    const seo = brandSeo(brand);
    return pageMetadata({
      index: isRealBrand(brand),
      title: seo.title,
      description: seo.description,
      path: `/products?brand=${encodeURIComponent(brand)}`,
      keywords: [brand, `${brand} products`, `${brand} online India`, SITE_NAME],
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
    title: 'Shop Baby Products Online in India - Clothing, Toys, Diapers & Gear',
    description: `Shop 1,500+ baby and kids products online at ${SITE_NAME}: clothing, toys, diapers, feeding, skin care, strollers, cradles and more. Delivery across India.`,
    path: '/products',
  });
}

// First page of products, categories and brands for this URL, loaded on the server
async function getInitialData(sp) {
  try {
    const query = listingQuery(sp);
    const [list, categories, brandResult] = await Promise.all([
      listProducts(query),
      getCategories({ all: true, withCount: true }),
      queryCatalog(query, { ignoreBrand: true }),
    ]);
    const { idx, docs } = brandResult;
    const brands = [...new Set(docs.map((d) => d.brandKey).filter(Boolean))]
      .map((k) => idx.brandLabels.get(k))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    // Cards and the cart never use the long text fields; leaving them out keeps the HTML small
    const products = list.products.map(({ description, shortDescription, features, tags, specifications, ...rest }) => rest);
    return JSON.parse(JSON.stringify({ ...list, products, categories, brands }));
  } catch (error) {
    console.error('Products page: initial data failed', error);
    return null;
  }
}

// Brands and categories to link to from the text under the listing
async function getLinkData({ category, brand }) {
  const idx = await getSearchIndex();
  const docs = idx.docs.filter((d) =>
    (!category || d.categoryId === category.id) && (!brand || d.brandKey === brandKey(brand)));

  const brandCounts = new Map();
  const catCounts = new Map();
  for (const d of docs) {
    if (d.brandKey) brandCounts.set(d.brandKey, (brandCounts.get(d.brandKey) || 0) + 1);
    catCounts.set(d.categoryId, (catCounts.get(d.categoryId) || 0) + 1);
  }
  const topBrands = [...brandCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([k]) => idx.brandLabels.get(k))
    .filter(isRealBrand);
  return { topBrands, catCounts };
}

function breadcrumbLd(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.url),
    })),
  };
}

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const sp = toSearchParams(params);
  const search = str(params?.search);
  const [category, brand, initialData] = await Promise.all([
    findCategory(params?.category),
    findBrand(str(params?.brand)),
    getInitialData(sp),
  ]);

  // Landing pages get descriptive text, links and structured data; search results don't
  const isListing = !search && params?.trending !== 'true' && params?.featured !== 'true';
  let seoBlock = null;
  let jsonLd = null;

  if (isListing && initialData) {
    const { topBrands, catCounts } = await getLinkData({ category, brand: category ? null : brand });
    const activeCats = (initialData.categories || []).filter((c) => c.isActive !== false && c.productCount > 0);

    let seo;
    let listUrl;
    let crumbs = [{ name: 'Home', url: '/' }, { name: 'Products', url: '/products' }];
    let categoryLinks;

    if (category) {
      seo = categorySeo(category);
      listUrl = `/products?category=${category.slug}`;
      crumbs.push({ name: seo.h1, url: listUrl });
      categoryLinks = activeCats.filter((c) => c.id !== category.id);
    } else if (brand) {
      const brandCats = activeCats.filter((c) => catCounts.get(c.id));
      seo = brandSeo(brand, brandCats.map((c) => categorySeo(c).h1));
      listUrl = `/products?brand=${encodeURIComponent(brand)}`;
      crumbs.push({ name: seo.h1, url: listUrl });
      categoryLinks = brandCats;
    } else {
      seo = { ...ALL_PRODUCTS_SEO, faqs: categorySeo({ slug: '', name: 'baby products' }).faqs.slice(-3) };
      listUrl = '/products';
      categoryLinks = activeCats;
    }

    // Brand pages link to the brand's categories; other pages link to popular brands
    const brandLinks = brand && !category ? [] : topBrands;
    seoBlock = (
      <CategorySeoContent
        heading={category || brand ? `Buy ${seo.h1} Online in India` : 'Online Baby Store Delivering Across India'}
        intro={seo.intro}
        brandLinks={brandLinks.map((b) => ({ label: b, href: `/products?brand=${encodeURIComponent(b)}` }))}
        categoryLinks={categoryLinks.slice(0, 40).map((c) => ({ label: categorySeo(c).h1, href: `/products?category=${c.slug}` }))}
        faqs={seo.faqs}
      />
    );

    jsonLd = [
      breadcrumbLd(crumbs),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: category || brand ? seo.h1 : 'All Baby & Kids Products',
        url: absoluteUrl(listUrl),
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: absoluteUrl('/') },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: initialData.pagination?.total || 0,
          itemListElement: (initialData.products || []).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: absoluteUrl(`/products/${p.slug || p.id}`),
            name: p.name,
          })),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: seo.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ];
  }

  return (
    <MainLayout>
      {jsonLd && <JsonLd data={jsonLd} />}
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductsClient initialData={initialData} />
      </Suspense>
      {seoBlock}
    </MainLayout>
  );
}
