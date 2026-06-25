import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

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

    if (search && search.trim()) {
      const s = search.trim();
      const searchConditions = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { shortDescription: { contains: s, mode: 'insensitive' } },
        { brand: { contains: s, mode: 'insensitive' } },
        { category: { name: { contains: s, mode: 'insensitive' } } },
        { category: { slug: { contains: s, mode: 'insensitive' } } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    if (category) {
      const isObjectId = /^[a-f\d]{24}$/i.test(category);
      if (isObjectId) {
        where.categoryId = category;
      } else {
        const catBySlug = await prisma.category.findFirst({ where: { slug: category } });
        if (catBySlug) {
          where.categoryId = catBySlug.id;
        } else {
          const catByPartial = await prisma.category.findFirst({
            where: { slug: { contains: category, mode: 'insensitive' } },
          });
          if (catByPartial) where.categoryId = catByPartial.id;
        }
      }
    }

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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

    // ✅ Handle color variants
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

      // ✅ Total stock = sum of all variant stocks
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

        // ✅ Color variants
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