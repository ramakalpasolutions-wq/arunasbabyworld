import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    const [banners, brands] = await Promise.all([
      prisma.banner.findMany({
        where: { isActive: true }, // ✅ only active banners
        orderBy: { order: 'asc' },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      }),
    ]);

    // ✅ Festival banners with date filtering
    const festivalBanners = banners.filter(b => {
      if (b.type !== 'festival') return false;
      if (b.startDate && new Date(b.startDate) > now) return false;
      if (b.endDate && new Date(b.endDate) < now) return false;
      return true;
    });

    return NextResponse.json({
      banners,
      brands,

      heroBanners: banners.filter(b => b.type === 'hero' || !b.type),

      festivalBanners,

      budgetBanners: banners.filter(b => b.type === 'budget'),

      sunnyBanners: banners.filter(b => b.type === 'sunny'),

      promoBanners: banners.filter(b => b.type === 'promo'),

      genderBanners: banners.filter(b => b.type === 'gender'),

      personalCareBanners: banners.filter(b => b.type === 'personal-care'),

      healthCareBanners: banners.filter(b => b.type === 'health-care'),

      evBanners: banners.filter(b => b.type === 'electric-vehicle'),

      babyFoodBanners: banners.filter(b => b.type === 'baby-food'),

      // ✅ FINAL FIX — Toys with isActive protection
      toysBanners: banners.filter(
        b => b.type === 'toys' && b.isActive
      ),

      maternityBanners: banners.filter(b => b.type === 'maternity'),
    });

  } catch (error) {
    console.error('Active banners error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}