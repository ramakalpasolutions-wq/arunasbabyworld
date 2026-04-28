'use client';
import { createContext, useContext, useReducer, useEffect } from 'react';

const WishlistContext = createContext();

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'ADD':
      // ✅ Support both id and _id
      if (state.items.find((i) => (i.id || i._id) === (action.payload.id || action.payload._id))) return state;
      return { items: [...state.items, action.payload] };
    case 'REMOVE':
      return { items: state.items.filter((i) => (i.id || i._id) !== action.payload) };
    case 'TOGGLE':
      if (state.items.find((i) => (i.id || i._id) === (action.payload.id || action.payload._id))) {
        return { items: state.items.filter((i) => (i.id || i._id) !== (action.payload.id || action.payload._id)) };
      }
      return { items: [...state.items, action.payload] };
    case 'HYDRATE':
      return action.payload;
    default:
      return state;
  }
};

export function WishlistProvider({ children }) {
  const [state, dispatch] = useReducer(wishlistReducer, { items: [] });

  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      try {
        dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(state));
  }, [state]);

  // ✅ Support both id and _id
  const isInWishlist = (id) => state.items.some((i) => (i.id || i._id) === id);
  const isWishlisted = isInWishlist;

  return (
    <WishlistContext.Provider value={{
      items: state.items,
      wishlist: state.items,
      isInWishlist,
      isWishlisted,
      toggle: (item) => dispatch({ type: 'TOGGLE', payload: item }),
      add: (item) => dispatch({ type: 'ADD', payload: item }),
      addToWishlist: (item) => dispatch({ type: 'ADD', payload: item }),
      remove: (id) => dispatch({ type: 'REMOVE', payload: id }),
      removeFromWishlist: (id) => dispatch({ type: 'REMOVE', payload: id }),
      wishlistCount: state.items.length,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};