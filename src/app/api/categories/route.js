// src/app/api/categories/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/* ============================================================
   ✅ 9 PREDEFINED slugs — get priority order (0–8)
   ✅ Custom categories are also allowed (get order 999+)
   ============================================================ */
const PREDEFINED_SLUGS = [
  'clothing',
  'personal-care',
  'health-care',
  'baby-gear',
  'walkers',
  'toys',
  'cradles-cribs',
  'electric-vehicles',
  'food',
];

/* ✅ Slug override map — display name → correct slug */
const SLUG_OVERRIDE = {
  'food & nutrition':   'food',
  'food nutrition':     'food',
  'food and nutrition': 'food',
  'cradles & cribs':    'cradles-cribs',
  'cradles and cribs':  'cradles-cribs',
  'personal care':      'personal-care',
  'health care':        'health-care',
  'baby gear':          'baby-gear',
  'electric vehicles':  'electric-vehicles',
  'clothing':           'clothing',
  'walkers':            'walkers',
  'toys':               'toys',
  'food':               'food',
};

/* ── Generate slug from name ── */
function generateSlug(name) {
  const lower = name.toLowerCase().trim();
  if (SLUG_OVERRIDE[lower]) return SLUG_OVERRIDE[lower];
  return lower
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ── Sort: predefined first (in fixed order), then custom (alphabetical) ── */
function sortByOrder(cats) {
  return [...cats].sort((a, b) => {
    const aIdx = PREDEFINED_SLUGS.indexOf(a.slug);
    const bIdx = PREDEFINED_SLUGS.indexOf(b.slug);
    const aOrder = aIdx === -1 ? 999 : aIdx;
    const bOrder = bIdx === -1 ? 999 : bIdx;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Both custom — sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/* ============================================================
   GET — Fetch categories
   ============================================================ */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const withCount = searchParams.get('withCount');
    const all       = searchParams.get('all') === 'true';

    const categories = await prisma.category.findMany({
      where: all ? {} : { isActive: true },
      orderBy: { order: 'asc' },
    });

    // ✅ Show ALL categories (predefined + custom), no filtering
    const sorted = sortByOrder(categories);

    // ✅ Add product counts if requested
    if (withCount === 'true') {
      const withCounts = await Promise.all(
        sorted.map(async (cat) => {
          const productCount = await prisma.product.count({
            where: { categoryId: cat.id, isActive: true },
          });
          return { ...cat, productCount };
        })
      );
      return NextResponse.json({ categories: withCounts });
    }

    return NextResponse.json({ categories: sorted });

  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST — Create category
   ✅ NOW ALLOWS ANY CATEGORY NAME
   ============================================================ */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const data = await request.json();

    if (!data.name || !data.name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // ✅ Generate slug
    const slug = generateSlug(data.name);

    if (!slug) {
      return NextResponse.json(
        { error: 'Invalid category name — please use letters/numbers' },
        { status: 400 }
      );
    }

    // ✅ REMOVED: validation that blocked custom categories
    // Now any category name is allowed!

    // ✅ Check if already exists in DB
    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      // ✅ Already exists — update & activate instead of error
      const updated = await prisma.category.update({
        where: { slug },
        data: {
          name:     data.name,
          icon:     data.icon  || existing.icon  || null,
          color:    data.color || existing.color || '#ff6b9d',
          isActive: true,
          order:    PREDEFINED_SLUGS.indexOf(slug) !== -1
                      ? PREDEFINED_SLUGS.indexOf(slug)
                      : (existing.order || 999),
          ...(data.description && { description: data.description }),
          ...(data.banner     && data.banner.url    && { banner: data.banner }),
          ...(data.gridImages && data.gridImages.length > 0 && { gridImages: data.gridImages }),
        },
      });
      return NextResponse.json({
        category: updated,
        message:  'Category already existed — updated and activated',
      });
    }

    // ✅ Determine order: predefined (0-8) or custom (999+)
    const predefinedIdx = PREDEFINED_SLUGS.indexOf(slug);
    let orderIndex;

    if (predefinedIdx !== -1) {
      orderIndex = predefinedIdx;
    } else {
      // Custom category — find max order and add 1 (start at 1000)
      const lastCustom = await prisma.category.findFirst({
        where: { order: { gte: 1000 } },
        orderBy: { order: 'desc' },
      });
      orderIndex = lastCustom ? (lastCustom.order + 1) : 1000;
    }

    const categoryData = {
      name:        data.name.trim(),
      slug,
      description: data.description || null,
      icon:        data.icon        || null,
      color:       data.color       || '#ff6b9d',
      isActive:    true,
      order:       orderIndex,
      type:        data.type || 'normal',
    };

    if (data.banner     && data.banner.url)        categoryData.banner     = data.banner;
    if (data.gridImages && data.gridImages.length) categoryData.gridImages = data.gridImages;

    const category = await prisma.category.create({ data: categoryData });
    return NextResponse.json({ category }, { status: 201 });

  } catch (error) {
    console.error('Categories POST error:', error);

    // ✅ Handle Prisma unique constraint
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This category already exists in the database' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}