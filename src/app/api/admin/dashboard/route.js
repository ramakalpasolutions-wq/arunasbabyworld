import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

const LOW_STOCK_THRESHOLD = 5;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // ✅ Run primary database queries in parallel
    const [products, totalOrders, revenueAggregate, categoriesCount] = await Promise.all([
      // 1. Fetch only essential fields for variant stock evaluation (Optimized Select & Limit)
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id:            true,
          name:          true,
          stock:         true,
          hasVariants:   true,
          price:         true,
          discountPrice: true,
          images:        { select: { url: true }, take: 1 }, // ✅ Only load the first image URL
          category:      { select: { name: true } },
          colorVariants: {
            select: {
              colorName:     true,
              colorHex:      true,
              stock:         true,
              price:         true,
              discountPrice: true,
              sku:           true,
              images:        { select: { url: true }, take: 1 } // ✅ Only load variant's first image URL
            }
          }
        },
      }),

      // 2. Count total orders
      prisma.order.count(),

      // 3. ✅ DB-Level Aggregated Sum (Replaces memory-heavy findMany + reduce)
      prisma.order.aggregate({
        where: { orderStatus: { notIn: ['Cancelled', 'Refunded'] } },
        _sum: { totalPrice: true },
      }),

      // 4. Count active categories
      prisma.category.count({ where: { isActive: true } }),
    ]);

    // ✅ COUNT LOGIC — Each variant counts separately
    let totalProductUnits = 0;
    const lowStockItems = [];
    const outOfStockItems = [];

    products.forEach(p => {
      if (p.hasVariants && Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
        // Each color variant counts as separate product
        p.colorVariants.forEach(v => {
          totalProductUnits += 1;

          const stock = v.stock || 0;
          const variantImage = v.images?.[0]?.url || p.images?.[0]?.url || null;

          if (stock === 0) {
            outOfStockItems.push({
              id:            p.id,
              name:          p.name,
              variantName:   v.colorName,
              variantHex:    v.colorHex,
              stock:         0,
              image:         variantImage,
              category:      p.category?.name || 'Uncategorized',
              price:         v.price || p.price,
              discountPrice: v.discountPrice || p.discountPrice,
              isVariant:     true,
              sku:           v.sku,
            });
          } else if (stock <= LOW_STOCK_THRESHOLD) {
            lowStockItems.push({
              id:            p.id,
              name:          p.name,
              variantName:   v.colorName,
              variantHex:    v.colorHex,
              stock,
              image:         variantImage,
              category:      p.category?.name || 'Uncategorized',
              price:         v.price || p.price,
              discountPrice: v.discountPrice || p.discountPrice,
              isVariant:     true,
              sku:           v.sku,
            });
          }
        });
      } else {
        // Product without variants — counts as 1
        totalProductUnits += 1;

        const stock = p.stock || 0;
        const mainImage = p.images?.[0]?.url || null;

        if (stock === 0) {
          outOfStockItems.push({
            id:            p.id,
            name:          p.name,
            variantName:   null,
            stock:         0,
            image:         mainImage,
            category:      p.category?.name || 'Uncategorized',
            price:         p.price,
            discountPrice: p.discountPrice,
            isVariant:     false,
          });
        } else if (stock <= LOW_STOCK_THRESHOLD) {
          lowStockItems.push({
            id:            p.id,
            name:          p.name,
            variantName:   null,
            stock,
            image:         mainImage,
            category:      p.category?.name || 'Uncategorized',
            price:         p.price,
            discountPrice: p.discountPrice,
            isVariant:     false,
          });
        }
      }
    });

    // ✅ Sort low stock items by stock (lowest first)
    lowStockItems.sort((a, b) => a.stock - b.stock);

    const totalRevenue = revenueAggregate._sum.totalPrice || 0;

    return NextResponse.json({
      stats: {
        totalOrders,
        totalProductUnits,      // ✅ Variants counted separately
        totalUniqueProducts: products.length, 
        categories:  categoriesCount,
        revenue:     totalRevenue,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
      },
      lowStockItems:   lowStockItems.slice(0, 20),   // Top 20 lowest
      outOfStockItems: outOfStockItems.slice(0, 20), // Top 20
      threshold: LOW_STOCK_THRESHOLD,
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}