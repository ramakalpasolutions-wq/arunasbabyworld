// src/app/api/categories/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

/* ============================================================
   ✅ ONLY these 9 slugs are allowed — in this exact order
   ============================================================ */
const ALLOWED_SLUGS = [
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
  'food & nutrition':  'food',
  'food nutrition':    'food',
  'food and nutrition':'food',
  'cradles & cribs':   'cradles-cribs',
  'cradles and cribs': 'cradles-cribs',
  'personal care':     'personal-care',
  'health care':       'health-care',
  'baby gear':         'baby-gear',
  'electric vehicles': 'electric-vehicles',
  'clothing':          'clothing',
  'walkers':           'walkers',
  'toys':              'toys',
  'food':              'food',
};

/* ── Generate correct slug from name ── */
function generateSlug(name) {
  const lower = name.toLowerCase().trim();
  // ✅ Check override map first
  if (SLUG_OVERRIDE[lower]) return SLUG_OVERRIDE[lower];
  // ✅ Generate from name
  return lower
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ── Sort categories by fixed order ── */
function sortByAllowedOrder(cats) {
  return [...cats].sort((a, b) => {
    const aIdx = ALLOWED_SLUGS.indexOf(a.slug);
    const bIdx = ALLOWED_SLUGS.indexOf(b.slug);
    const aOrder = aIdx === -1 ? 999 : aIdx;
    const bOrder = bIdx === -1 ? 999 : bIdx;
    return aOrder - bOrder;
  });
}

/* ============================================================
   GET — Fetch categories
   ============================================================ */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const withCount = searchParams.get('withCount');

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    // ✅ Always filter to only allowed slugs
    const filtered = categories.filter(
      cat => ALLOWED_SLUGS.includes(cat.slug)
    );

    // ✅ Sort by fixed order
    const sorted = sortByAllowedOrder(filtered);

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
   ============================================================ */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const data = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // ✅ Generate correct slug using override map
    const slug = generateSlug(data.name);

    // ✅ Validate slug is allowed
    if (!ALLOWED_SLUGS.includes(slug)) {
      return NextResponse.json(
        {
          error: `"${data.name}" is not an allowed category. Allowed slugs: ${ALLOWED_SLUGS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // ✅ Check if already exists in DB
    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      // ✅ Already exists — update and activate instead of error
      const updated = await prisma.category.update({
        where: { slug },
        data: {
          name:     data.name,
          icon:     data.icon     || existing.icon  || null,
          color:    data.color    || existing.color || '#ff6b9d',
          isActive: true,
          order:    ALLOWED_SLUGS.indexOf(slug),
          ...(data.description && { description: data.description }),
          ...(data.banner      && data.banner.url && { banner: data.banner }),
          ...(data.gridImages  && data.gridImages.length > 0 && { gridImages: data.gridImages }),
        },
      });
      return NextResponse.json({
        category: updated,
        message:  'Category already existed — updated and activated',
      });
    }

    // ✅ Create new category
    const orderIndex = ALLOWED_SLUGS.indexOf(slug);

    const categoryData = {
      name:        data.name,
      slug,
      description: data.description || null,
      icon:        data.icon        || null,
      color:       data.color       || '#ff6b9d',
      isActive:    true,
      order:       orderIndex !== -1 ? orderIndex : 999,
      type:        'normal',
    };

    if (data.banner     && data.banner.url)        categoryData.banner     = data.banner;
    if (data.gridImages && data.gridImages.length)  categoryData.gridImages = data.gridImages;

    const category = await prisma.category.create({ data: categoryData });
    return NextResponse.json({ category }, { status: 201 });

  } catch (error) {
    console.error('Categories POST error:', error);

    // ✅ Handle Prisma unique constraint error
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