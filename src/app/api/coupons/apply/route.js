import { NextResponse } from 'next/server';
import { evaluateCoupon } from '@/lib/coupons';

export async function POST(request) {
  try {
    const { code, orderTotal, items = [] } = await request.json();

    const result = await evaluateCoupon({ code, orderTotal, items });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { coupon, discountAmount, isCategorySpecific, eligibleItemsCount, eligibleItemsTotal, excludedCount } = result;

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
