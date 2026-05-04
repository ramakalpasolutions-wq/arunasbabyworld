import MainLayout from '@/components/layout/MainLayout';
import HomeClient from './HomeClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'BabyBliss - Premium Baby & Kids Store',
  description: 'Shop the best baby clothing, toys, gear, and more.',
};

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function getBanners() {
  try {
    const res = await fetch(`${BASE_URL}/api/banners/active`, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

async function getProducts(params = '') {
  try {
    const res = await fetch(`${BASE_URL}/api/products?${params}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch { return []; }
}

export default async function HomePage() {
  const [bannerData, featured, trending] = await Promise.all([
    getBanners(),
    getProducts('featured=true&limit=8'),
    getProducts('trending=true&limit=8'),
  ]);

  return (
    <MainLayout>
      <HomeClient
        banners={bannerData.heroBanners || []}
        budgetBanners={bannerData.budgetBanners || []}
        sunnyBanners={bannerData.sunnyBanners || []}
        promoBanners={bannerData.promoBanners || []}
        genderBanners={bannerData.genderBanners || []}
        twoHeroBanners={bannerData.twoHeroBanners || []}
        gradientBanners={bannerData.gradientBanners || []}
        horizontalBanners={bannerData.horizontalBanners || []}
        fullPromoBanners={bannerData.fullPromoBanners || []}
        asymmetricBanners={bannerData.asymmetricBanners || []}
        maternityBanners={bannerData.maternityBanners || []}
        personalCareBanners={bannerData.personalCareBanners || []}
        healthCareBanners={bannerData.healthCareBanners || []}
        featured={featured}
        trending={trending}
      />
    </MainLayout>
  );
}