import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { products, categoryId } = await request.json();

    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }

    // ✅ Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const saved = [];
    const failed = [];

    // ✅ Save each product
    for (const p of products) {
      try {
        const slug = p.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') + '-' + Date.now() + Math.random().toString(36).slice(2, 6);

        const sku = 'FC-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();

        let discountPercent = null;
        if (p.discountPrice && p.price) {
          discountPercent = Math.round(
            ((p.price - p.discountPrice) / p.price) * 100
          );
        }

        const product = await prisma.product.create({
          data: {
            name: p.name,
            description: p.shortDescription || p.name,
            shortDescription: p.shortDescription || null,
            price: parseFloat(p.price),
            discountPrice: p.discountPrice ? parseFloat(p.discountPrice) : null,
            discountPercent,
            stock: parseInt(p.stock),
            brand: p.brand || null,
            categoryId,
            isFeatured: p.isFeatured || false,
            isTrending: p.isTrending || false,
            isActive: p.isActive !== false,
            images: p.images || [],
            tags: p.tags || [],
            features: p.features || [],
            slug,
            sku,
          },
        });

        saved.push(product.id);
      } catch (err) {
        console.error('Failed to save product:', p.name, err);
        failed.push(p.name);
      }
    }

    return NextResponse.json({
      message: `${saved.length} products saved successfully`,
      saved: saved.length,
      failed: failed.length,
      failedNames: failed,
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}