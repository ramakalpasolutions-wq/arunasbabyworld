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
    const [products, totalOrders, revenueAggregate, categoriesCount, totalUsers] = await Promise.all([
      // 1. Fetch products with scalar & composite fields valid for Prisma MongoDB
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id:            true,
          name:          true,
          stock:         true,
          hasVariants:   true,
          price:         true,
          discountPrice: true,
          images:        true, // ✅ Full composite selection (valid for MongoDB embedded types)
          colorVariants: true, // ✅ Full composite selection
          category:      { select: { name: true } }, // Relational select (valid)
        },
      }),

      // 2. Count total orders
      prisma.order.count(),

      // 3. Database-level aggregated revenue sum
      prisma.order.aggregate({
        where: { orderStatus: { notIn: ['Cancelled', 'Refunded'] } },
        _sum:  { totalPrice: true },
      }),

      // 4. Count active categories
      prisma.category.count({ where: { isActive: true } }),

      // 5. Count total registered users
      prisma.user.count(),
    ]);

    // ✅ Evaluate variant stock levels & unit totals
    let totalProductUnits = 0;
    const lowStockItems = [];
    const outOfStockItems = [];

    products.forEach(p => {
      const categoryName = p.category?.name || 'Uncategorized';

      if (p.hasVariants && Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
        // Evaluate each color variant separately
        p.colorVariants.forEach(v => {
          totalProductUnits += 1;

          const stock = v.stock || 0;
          const variantImage = v.images?.[0]?.url || p.images?.[0]?.url || null;

          const itemData = {
            id:            p.id,
            name:          p.name,
            variantName:   v.colorName || null,
            variantHex:    v.colorHex || null,
            stock,
            image:         variantImage,
            category:      categoryName,
            price:         v.price || p.price,
            discountPrice: v.discountPrice || p.discountPrice,
            isVariant:     true,
            sku:           v.sku || null,
          };

          if (stock === 0) {
            outOfStockItems.push(itemData);
          } else if (stock <= LOW_STOCK_THRESHOLD) {
            lowStockItems.push(itemData);
          }
        });
      } else {
        // Simple product (no variants)
        totalProductUnits += 1;

        const stock = p.stock || 0;
        const mainImage = p.images?.[0]?.url || null;

        const itemData = {
          id:            p.id,
          name:          p.name,
          variantName:   null,
          stock,
          image:         mainImage,
          category:      categoryName,
          price:         p.price,
          discountPrice: p.discountPrice,
          isVariant:     false,
        };

        if (stock === 0) {
          outOfStockItems.push(itemData);
        } else if (stock <= LOW_STOCK_THRESHOLD) {
          lowStockItems.push(itemData);
        }
      }
    });

    // Sort low stock items by lowest stock first
    lowStockItems.sort((a, b) => a.stock - b.stock);

    const totalRevenue = revenueAggregate?._sum?.totalPrice || 0;

    return NextResponse.json({
      stats: {
        totalOrders,
        totalProductUnits,
        totalUniqueProducts: products.length,
        categories:  categoriesCount,
        revenue:     Math.round(totalRevenue),
        users:       totalUsers,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
      },
      lowStockItems:   lowStockItems.slice(0, 20),   // Top 20 lowest stock
      outOfStockItems: outOfStockItems.slice(0, 20), // Top 20 out of stock
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