import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const search   = searchParams.get('search');
    const featured = searchParams.get('featured');
    const trending = searchParams.get('trending');
    const discount = searchParams.get('discount');
    const rating   = searchParams.get('rating');
    const inStock  = searchParams.get('inStock');

    let minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : null;
    let maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : null;

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    // ✅ Build where clause
    const where = {
      isActive: true,
      brand: { not: null },
    };

    if (featured === 'true') where.isFeatured = true;
    if (trending === 'true') where.isTrending = true;

    if (discount) {
      const discountVal = parseFloat(discount);
      if (!isNaN(discountVal) && discountVal > 0) {
        where.discountPercent = { gte: discountVal };
      }
    }

    if (rating) {
      const ratingVal = parseFloat(rating);
      if (!isNaN(ratingVal) && ratingVal > 0) {
        where.rating = { gte: ratingVal };
      }
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    }

    if (minPrice !== null || maxPrice !== null) {
      where.OR = [
        {
          discountPrice: {
            not: null,
            ...(minPrice !== null && { gte: minPrice }),
            ...(maxPrice !== null && { lte: maxPrice }),
          },
        },
        {
          discountPrice: null,
          price: {
            ...(minPrice !== null && { gte: minPrice }),
            ...(maxPrice !== null && { lte: maxPrice }),
          },
        },
      ];
    }

    // Search filter
    if (search && search.trim()) {
      const s = search.trim();

      const matchingCategories = await prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: s, mode: 'insensitive' } },
            { slug: { contains: s.toLowerCase(), mode: 'insensitive' } },
          ],
          isActive: true,
        },
        select: { id: true },
      });

      const matchingCategoryIds = matchingCategories.map(c => c.id);

      const searchConditions = [
        ...(matchingCategoryIds.length > 0
          ? [{ categoryId: { in: matchingCategoryIds } }]
          : []),
        { name:             { contains: s, mode: 'insensitive' } },
        { brand:            { contains: s, mode: 'insensitive' } },
        { tags:             { has: s } },
        { tags:             { has: s.toLowerCase() } },
        { shortDescription: { contains: s, mode: 'insensitive' } },
        { description:      { contains: s, mode: 'insensitive' } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Category filter — smart matching
    if (category) {
      const isObjectId = /^[a-f\d]{24}$/i.test(category);

      if (isObjectId) {
        where.categoryId = category;
      } else {
        const rawCategory = category.trim();
        const normalized = rawCategory
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        let catFound = null;

        catFound = await prisma.category.findFirst({
          where: { slug: normalized, isActive: true },
        });

        if (!catFound) {
          catFound = await prisma.category.findFirst({
            where: { name: { equals: rawCategory, mode: 'insensitive' }, isActive: true },
          });
        }

        if (!catFound) {
          catFound = await prisma.category.findFirst({
            where: { slug: { contains: normalized, mode: 'insensitive' }, isActive: true },
          });
        }

        if (!catFound) {
          catFound = await prisma.category.findFirst({
            where: { name: { contains: rawCategory, mode: 'insensitive' }, isActive: true },
          });
        }

        if (catFound) {
          where.categoryId = catFound.id;
        } else {
          where.categoryId = '000000000000000000000000';
        }
      }
    }

    // ✅ FETCH ALL PRODUCTS with just brand field (much faster than full data)
    console.log('🔍 Fetching brands with where clause...');

    const products = await prisma.product.findMany({
      where,
      select: { brand: true },
    });

    console.log(`📦 Found ${products.length} products with brands`);

    // ✅ Extract unique brands manually (case-insensitive dedup, keep original casing)
    const brandMap = new Map();

    products.forEach(p => {
      const brand = p.brand?.trim();
      if (!brand) return;

      const lowerKey = brand.toLowerCase();
      // Keep first occurrence's original casing
      if (!brandMap.has(lowerKey)) {
        brandMap.set(lowerKey, brand);
      }
    });

    // Sort alphabetically
    const uniqueBrands = [...brandMap.values()].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );

    console.log(`🏷️ Returning ${uniqueBrands.length} unique brands`);
    console.log('First 10:', uniqueBrands.slice(0, 10));

    return NextResponse.json({
      brands: uniqueBrands,
      total: uniqueBrands.length,
      debug: {
        totalProducts: products.length,
        uniqueBrandsCount: uniqueBrands.length,
      },
    });

  } catch (error) {
    console.error('Brands API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}