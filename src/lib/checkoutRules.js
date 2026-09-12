// src/lib/checkoutRules.js

export const ELIGIBLE_GUNTUR_PINCODES = [
  '522001', '522002', '522003', '522004', '522006', '522007', '522034',
];

export const MAX_COD_LIMIT_NON_GUNTUR = 4000;
export const MIN_FOOD_ORDER_VALUE = 1500;
export const NON_FOOD_COMBO_THRESHOLD = 500;
export const BABY_FOOD_CATEGORY_ID = '6a5473f71736df8447776561';

export function isFoodItem(item) {
  if (!item) return false;
  const catId = String(item.categoryId || item.category?.id || item.category?._id || item.category || '');
  const catSlug = (item.categorySlug || item.category?.slug || '').toString().toLowerCase();
  const catName = (item.categoryName || item.category?.name || '').toString().toLowerCase();

  return (
    item.isFood === true ||
    !!item.foodCategory ||
    catId === BABY_FOOD_CATEGORY_ID ||
    catSlug.includes('food') ||
    catName.includes('food')
  );
}

/**
 * Validates checkout conditions for Food MOV and Cash On Delivery (COD) eligibility
 */
export function validateCheckoutRules({
  cartItems = [],
  pincode = '',
  isCodAdminEnabled = true,
  finalTotal = null,
}) {
  let foodTotal = 0;
  let nonFoodTotal = 0;

  cartItems.forEach((item) => {
    const unitPrice = Number(item.discountPrice ?? item.price ?? 0);
    const qty = Number(item.quantity || 1);
    const lineTotal = unitPrice * qty;

    if (isFoodItem(item)) {
      foodTotal += lineTotal;
    } else {
      nonFoodTotal += lineTotal;
    }
  });

  const cartSubtotal = foodTotal + nonFoodTotal;
  const effectiveTotal = finalTotal !== null ? Number(finalTotal) : cartSubtotal;

  const hasFood = foodTotal > 0;
  const hasNonFood = nonFoodTotal > 0;
  const isOnlyFood = hasFood && !hasNonFood;

  // --------------------------------------------------------------------------
  // Rule 1: Food Minimum Order Value (₹1,500 OR Waived if Non-Food >= ₹500)
  // --------------------------------------------------------------------------
  let isFoodMovValid = true;
  let foodMovError = '';

  if (hasFood) {
    if (nonFoodTotal >= NON_FOOD_COMBO_THRESHOLD) {
      // Food MOV requirement is waived because Non-Food products >= ₹500 are in cart
      isFoodMovValid = true;
    } else if (foodTotal >= MIN_FOOD_ORDER_VALUE) {
      // Met because Food total is >= ₹1,500
      isFoodMovValid = true;
    } else {
      isFoodMovValid = false;
      const neededFood = Math.ceil(MIN_FOOD_ORDER_VALUE - foodTotal);
      const neededNonFood = Math.ceil(NON_FOOD_COMBO_THRESHOLD - nonFoodTotal);
      foodMovError = `Food orders require a minimum value of ₹${MIN_FOOD_ORDER_VALUE}. Add food items worth ₹${neededFood} more, OR add non-food products worth ₹${neededNonFood} to waive this minimum.`;
    }
  }

  // --------------------------------------------------------------------------
  // Rule 2: Cash on Delivery (COD) Rules
  // - Admin switch check
  // - COD is DISABLED if cart contains ONLY food products
  // - For NON-GUNTUR pincodes: COD allowed ONLY if total <= ₹4,000
  // - For GUNTUR pincodes: NO ₹4,000 LIMIT (unlimited order total)
  // --------------------------------------------------------------------------
  const normalizedPin = String(pincode || '').trim();
  const isGunturPincode = ELIGIBLE_GUNTUR_PINCODES.includes(normalizedPin);

  let isCodAvailable = true;
  let codDisabledReason = '';

  if (!isCodAdminEnabled) {
    isCodAvailable = false;
    codDisabledReason = 'Cash on Delivery is currently disabled by store admin.';
  } else if (isOnlyFood) {
    isCodAvailable = false;
    codDisabledReason = 'Cash on Delivery is not available for orders containing only food items.';
  } else if (!isGunturPincode && effectiveTotal > MAX_COD_LIMIT_NON_GUNTUR) {
    isCodAvailable = false;
    codDisabledReason = `Cash on Delivery for addresses outside Guntur is only available for orders up to ₹${MAX_COD_LIMIT_NON_GUNTUR.toLocaleString('en-IN')}.`;
  }

  return {
    foodTotal,
    nonFoodTotal,
    cartSubtotal,
    effectiveTotal,
    hasFood,
    isOnlyFood,
    isFoodMovValid,
    foodMovError,
    isCodAvailable,
    codDisabledReason,
    isGunturPincode,
  };
}