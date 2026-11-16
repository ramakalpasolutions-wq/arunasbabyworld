import prisma from '@/lib/prisma';

/**
 * Validate a coupon and compute its discount.
 * Shared by /api/coupons/apply (preview) and /api/orders (authoritative).
 *
 * items: [{ productId, quantity, price, brand?, categoryId?, categorySlug?, categoryName? }]
 * Returns { error } on failure, otherwise the computed result.
 */
export async function evaluateCoupon({ code, orderTotal, items = [] }) {
  if (!code) return { error: 'Coupon code is required' };

  const coupon = await prisma.coupon.findFirst({
    where: { code: { equals: String(code).toUpperCase(), mode: 'insensitive' } },
  });

  if (!coupon) return { error: 'Invalid coupon code' };
  if (!coupon.isActive) return { error: 'This coupon is no longer active' };
  if (new Date() > new Date(coupon.expiryDate)) return { error: 'This coupon has expired' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { error: 'Coupon usage limit reached' };
  }
  if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
    return { error: `Minimum order of ₹${coupon.minOrderValue.toLocaleString('en-IN')} required` };
  }

  let eligibleItemsTotal = 0;
  let eligibleItemsCount = 0;
  let excludedCount = 0;
  const isCategorySpecific = coupon.applicableCategories?.length > 0;

  // { "categoryId1": ["Brand A", "Brand B"], ... }
  const brandExclusions = coupon.categoryBrandExclusions || {};

  if (items.length > 0) {
    const productIds = items.map(i => i.productId).filter(Boolean);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        brand: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    eligibleItemsTotal = items.reduce((sum, item) => {
      const product = productMap[item.productId];
      if (!product) return sum;

      const brandLower = (product.brand || item.brand || '').trim().toLowerCase();
      const categoryId = String(product.categoryId || item.categoryId || '');
      const categorySlug = (product.category?.slug || item.categorySlug || '').toLowerCase();
      const categoryName = (product.category?.name || item.categoryName || '').toLowerCase();

      // 1. Category restriction
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

      // 2. Per-category brand exclusion
      const excludedBrands = brandExclusions[categoryId] || [];
      if (excludedBrands.some(b => b.trim().toLowerCase() === brandLower)) {
        excludedCount += (item.quantity || 1);
        return sum;
      }

      eligibleItemsCount += (item.quantity || 1);
      return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }, 0);

    if (eligibleItemsTotal === 0) {
      return {
        error: excludedCount > 0
          ? 'All items in your cart are from excluded brands for this coupon.'
          : 'No eligible items found for this coupon.',
      };
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

  return {
    coupon,
    discountAmount,
    isCategorySpecific,
    eligibleItemsCount,
    eligibleItemsTotal,
    excludedCount,
  };
}
