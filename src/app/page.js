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
    if (!res.ok) return { heroBanners: [], budgetBanners: [], sunnyBanners: [], promoBanners: [], genderBanners: [] };
    const data = await res.json();
    return {
      heroBanners: data.heroBanners || [],
      budgetBanners: data.budgetBanners || [],
      sunnyBanners: data.sunnyBanners || [],
      promoBanners: data.promoBanners || [],
      genderBanners: data.genderBanners || [],
    };
  } catch {
    return { heroBanners: [], budgetBanners: [], sunnyBanners: [], promoBanners: [], genderBanners: [] };
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

async function getCategories() {
  try {
    const res = await fetch(`${BASE_URL}/api/categories`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories || [];
  } catch { return []; }
}

export default async function HomePage() {
  const [
    { heroBanners, budgetBanners, sunnyBanners, promoBanners, genderBanners },
    featured,
    trending,
    allCategories,
  ] = await Promise.all([
    getBanners(),
    getProducts('featured=true&limit=8'),
    getProducts('trending=true&limit=8'),
    getCategories(),
  ]);

  // ✅ Separate categories by type
  const normalCats = allCategories.filter(c => c.type === 'normal' || !c.type);
  const maternityCats = allCategories.filter(c => c.type === 'maternity');
  const personalCareCats = allCategories.filter(c => c.type === 'personal-care');
  const healthyCareCats = allCategories.filter(c => c.type === 'healthy-care');

  return (
    <MainLayout>
      <HomeClient
        banners={heroBanners}
        budgetBanners={budgetBanners}
        sunnyBanners={sunnyBanners}
        promoBanners={promoBanners}
        genderBanners={genderBanners}
        featured={featured}
        trending={trending}
        categories={normalCats}
        maternityCats={maternityCats}
        personalCareCats={personalCareCats}
        healthyCareCats={healthyCareCats}
      />
    </MainLayout>
  );
}