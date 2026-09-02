import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, orderTotal, items = [] } = body;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: { equals: code.toUpperCase(), mode: 'insensitive' },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }

    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      return NextResponse.json({
        error: `Minimum order of ₹${coupon.minOrderValue.toLocaleString('en-IN')} required`
      }, { status: 400 });
    }

    let eligibleItemsTotal = 0;
    let eligibleItemsCount = 0;
    let excludedCount = 0;
    const isCategorySpecific = coupon.applicableCategories?.length > 0;

    // ✅ Parse per-category brand exclusions
    const brandExclusions = coupon.categoryBrandExclusions || {};
    // brandExclusions format: { "categoryId1": ["Brand A", "Brand B"], "categoryId2": ["Brand C"] }

    if (items.length > 0) {
      const productIds = items.map(i => i.productId).filter(Boolean);

      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          brand: true,
          categoryId: true,
          category: { select: { id: true, name: true, slug: true } }
        }
      });

      const productMap = {};
      products.forEach(p => { productMap[p.id] = p; });

      eligibleItemsTotal = items.reduce((sum, item) => {
        const product = productMap[item.productId];
        if (!product) return sum;

        const brandName = (product.brand || item.brand || '').trim();
        const brandLower = brandName.toLowerCase();
        const categoryId = String(product.categoryId || item.categoryId || '');
        const categorySlug = (product.category?.slug || item.categorySlug || '').toLowerCase();
        const categoryName = (product.category?.name || item.categoryName || '').toLowerCase();

        // 1. Check Category Restriction
        if (isCategorySpecific) {
          const isCategoryMatch = coupon.applicableCategories.some(catId => {
            const catIdLower = String(catId).toLowerCase();
            return (
              String(catId) === categoryId ||
              catIdLower === categorySlug ||
              catIdLower === categoryName.replace(/\s+/g, '-')
            );
          });
          if (!isCategoryMatch) return sum;
        }

        // 2. ✅ Check Per-Category Brand Exclusion
        // Only exclude brand if it's in the exclusion list FOR THIS SPECIFIC CATEGORY
        const excludedBrandsForThisCategory = brandExclusions[categoryId] || [];
        if (excludedBrandsForThisCategory.length > 0) {
          const isBrandExcluded = excludedBrandsForThisCategory.some(
            b => b.trim().toLowerCase() === brandLower
          );
          if (isBrandExcluded) {
            excludedCount += (item.quantity || 1);
            return sum; // Skip this item from discount
          }
        }

        // ✅ Item is eligible
        eligibleItemsCount += (item.quantity || 1);
        return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
      }, 0);

      if (eligibleItemsTotal === 0) {
        return NextResponse.json({
          error: excludedCount > 0
            ? 'All items in your cart are from excluded brands for this coupon.'
            : 'No eligible items found for this coupon.'
        }, { status: 400 });
      }
    } else {
      eligibleItemsTotal = orderTotal;
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((eligibleItemsTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, eligibleItemsTotal);
    }

    return NextResponse.json({
      success: true,
      discountAmount,
      couponCode: coupon.code,
      couponDescription: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      isCategorySpecific,
      eligibleItemsCount,
      eligibleItemsTotal,
      message: excludedCount > 0
        ? `🎉 Saved ₹${discountAmount} (${excludedCount} excluded brand items skipped).`
        : `🎉 Coupon applied! You saved ₹${discountAmount}.`,
    });
  } catch (error) {
    console.error('Coupon apply error:', error);
    return NextResponse.json({ error: 'Failed to apply coupon' }, { status: 500 });
  }
}