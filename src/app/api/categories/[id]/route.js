// src/app/api/categories/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

const PREDEFINED_SLUGS = [
  'clothing', 'personal-care', 'health-care', 'baby-gear',
  'walkers', 'toys', 'cradles-cribs', 'electric-vehicles', 'food',
];

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
};

function generateSlug(name) {
  const lower = name.toLowerCase().trim();
  if (SLUG_OVERRIDE[lower]) return SLUG_OVERRIDE[lower];
  return lower
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ============================================================
   GET — single category
   ============================================================ */
export async function GET(request, { params }) {
  try {
    const { id }   = await params;
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/* ============================================================
   PUT — Update category
   ✅ NOW ALLOWS ANY CATEGORY NAME (custom or predefined)
   ============================================================ */
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const data   = await request.json();

    const updateData = {};

    if (data.name !== undefined && data.name !== null && data.name.trim()) {
      updateData.name = data.name.trim();

      // ✅ Generate slug
      const slug = generateSlug(data.name);

      if (slug) {
        updateData.slug = slug;
        // ✅ Set order: predefined keeps fixed order, custom keeps existing/999+
        const predefinedIdx = PREDEFINED_SLUGS.indexOf(slug);
        if (predefinedIdx !== -1) {
          updateData.order = predefinedIdx;
        }
        // If custom, don't auto-change order — keep existing
      }
    }

    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon        !== undefined) updateData.icon        = data.icon;
    if (data.color       !== undefined) updateData.color       = data.color;
    if (data.isActive    !== undefined) updateData.isActive    = data.isActive;
    if (data.order       !== undefined) updateData.order       = parseInt(data.order) || 0;
    if (data.type        !== undefined) updateData.type        = data.type;
    if (data.banner      !== undefined) updateData.banner      = data.banner;
    if (data.gridImages  !== undefined) updateData.gridImages  = data.gridImages;

    const category = await prisma.category.update({
      where: { id },
      data:  updateData,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Category PUT error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A category with this name/slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE — Delete category
   ============================================================ */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id } = await params;

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${productCount} product(s) use this category` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}