// src/app/page.js
import MainLayout from '@/components/layout/MainLayout';
import HomeClient from './HomeClient';
import prisma from '@/lib/prisma';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'BabyBliss - Premium Baby & Kids Store',
  description: 'Shop the best baby clothing, toys, gear, and more.',
};

async function getBanners() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return {
      heroBanners:         banners.filter(b => b.type === 'hero' || !b.type),
      budgetBanners:       banners.filter(b => b.type === 'budget'),
      sunnyBanners:        banners.filter(b => b.type === 'sunny'),
      promoBanners:        banners.filter(b => b.type === 'promo'),
      genderBanners:       banners.filter(b => b.type === 'gender'),
      twoHeroBanners:      banners.filter(b => b.type === 'two-hero'),
      gradientBanners:     banners.filter(b => b.type === 'gradient-grid'),
      horizontalBanners:   banners.filter(b => b.type === 'horizontal-scroll'),
      fullPromoBanners:    banners.filter(b => b.type === 'full-promo'),
      asymmetricBanners:   banners.filter(b => b.type === 'asymmetric'),
      maternityBanners:    banners.filter(b => b.type === 'maternity'),
      personalCareBanners: banners.filter(b => b.type === 'personal-care'),
      healthCareBanners:   banners.filter(b => b.type === 'health-care'),
    };
  } catch (err) {
    console.error('getBanners error:', err);
    return {};
  }
}

async function getProducts(params = {}) {
  try {
    const where = { isActive: true };
    if (params.featured) where.isFeatured = true;
    if (params.trending) where.isTrending = true;

    return await prisma.product.findMany({
      where,
      take: params.limit || 8,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  } catch (err) {
    console.error('getProducts error:', err);
    return [];
  }
}

const serialize = (data) => JSON.parse(JSON.stringify(data));

export default async function HomePage() {
  const [bannerData, featured, trending] = await Promise.all([
    getBanners(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ trending: true, limit: 8 }),
  ]);

  return (
    <MainLayout>
      <HomeClient
        banners={serialize(bannerData.heroBanners || [])}
        budgetBanners={serialize(bannerData.budgetBanners || [])}
        sunnyBanners={serialize(bannerData.sunnyBanners || [])}
        promoBanners={serialize(bannerData.promoBanners || [])}
        genderBanners={serialize(bannerData.genderBanners || [])}
        twoHeroBanners={serialize(bannerData.twoHeroBanners || [])}
        gradientBanners={serialize(bannerData.gradientBanners || [])}
        horizontalBanners={serialize(bannerData.horizontalBanners || [])}
        fullPromoBanners={serialize(bannerData.fullPromoBanners || [])}
        asymmetricBanners={serialize(bannerData.asymmetricBanners || [])}
        maternityBanners={serialize(bannerData.maternityBanners || [])}
        personalCareBanners={serialize(bannerData.personalCareBanners || [])}
        healthCareBanners={serialize(bannerData.healthCareBanners || [])}
        featured={serialize(featured)}
        trending={serialize(trending)}
      />
    </MainLayout>
  );
}