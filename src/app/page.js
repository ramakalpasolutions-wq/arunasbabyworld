import MainLayout from '@/components/layout/MainLayout';
import HomeClient from './HomeClient';
import { listProducts } from '@/lib/catalogQuery';
import { getActiveBanners, getSectionSettings } from '@/lib/storefrontData';
import { getCategories } from '@/lib/categoryList';
import { getSearchIndex } from '@/lib/search';
import { categorySeo, ALL_PRODUCTS_SEO, isRealBrand } from '@/lib/categorySeo';
import { STORE } from '@/lib/policies';
import CategorySeoContent from '@/components/seo/CategorySeoContent';
import {
  pageMetadata,
  JsonLd,
  absoluteUrl,
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
} from '@/lib/seo';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  title: 'Online Baby Store India - Baby Products & Toys | Arunas Baby World',
  absoluteTitle: true,
  description: DEFAULT_DESCRIPTION,
  path: '/',
});

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': ['OnlineStore', 'Store'],
    '@id': `${SITE_URL}/#store`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    image: absoluteUrl('/og-image.jpg'),
    description: DEFAULT_DESCRIPTION,
    telephone: STORE.phone.replace(/\s+/g, ''),
    email: STORE.email,
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Credit Card, Debit Card, Net Banking',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Koritipadu',
      addressLocality: 'Guntur',
      addressRegion: 'Andhra Pradesh',
      postalCode: '522007',
      addressCountry: 'IN',
    },
    areaServed: { '@type': 'Country', name: 'India' },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: STORE.phone.replace(/\s+/g, ''),
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Telugu', 'Hindi'],
    },
    sameAs: [
      'https://www.facebook.com/arunasbabyworld',
      'https://www.instagram.com/arunasbabyworld',
      'https://www.youtube.com/@arunasbabyworld',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#store` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
];

// Categories and top brands for the store introduction at the bottom of the page
async function getIntroLinks() {
  const [cats, idx] = await Promise.all([getCategories({ withCount: true }), getSearchIndex()]);
  const counts = new Map();
  for (const d of idx.docs) if (d.brandKey) counts.set(d.brandKey, (counts.get(d.brandKey) || 0) + 1);
  const brands = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)
    .map(([k]) => idx.brandLabels.get(k)).filter(isRealBrand);
  return {
    categoryLinks: cats.filter((c) => c.productCount > 0)
      .map((c) => ({ label: categorySeo(c).h1, href: `/products?category=${c.slug}` })),
    brandLinks: brands.map((b) => ({ label: b, href: `/products?brand=${encodeURIComponent(b)}` })),
  };
}

// Read the data directly (no HTTP round-trip to our own API on every view)
const safe = (p, fallback) => p.catch((err) => { console.error('Home data error:', err); return fallback; });

async function getProducts(params) {
  const { products } = await listProducts(new URLSearchParams(params));
  return products;
}

export default async function HomePage() {
  const [bannerData, trending, featured, sectionSettings, introLinks] = await Promise.all([
    safe(getActiveBanners(), {}),
    safe(getProducts('trending=true&limit=8'), []),
    safe(getProducts('featured=true&limit=8'), []),
    safe(getSectionSettings(), {}),
    safe(getIntroLinks(), { categoryLinks: [], brandLinks: [] }),
  ]);

  return (
    <MainLayout>
      <JsonLd data={homeJsonLd} />
      <HomeClient
        heroBanners={bannerData.heroBanners || []}
        brands={bannerData.brands || []}
        categoryBanners={bannerData.categoryBanners || []}   /* ✅ NEW */
        festivalBanners={bannerData.festivalBanners || []}
        budgetBanners={bannerData.budgetBanners || []}
        sunnyBanners={bannerData.sunnyBanners || []}
        promoBanners={bannerData.promoBanners || []}
        genderBanners={bannerData.genderBanners || []}
        personalCareBanners={bannerData.personalCareBanners || []}
        healthCareBanners={bannerData.healthCareBanners || []}
        evBanners={bannerData.evBanners || []}
        babyFoodBanners={bannerData.babyFoodBanners || []}
        toysBanners={bannerData.toysBanners || []}
        ctaBanners={(bannerData.banners || []).filter(b => b.type === 'cta')}
        trending={trending}
        featured={featured}
        initialSectionSettings={sectionSettings}
      />
      <CategorySeoContent
        headingLevel={1}
        heading="Online Baby Store in India - Baby Products, Toys & Kids Essentials"
        intro={ALL_PRODUCTS_SEO.intro}
        categoryLinks={introLinks.categoryLinks}
        brandLinks={introLinks.brandLinks}
        faqs={categorySeo({ slug: '', name: 'baby products' }).faqs}
      />
    </MainLayout>
  );
}