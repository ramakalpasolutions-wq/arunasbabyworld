'use client';
import { createContext, useContext, useReducer, useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';

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

// Dynamic Pricing Utility: Guntur residents get 10% discount on food items
export function getEffectiveItemPrice(item, isGuntur) {
  const basePrice = Number(item.discountPrice || item.price || 0);
  if (isGuntur && isFoodItem(item)) {
    return Math.round(basePrice * 0.9); // Apply 10% discount and round off float issues
  }
  return basePrice;
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
      baseShipping = 0; // Free shipping for Guntur residents
    } else {
      if (totalFoodQty >= 2) {
        baseShipping = 0; // Free shipping for food orders of 2+ items outside Guntur
      } else {
        baseShipping = STANDARD_SHIPPING_FEE;
      }
    }
  } else {
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

    case 'SET_ADDRESSES': {
      const addresses = action.payload || [];
      let selectedIndex = state.selectedAddressIndex;
      
      if (addresses.length > 0) {
        const defIdx = addresses.findIndex(a => a.isDefault);
        selectedIndex = defIdx !== -1 ? defIdx : 0;
      } else {
        selectedIndex = null;
      }
      return { ...state, addresses, selectedAddressIndex: selectedIndex };
    }
    case 'SELECT_ADDRESS':
      return { ...state, selectedAddressIndex: action.payload };

    // ✅ Sync prices, stock levels, names, and images directly from the Master Database
    case 'SYNC_ITEMS': {
      const syncedItems = state.items.map(item => {
        const itemId = item.id || item._id;
        const freshDbProduct = action.payload.find(p => p.id === itemId);
        if (freshDbProduct) {
          return {
            ...item,
            name: freshDbProduct.name,
            price: freshDbProduct.price,
            discountPrice: freshDbProduct.discountPrice,
            stock: freshDbProduct.stock,
            images: freshDbProduct.images || item.images,
            image: freshDbProduct.images?.[0]?.url || item.image,
          };
        }
        return item;
      }).filter(item => {
        // Automatically eject products that have been disabled (isActive: false) or deleted by admin
        const freshDbProduct = action.payload.find(p => p.id === (item.id || item._id));
        if (freshDbProduct) {
          return freshDbProduct.isActive !== false;
        }
        return true;
      });

      return { ...state, items: syncedItems };
    }

    case 'HYDRATE':
      return { ...initialState, ...action.payload, addresses: state.addresses, selectedAddressIndex: state.selectedAddressIndex };
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
  const { data: session } = useSession();
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // 1. Hydrate Cart from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        dispatch({ type: 'HYDRATE', payload: JSON.parse(saved) });
      } catch {}
    }
    setIsHydrated(true);
  }, []);

  // 2. Save Cart changes to LocalStorage safely
  useEffect(() => {
    if (isHydrated) {
      const { items, coupon } = state;
      localStorage.setItem('cart', JSON.stringify({ items, coupon }));
    }
  }, [state.items, state.coupon, isHydrated]);

  // 3. ✅ REAL-TIME DB PRICING & STOCK SYNCER
  // Runs immediately after hydration is completed to fetch and apply correct database modifications
  useEffect(() => {
    if (!isHydrated || state.items.length === 0) return;

    const syncCartWithDatabase = async () => {
      try {
        const ids = state.items.map(i => i.id || i._id).filter(Boolean);
        const syncedResults = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await fetch(`/api/products/${id}`);
              if (!res.ok) return null;
              const data = await res.json();
              if (!data.product) return null;
              return {
                id,
                name: data.product.name,
                price: data.product.price,
                discountPrice: data.product.discountPrice,
                stock: data.product.stock,
                images: data.product.images,
                isActive: data.product.isActive
              };
            } catch {
              return null;
            }
          })
        );

        const freshData = syncedResults.filter(Boolean);
        if (freshData.length > 0) {
          dispatch({ type: 'SYNC_ITEMS', payload: freshData });
        }
      } catch (err) {
        console.error("Cart price sync error:", err);
      }
    };

    syncCartWithDatabase();
  }, [isHydrated]);

  // 4. Fetch persistent address list from DB on login (Amazon / Flipkart Style)
  useEffect(() => {
    if (session) {
      setLoadingAddresses(true);
      fetch('/api/users/addresses')
        .then(res => res.json())
        .then(data => {
          dispatch({ type: 'SET_ADDRESSES', payload: data.addresses || [] });
        })
        .catch(err => console.error("Error fetching addresses:", err))
        .finally(() => setLoadingAddresses(false));
    }
  }, [session]);

  // Persistent DB Address Mutation Helpers
  const addAddress = async (addressForm) => {
    const res = await fetch('/api/users/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressForm),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save address');
    dispatch({ type: 'SET_ADDRESSES', payload: data.addresses });
  };

  const updateAddress = async (index, addressForm) => {
    const res = await fetch(`/api/users/addresses?index=${index}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressForm),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update address');
    dispatch({ type: 'SET_ADDRESSES', payload: data.addresses });
  };

  const deleteAddress = async (index) => {
    const res = await fetch(`/api/users/addresses?index=${index}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete address');
    dispatch({ type: 'SET_ADDRESSES', payload: data.addresses });
  };

  const setDefaultAddress = async (index) => {
    const res = await fetch(`/api/users/addresses?index=${index}&action=setDefault`, {
      method: 'PUT',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update default address');
    dispatch({ type: 'SET_ADDRESSES', payload: data.addresses });
  };

  const selectAddress = (index) => {
    dispatch({ type: 'SELECT_ADDRESS', payload: index });
  };

  const selectedAddress = useMemo(() => {
    return state.selectedAddressIndex !== null && state.addresses?.[state.selectedAddressIndex]
      ? state.addresses[state.selectedAddressIndex]
      : null;
  }, [state.selectedAddressIndex, state.addresses]);

  const isGuntur = useMemo(() => {
    return selectedAddress ? isGunturAddress(selectedAddress) : false;
  }, [selectedAddress]);

  const itemsPrice = useMemo(() => {
    return state.items.reduce(
      (acc, i) => acc + getEffectiveItemPrice(i, isGuntur) * i.quantity, 0
    );
  }, [state.items, isGuntur]);

  const shippingInfo = useMemo(() => {
    return calculateShippingFee({
      items: state.items,
      subtotal: itemsPrice,
      address: selectedAddress,
      paymentMethod,
    });
  }, [state.items, itemsPrice, selectedAddress, paymentMethod]);

  const shippingPrice = shippingInfo.totalShipping;
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
        isGuntur,
        hasFoodItems: shippingInfo.hasFood,
        paymentMethod,
        setPaymentMethod,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        taxPrice: 0,
        discountAmount,
        totalPrice,
        totalItems,
        cartCount: totalItems,
        cartTotal: totalPrice,
        loadingAddresses,
        
        addresses: state.addresses || [],
        selectedAddressIndex: state.selectedAddressIndex,
        selectedAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        selectAddress,
        
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