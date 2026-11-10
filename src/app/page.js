import MainLayout from '@/components/layout/MainLayout';
import HomeClient from './HomeClient';
import { unstable_noStore as noStore } from 'next/cache';
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
  title: 'Arunas Baby World - Baby & Kids Store Online',
  absoluteTitle: true,
  description: DEFAULT_DESCRIPTION,
  path: '/',
});

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
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
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
];

const BASE_URL =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

async function getBanners() {
  try {
    const res = await fetch(`${BASE_URL}/api/banners/active`, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch { return {}; }
}

async function getProducts(params = '') {
  try {
    const res = await fetch(`${BASE_URL}/api/products?${params}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch { return []; }
}

async function getSectionSettings() {
  try {
    const res = await fetch(`${BASE_URL}/api/section-settings`, { cache: 'no-store' });
    if (!res.ok) return {};
    const data = await res.json();
    return data.settings || {};
  } catch { return {}; }
}

export default async function HomePage() {
  const [bannerData, trending, featured, sectionSettings] = await Promise.all([
    getBanners(),
    getProducts('trending=true&limit=8'),
    getProducts('featured=true&limit=8'),
    getSectionSettings(),
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
    </MainLayout>
  );
}