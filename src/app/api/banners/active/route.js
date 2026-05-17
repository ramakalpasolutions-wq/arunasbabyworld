import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ✅ Force dynamic — never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();

    const [banners, brands] = await Promise.all([
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
    ]);

    // Festival with date filtering
    const festivalBanners = banners.filter(b => {
      if (b.type !== 'festival') return false;
      if (b.startDate && new Date(b.startDate) > now) return false;
      if (b.endDate && new Date(b.endDate) < now) return false;
      return true;
    });

    const response = NextResponse.json({
      banners,
      brands,
      heroBanners:          banners.filter(b => b.type === 'hero' || !b.type),
      festivalBanners,
      budgetBanners:        banners.filter(b => b.type === 'budget'),
      sunnyBanners:         banners.filter(b => b.type === 'sunny'),
      promoBanners:         banners.filter(b => b.type === 'promo'),
      genderBanners:        banners.filter(b => b.type === 'gender'),
      personalCareBanners:  banners.filter(b => b.type === 'personal-care'),
      healthCareBanners:    banners.filter(b => b.type === 'health-care'),
      evBanners:            banners.filter(b => b.type === 'electric-vehicle'),
      babyFoodBanners:      banners.filter(b => b.type === 'baby-food'),
      toysBanners:          banners.filter(b => b.type === 'toys'),
      maternityBanners:     banners.filter(b => b.type === 'maternity'),
    });

    // ✅ No-cache headers — customer always gets latest
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    console.error('Active banners error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}