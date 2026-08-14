import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ✅ Calculate search relevance score
function calculateRelevance(product, searchLower, matchingCategoryIds) {
  let score = 0;
  const nameLower         = (product.name             || '').toLowerCase();
  const brandLower        = (product.brand            || '').toLowerCase();
  const descLower         = (product.description      || '').toLowerCase();
  const shortDescLower    = (product.shortDescription || '').toLowerCase();
  const categoryNameLower = (product.category?.name   || '').toLowerCase();
  const categorySlugLower = (product.category?.slug   || '').toLowerCase();

  if (matchingCategoryIds.includes(product.categoryId)) score += 10000;
  if (categoryNameLower === searchLower || categorySlugLower === searchLower) score += 5000;
  if (categoryNameLower.includes(searchLower) || categorySlugLower.includes(searchLower)) score += 2000;
  if (nameLower === searchLower) score += 3000;
  if (nameLower.startsWith(searchLower)) score += 1500;
  const nameWords = nameLower.split(/\s+/);
  if (nameWords.includes(searchLower)) score += 1200;
  if (nameLower.includes(searchLower)) score += 800;
  if (brandLower === searchLower) score += 700;
  if (brandLower.includes(searchLower)) score += 400;
  if (product.tags?.some(t => t.toLowerCase() === searchLower)) score += 600;
  if (product.tags?.some(t => t.toLowerCase().includes(searchLower))) score += 300;
  if (shortDescLower.includes(searchLower)) score += 100;
  if (descLower.includes(searchLower)) score += 20;
  if (product.isFeatured) score += 50;
  if (product.isTrending) score += 40;
  if ((product.stock || 0) > 0) score += 10;
  if (product.rating > 4) score += 15;

  return score;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page     = parseInt(searchParams.get('page')  || '1');
    const limit    = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search   = searchParams.get('search');
    const sort     = searchParams.get('sort')  || 'createdAt';
    const order    = searchParams.get('order') || 'desc';
    const featured = searchParams.get('featured');
    const trending = searchParams.get('trending');
    const brand    = searchParams.get('brand');
    const discount = searchParams.get('discount');
    const rating   = searchParams.get('rating');
    const inStock  = searchParams.get('inStock');

    let minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice'))
      : null;
    let maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice'))
      : null;

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    const where = { isActive: true };

    if (featured === 'true') where.isFeatured = true;
    if (trending === 'true') where.isTrending = true;

    if (brand && brand.trim()) {
      where.brand = { equals: brand.trim(), mode: 'insensitive' };
    }

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

    let matchingCategoryIds = [];

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
        select: { id: true, name: true, slug: true },
      });

      matchingCategoryIds = matchingCategories.map(c => c.id);
      console.log(`🔍 Search "${s}" → Found ${matchingCategoryIds.length} matching categories:`, matchingCategories.map(c => c.name));

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

    // ✅ Smart Category filter
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
            where: {
              name: { equals: rawCategory, mode: 'insensitive' },
              isActive: true,
            },
          });
        }

        if (!catFound) {
          catFound = await prisma.category.findFirst({
            where: {
              slug: { contains: normalized, mode: 'insensitive' },
              isActive: true,
            },
          });
        }

        if (!catFound) {
          catFound = await prisma.category.findFirst({
            where: {
              name: { contains: rawCategory, mode: 'insensitive' },
              isActive: true,
            },
          });
        }

        if (!catFound) {
          const firstWord = rawCategory.split(/\s+/)[0]?.toLowerCase();
          if (firstWord && firstWord.length >= 4) {
            catFound = await prisma.category.findFirst({
              where: {
                OR: [
                  { slug: { contains: firstWord, mode: 'insensitive' } },
                  { name: { contains: firstWord, mode: 'insensitive' } },
                ],
                isActive: true,
              },
            });
          }
        }

        if (catFound) {
          where.categoryId = catFound.id;
          console.log(`✅ Category "${rawCategory}" → matched: ${catFound.name} (${catFound.slug})`);
        } else {
          console.log(`⚠️ Category "${rawCategory}" → NOT FOUND`);
          where.categoryId = '000000000000000000000000';
        }
      }
    }

    const total = await prisma.product.count({ where });

    let orderBy;
    if (sort === 'discountPercent') {
      orderBy = [
        { discountPercent: order },
        { createdAt: 'desc' },
      ];
    } else if (sort === 'price') {
      orderBy = [{ price: order }];
    } else {
      orderBy = { [sort]: order };
    }

    // ✅ Fetch ALL matching products for sorting (up to 500)
    let products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy,
      skip: 0,
      take: Math.min(total, 500),
    });

    // ✅ SMART RELEVANCE SORTING when searching
    if (search && search.trim()) {
      const searchLower = search.trim().toLowerCase();

      products = products
        .map(product => ({
          product,
          score: calculateRelevance(product, searchLower, matchingCategoryIds),
        }))
        .sort((a, b) => b.score - a.score)
        .map(item => item.product);

      console.log(`🎯 Sorted ${products.length} products by relevance for "${search}"`);
    }

    // ✅ ALWAYS push out-of-stock products to the end
    if (inStock !== 'true') {
      const inStockProducts = products.filter(p => (p.stock || 0) > 0);
      const outOfStock      = products.filter(p => (p.stock || 0) === 0);
      products = [...inStockProducts, ...outOfStock];
    }

    // ✅ Apply pagination AFTER all sorting
    const startIndex = (page - 1) * limit;
    products = products.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      matchingCategories: search ? matchingCategoryIds.length : undefined,
    });

  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const data = await request.json();

    let categoryId = data.categoryId;
    const isObjectId = /^[a-f\d]{24}$/i.test(categoryId);

    let foundCat = null;
    if (isObjectId) {
      foundCat = await prisma.category.findUnique({ where: { id: categoryId } });
    }

    if (!foundCat) {
      const slug = data.categorySlug || categoryId;
      let cat = await prisma.category.findFirst({ where: { slug } });

      if (!cat) {
        const nameMap = {
          'clothing':          { name: 'Clothing',          icon: '👗', color: '#ff6b9d' },
          'personal-care':     { name: 'Personal Care',     icon: '🧴', color: '#7c3aed' },
          'health-care':       { name: 'Health Care',       icon: '💊', color: '#0ea5e9' },
          'baby-gear':         { name: 'Baby Gear',         icon: '🎒', color: '#10b981' },
          'walkers':           { name: 'Walkers',           icon: '🚶', color: '#f59e0b' },
          'toys':              { name: 'Toys',              icon: '🎠', color: '#ef4444' },
          'cradles-cribs':     { name: 'Cradles & Cribs',   icon: '🛏️', color: '#8b5cf6' },
          'electric-vehicles': { name: 'Electric Vehicles', icon: '🚗', color: '#059669' },
          'food':              { name: 'Food',              icon: '🍎', color: '#f97316' },
        };
        const catInfo = nameMap[slug] || { name: slug, icon: '📦', color: '#666' };

        cat = await prisma.category.create({
          data: {
            name: catInfo.name, slug,
            icon: catInfo.icon, color: catInfo.color,
            isActive: true, order: 0,
          },
        });
      }
      categoryId = cat.id;
    }

    const productSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();

    const sku = 'FC-' + Date.now();

    let discountPercent = null;
    if (data.discountPrice && data.price) {
      discountPercent = Math.round(((data.price - data.discountPrice) / data.price) * 100);
    }

    const hasVariants = Array.isArray(data.colorVariants) && data.colorVariants.length > 0;
    let colorVariants = [];
    let totalStock = parseInt(data.stock) || 0;

    if (hasVariants) {
      colorVariants = data.colorVariants.map(v => ({
        colorName:     v.colorName     || '',
        colorHex:      v.colorHex      || '#000000',
        price:         v.price         ? parseFloat(v.price) : parseFloat(data.price),
        discountPrice: v.discountPrice ? parseFloat(v.discountPrice) : null,
        stock:         parseInt(v.stock) || 0,
        sizes:         Array.isArray(v.sizes) ? v.sizes : [],
        images:        Array.isArray(v.images) ? v.images.filter(Boolean) : [],
        sku:           v.sku || `${sku}-${(v.colorName || 'C').toUpperCase().slice(0,3)}`,
      }));

      totalStock = colorVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }

    const product = await prisma.product.create({
      data: {
        name:             data.name,
        description:      data.description,
        shortDescription: data.shortDescription || null,
        price:            parseFloat(data.price),
        discountPrice:    data.discountPrice ? parseFloat(data.discountPrice) : null,
        discountPercent,
        stock:            totalStock,
        brand:            data.brand    || null,
        categoryId,
        ageGroup:         data.ageGroup || null,
        tags:             data.tags     || [],
        features:         data.features || [],
        isFeatured:       data.isFeatured || false,
        isTrending:       data.isTrending || false,
        isActive:         data.isActive !== false,
        images:           data.images   || [],
        size:             data.size     || null,
        gender:           data.gender   || null,
        color:            data.color    || null,
        material:         data.material || null,
        hasVariants,
        colorVariants,
        slug: productSlug,
        sku,
      },
    });

    return NextResponse.json({ product }, { status: 201 });

  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}