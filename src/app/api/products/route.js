import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    const featured = searchParams.get('featured');
    const trending = searchParams.get('trending');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const where = { isActive: true };

    if (featured === 'true') where.isFeatured = true;
    if (trending === 'true') where.isTrending = true;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // ✅ Handle category by ID or slug
    if (category) {
      const isObjectId = /^[a-f\d]{24}$/i.test(category);
      if (isObjectId) {
        // ✅ Filter by category ID directly
        where.categoryId = category;
      } else {
        // Filter by slug
        const cat = await prisma.category.findFirst({
          where: { slug: category },
        });
        if (cat) where.categoryId = cat.id;
      }
    }

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

    // ✅ Handle category by slug or ID
    let categoryId = data.categoryId;
    const isValidObjectId = /^[a-f\d]{24}$/i.test(categoryId);

    if (!isValidObjectId) {
      const slug = data.categorySlug || categoryId;
      let cat = await prisma.category.findFirst({
        where: { slug },
      });

      if (!cat) {
        const nameMap = {
          'clothing': { name: 'Clothing', icon: '👕', color: '#ff6b9d' },
          'toys-games': { name: 'Toys & Games', icon: '🧸', color: '#7c3aed' },
          'baby-gear': { name: 'Baby Gear', icon: '🍼', color: '#0ea5e9' },
          'feeding': { name: 'Feeding', icon: '🥛', color: '#10b981' },
          'health-safety': { name: 'Health & Safety', icon: '🏥', color: '#f59e0b' },
          'nursery': { name: 'Nursery', icon: '🛏️', color: '#ef4444' },
          'books': { name: 'Books', icon: '📚', color: '#8b5cf6' },
          'outdoor': { name: 'Outdoor', icon: '🌿', color: '#059669' },
        };

        const catInfo = nameMap[slug] || {
          name: slug,
          icon: '📦',
          color: '#666',
        };

        cat = await prisma.category.create({
          data: {
            name: catInfo.name,
            slug,
            icon: catInfo.icon,
            color: catInfo.color,
            isActive: true,
            order: 0,
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
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription || null,
        price: parseFloat(data.price),
        discountPrice: data.discountPrice
          ? parseFloat(data.discountPrice)
          : null,
        discountPercent,
        stock: parseInt(data.stock),
        brand: data.brand || null,
        categoryId,
        ageGroup: data.ageGroup || null,
        tags: data.tags || [],
        features: data.features || [],
        isFeatured: data.isFeatured || false,
        isTrending: data.isTrending || false,
        isActive: data.isActive !== false,
        images: data.images || [],
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