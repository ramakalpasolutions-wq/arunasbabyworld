'use client';
import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // ✅ Support both id and _id
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
    case 'HYDRATE':
      return action.payload;
    default:
      return state;
  }
};

const initialState = { items: [], coupon: null };

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
  const shippingPrice = itemsPrice > 499 ? 0 : 49;
  const taxPrice = Math.round(itemsPrice * 0.05);
  const discountAmount = state.coupon ? state.coupon.discountAmount || 0 : 0;
  const totalPrice = itemsPrice + shippingPrice + taxPrice - discountAmount;
  const totalItems = state.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        cart: state.items,
        coupon: state.coupon,
        itemsPrice,
        shippingPrice,
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