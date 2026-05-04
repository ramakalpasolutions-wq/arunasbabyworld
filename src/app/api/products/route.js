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

    // ✅ Get min/max price
    let minPrice = searchParams.get('minPrice')
      ? parseFloat(searchParams.get('minPrice'))
      : null;
    let maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice'))
      : null;

    // ✅ Auto swap if min > max
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    console.log('🔍 Price filter:', { minPrice, maxPrice });

    const where = { isActive: true };

    if (featured === 'true') where.isFeatured = true;
    if (trending === 'true') where.isTrending = true;

    // ✅ Price filter — checks BOTH price and discountPrice
    if (minPrice !== null || maxPrice !== null) {
      where.OR = [
        // ✅ Case 1: Product has discountPrice — filter by discountPrice
        {
          discountPrice: {
            not: null,
            ...(minPrice !== null && { gte: minPrice }),
            ...(maxPrice !== null && { lte: maxPrice }),
          },
        },
        // ✅ Case 2: Product has NO discountPrice — filter by regular price
        {
          discountPrice: null,
          price: {
            ...(minPrice !== null && { gte: minPrice }),
            ...(maxPrice !== null && { lte: maxPrice }),
          },
        },
      ];
    }

    if (search) {
      // ✅ If price filter already set OR, we need to combine with search
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { tags: { has: search } },
            ],
          },
        ];
        delete where.OR;
      } else {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }
    }

    // ✅ Handle category by ID first, then slug
    if (category) {
      try {
        const catById = await prisma.category.findUnique({
          where: { id: category },
        });

        if (catById) {
          where.categoryId = category;
        } else {
          const catBySlug = await prisma.category.findFirst({
            where: { slug: category },
          });
          if (catBySlug) {
            where.categoryId = catBySlug.id;
          }
        }
      } catch {
        const catBySlug = await prisma.category.findFirst({
          where: { slug: category },
        });
        if (catBySlug) {
          where.categoryId = catBySlug.id;
        }
      }
    }

    console.log('📦 Where query:', JSON.stringify(where, null, 2));

    const total = await prisma.product.count({ where });

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    console.log(`✅ Found ${total} products`);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    let foundCat = null;
    try {
      foundCat = await prisma.category.findUnique({
        where: { id: categoryId },
      });
    } catch {
      foundCat = null;
    }

    if (!foundCat) {
      const slug = data.categorySlug || categoryId;
      let cat = await prisma.category.findFirst({
        where: { slug },
      });

      if (!cat) {
        const nameMap = {
          'clothing':      { name: 'Clothing',        icon: '👕', color: '#ff6b9d' },
          'toys-games':    { name: 'Toys & Games',    icon: '🧸', color: '#7c3aed' },
          'baby-gear':     { name: 'Baby Gear',       icon: '🍼', color: '#0ea5e9' },
          'feeding':       { name: 'Feeding',         icon: '🥛', color: '#10b981' },
          'health-safety': { name: 'Health & Safety', icon: '🏥', color: '#f59e0b' },
          'nursery':       { name: 'Nursery',         icon: '🛏️', color: '#ef4444' },
          'books':         { name: 'Books',           icon: '📚', color: '#8b5cf6' },
          'outdoor':       { name: 'Outdoor',         icon: '🌿', color: '#059669' },
        };

        const catInfo = nameMap[slug] || {
          name:  slug,
          icon:  '📦',
          color: '#666',
        };

        cat = await prisma.category.create({
          data: {
            name:     catInfo.name,
            slug,
            icon:     catInfo.icon,
            color:    catInfo.color,
            isActive: true,
            order:    0,
          },
        });
      }
      categoryId = cat.id;
    }

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();

    const sku = 'FC-' + Date.now();

    let discountPercent = null;
    if (data.discountPrice && data.price) {
      discountPercent = Math.round(
        ((data.price - data.discountPrice) / data.price) * 100
      );
    }

    const product = await prisma.product.create({
      data: {
        name:             data.name,
        description:      data.description,
        shortDescription: data.shortDescription || null,
        price:            parseFloat(data.price),
        discountPrice:    data.discountPrice
          ? parseFloat(data.discountPrice)
          : null,
        discountPercent,
        stock:      parseInt(data.stock),
        brand:      data.brand    || null,
        categoryId,
        ageGroup:   data.ageGroup || null,
        tags:       data.tags     || [],
        features:   data.features || [],
        isFeatured: data.isFeatured || false,
        isTrending: data.isTrending || false,
        isActive:   data.isActive !== false,
        images:     data.images   || [],
        slug,
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