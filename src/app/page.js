import MainLayout from '@/components/layout/MainLayout';
import HomeClient from './HomeClient';
import { unstable_noStore as noStore } from 'next/cache';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Arunas Baby World - Premium Baby & Kids Store',
  description: 'Shop the best baby clothing, toys, gear, and more.',
};

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