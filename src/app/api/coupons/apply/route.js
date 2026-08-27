import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { code, orderTotal = 0, items = [] } = await request.json();
    if (!code) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });

    // 1. Fetch the Coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    if (!coupon.isActive) return NextResponse.json({ error: 'Coupon is inactive' }, { status: 400 });
    
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ error: 'Coupon is expired' }, { status: 400 });
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    // 2. Extract applicable categories (array of IDs)
    const applicableCategories = coupon.applicableCategories || [];
    const hasCategoryRestriction = applicableCategories.length > 0;

    let eligibleTotal = 0;
    let eligibleItemsCount = 0;

    // 3. Verify Cart Items against coupon category restrictions
    if (hasCategoryRestriction) {
      if (!items || items.length === 0) {
        return NextResponse.json(
          { error: 'Cart items are required to verify this category coupon.' },
          { status: 400 }
        );
      }

      // Fetch products from database to ensure category definitions are genuine and tamper-proof
      const productIds = items.map((i) => i.productId || i.id).filter(Boolean);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true, discountPrice: true, categoryId: true },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      for (const item of items) {
        const pid = item.productId || item.id;
        const dbProduct = productMap.get(pid);

        if (!dbProduct) continue;

        // Retrieve Category ID directly from database record
        const productCategoryId = dbProduct.categoryId;

        // Determine correct item price from secure DB data falling back to client payload safely
        const securePrice = Number(dbProduct.discountPrice || dbProduct.price || item.price || 0);
        const itemQty = Number(item.quantity ?? 1);

        // Verify if product's category is included in coupon's applicableCategories list
        if (productCategoryId && applicableCategories.includes(productCategoryId)) {
          eligibleTotal += securePrice * itemQty;
          eligibleItemsCount += itemQty;
        }
      }

      // If no items in the cart match any of the allowed coupon categories
      if (eligibleItemsCount === 0 || eligibleTotal === 0) {
        // Fetch category names for a user-friendly error message
        const categoriesInDb = await prisma.category.findMany({
          where: { id: { in: applicableCategories } },
          select: { name: true },
        });
        const categoryNames = categoriesInDb.map(c => c.name).join(', ');

        return NextResponse.json(
          {
            error: `This coupon is only valid for items in: "${categoryNames || 'selected categories'}". None found in your cart.`,
          },
          { status: 400 }
        );
      }
    } else {
      // No category restriction: entire order is eligible
      eligibleTotal = Number(orderTotal) > 0 ? Number(orderTotal) : items.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity || 1)), 0);
    }

    // 4. Check Minimum Order Value against the eligible subtotal (the category item total only)
    if (coupon.minOrderValue && eligibleTotal < coupon.minOrderValue) {
      return NextResponse.json(
        {
          error: `Minimum order value of ₹${coupon.minOrderValue} required for eligible category items (Current: ₹${Math.round(eligibleTotal)})`,
        },
        { status: 400 }
      );
    }

    // 5. Calculate Discount strictly based on the ELIGIBLE amount only
    let discountAmount = 0;
    if (coupon.discountType === 'percentage' || coupon.discountType === 'PERCENTAGE') {
      discountAmount = (eligibleTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      // Fixed Amount Discount (cannot exceed eligible total)
      discountAmount = Math.min(coupon.discountValue, eligibleTotal);
    }

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        applicableCategories,
      },
      eligibleTotal: Math.round(eligibleTotal),
      discountAmount: Math.round(discountAmount),
    });
  } catch (error) {
    console.error('Coupon apply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}