'use client';
import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// ═══════════════════════════════════════
// SHIPPING RULES
// - Food category → ALWAYS ₹50 (any cart value)
// - Non-food ≥ ₹800 → FREE
// - Non-food < ₹800 → ₹50
// ═══════════════════════════════════════
const SHIPPING_FEE = 50;
const FREE_SHIPPING_THRESHOLD = 800;

const isFoodItem = (item) => {
  const catSlug = (
    item.categorySlug ||
    item.category?.slug ||
    (typeof item.category === 'string' ? item.category : '') ||
    ''
  ).toLowerCase();

  const catName = (
    item.categoryName ||
    item.category?.name ||
    ''
  ).toLowerCase();

  const foodCat = (item.foodCategory || '').toLowerCase();

  return (
    catSlug.includes('food') ||
    catName.includes('food') ||
    catSlug.includes('baby-food') ||
    catName.includes('baby food') ||
    Boolean(foodCat) ||
    item.isFood === true
  );
};

const calculateShipping = (items, subtotal) => {
  if (!items || items.length === 0) return 0;

  const hasFood = items.some(isFoodItem);

  // Food items → always charge shipping
  if (hasFood) return SHIPPING_FEE;

  // Non-food → free above ₹800
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;

  return SHIPPING_FEE;
};

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

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  const itemsPrice = state.items.reduce(
    (acc, i) => acc + (i.discountPrice || i.price) * i.quantity, 0
  );

  // ✅ NEW shipping logic
  const shippingPrice = calculateShipping(state.items, itemsPrice);
  const hasFoodItems = state.items.some(isFoodItem);

  const taxPrice = 0;
  const discountAmount = state.coupon ? state.coupon.discountAmount || 0 : 0;
  const totalPrice = Math.round(itemsPrice + shippingPrice - discountAmount);
  const totalItems = state.items.reduce((acc, i) => acc + i.quantity, 0);

  const selectedAddress =
    state.selectedAddressIndex !== null && state.addresses?.[state.selectedAddressIndex]
      ? state.addresses[state.selectedAddressIndex]
      : null;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        cart: state.items,
        coupon: state.coupon,
        itemsPrice,
        shippingPrice,
        hasFoodItems, // ✅ exposed for UI messages
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