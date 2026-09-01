'use client';
import { createContext, useContext, useReducer, useEffect, useState } from 'react';

const CartContext = createContext();

export const STANDARD_SHIPPING_FEE = 50;
export const COD_EXTRA_FEE = 20;
export const FREE_SHIPPING_THRESHOLD = 800;
export const BABY_FOOD_CATEGORY_ID = '6a5473f71736df8447776561';

export function isGunturAddress(address) {
  if (!address) return false;
  const city = (address.city || '').toLowerCase().trim();
  const pincode = (address.pincode || '').toString().trim();
  return city.includes('guntur') || pincode.startsWith('522');
}

export function isFoodItem(item) {
  const catId = String(item.categoryId || item.category?.id || item.category?._id || item.category || '');
  const catSlug = (item.categorySlug || item.category?.slug || '').toString().toLowerCase();
  const catName = (item.categoryName || item.category?.name || '').toString().toLowerCase();
  const foodCat = (item.foodCategory || '').toLowerCase();

  return (
    item.isFood === true ||
    catId === BABY_FOOD_CATEGORY_ID ||
    catSlug.includes('food') ||
    catName.includes('food') ||
    catSlug.includes('baby-food') ||
    catName.includes('baby food') ||
    Boolean(foodCat)
  );
}

export function calculateShippingFee({ items, subtotal, address, paymentMethod }) {
  if (!items || items.length === 0) {
    return { baseShipping: 0, codFee: 0, totalShipping: 0, isGuntur: false, hasFood: false, isCOD: false };
  }

  const isGuntur = isGunturAddress(address);
  const foodItems = items.filter(isFoodItem);
  const nonFoodItems = items.filter(item => !isFoodItem(item));
  const isOnlyFood = foodItems.length > 0 && nonFoodItems.length === 0;
  const totalFoodQty = foodItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const isCOD = paymentMethod === 'COD';

  let baseShipping = 0;

  if (isOnlyFood) {
    if (isGuntur) {
      baseShipping = 0; // Guntur residents get free shipping for food-only orders
    } else {
      if (totalFoodQty >= 4) {
        baseShipping = 0; // Food-only orders with 4 or more items get free shipping outside Guntur
      } else {
        baseShipping = STANDARD_SHIPPING_FEE; // Standard fee for food orders under 4 items
      }
    }
  } else {
    // Mixed or Non-food order rules
    const hasFood = foodItems.length > 0;
    if (hasFood && !isGuntur) {
      baseShipping = STANDARD_SHIPPING_FEE;
    } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
      baseShipping = 0;
    } else {
      baseShipping = STANDARD_SHIPPING_FEE;
    }
  }

  const codFee = isCOD ? COD_EXTRA_FEE : 0;
  const totalShipping = baseShipping + codFee;

  return {
    baseShipping,
    codFee,
    totalShipping,
    isGuntur,
    hasFood: foodItems.length > 0,
    isCOD,
  };
}

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const itemId = action.payload.id || action.payload._id;
      const existing = state.items.find((i) => (i.id || i._id) === itemId);
      if (existing) {
        const updated = state.items.map((i) =>
          (i.id || i._id) === itemId
            ? { ...i, quantity: i.quantity + (action.payload.quantity || 1) }
            : i
        );
        return { ...state, items: updated };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => (i.id || i._id) !== action.payload),
      };
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => (i.id || i._id) !== action.payload.id),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          (i.id || i._id) === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'SET_COUPON':
      return { ...state, coupon: action.payload };
    case 'REMOVE_COUPON':
      return { ...state, coupon: null };

    case 'SET_ADDRESSES':
      return { ...state, addresses: action.payload };
    case 'ADD_ADDRESS':
      return { ...state, addresses: [...(state.addresses || []), action.payload] };
    case 'UPDATE_ADDRESS':
      return {
        ...state,
        addresses: (state.addresses || []).map((a, i) =>
          i === action.payload.index ? action.payload.address : a
        ),
      };
    case 'DELETE_ADDRESS':
      return {
        ...state,
        addresses: (state.addresses || []).filter((_, i) => i !== action.payload),
        selectedAddressIndex:
          state.selectedAddressIndex === action.payload
            ? null
            : state.selectedAddressIndex > action.payload
              ? state.selectedAddressIndex - 1
              : state.selectedAddressIndex,
      };
    case 'SELECT_ADDRESS':
      return { ...state, selectedAddressIndex: action.payload };

    case 'HYDRATE':
      return { ...initialState, ...action.payload };
    default:
      return state;
  }
};

const initialState = {
  items: [],
  coupon: null,
  addresses: [],
  selectedAddressIndex: null,
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Hydrate once on mount safely
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) });
      } catch (err) {
        console.error("Hydration error:", err);
      }
    }
    setIsHydrated(true);
  }, []);

  // 2. Save only AFTER hydration is complete to prevent empty array overwrites
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('cart', JSON.stringify(state));
    }
  }, [state, isHydrated]);

  const selectedAddress =
    state.selectedAddressIndex !== null && state.addresses?.[state.selectedAddressIndex]
      ? state.addresses[state.selectedAddressIndex]
      : null;

  const itemsPrice = state.items.reduce(
    (acc, i) => acc + (i.discountPrice || i.price) * i.quantity, 0
  );

  const shippingInfo = calculateShippingFee({
    items: state.items,
    subtotal: itemsPrice,
    address: selectedAddress,
    paymentMethod,
  });

  const shippingPrice = shippingInfo.totalShipping;
  const taxPrice = 0;
  const discountAmount = state.coupon ? state.coupon.discountAmount || 0 : 0;
  const totalPrice = Math.max(0, Math.round(itemsPrice + shippingPrice - discountAmount));
  const totalItems = state.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        cart: state.items,
        coupon: state.coupon,
        itemsPrice,
        shippingPrice,
        baseShipping: shippingInfo.baseShipping,
        codFee: shippingInfo.codFee,
        isGuntur: shippingInfo.isGuntur,
        hasFoodItems: shippingInfo.hasFood,
        paymentMethod,
        setPaymentMethod,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        taxPrice,
        discountAmount,
        totalPrice,
        totalItems,
        cartCount: totalItems,
        cartTotal: totalPrice,
        dispatch,
        addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
        addToCart: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
        removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
        removeFromCart: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
        updateQuantity: (id, quantity) =>
          dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
        clearCart: () => dispatch({ type: 'CLEAR_CART' }),
        setCoupon: (coupon) => dispatch({ type: 'SET_COUPON', payload: coupon }),
        removeCoupon: () => dispatch({ type: 'REMOVE_COUPON' }),

        addresses: state.addresses || [],
        selectedAddressIndex: state.selectedAddressIndex,
        selectedAddress,
        addAddress: (address) => dispatch({ type: 'ADD_ADDRESS', payload: address }),
        updateAddress: (index, address) =>
          dispatch({ type: 'UPDATE_ADDRESS', payload: { index, address } }),
        deleteAddress: (index) => dispatch({ type: 'DELETE_ADDRESS', payload: index }),
        selectAddress: (index) => dispatch({ type: 'SELECT_ADDRESS', payload: index }),
        setAddresses: (addresses) => dispatch({ type: 'SET_ADDRESSES', payload: addresses }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};