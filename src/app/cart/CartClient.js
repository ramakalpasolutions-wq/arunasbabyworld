'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import styles from './CartClient.module.css';

const fmt = (val) => Math.round(val || 0).toLocaleString('en-IN');

/* ═══════════════════════════════════════
   AVAILABLE COUPONS (with category info)
═══════════════════════════════════════ */
function AvailableCoupons({ itemsPrice, onApply }) {
  const [coupons, setCoupons] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/coupons/available')
      .then(r => r.json())
      .then(d => setCoupons(d.coupons || []))
      .catch(() => {});
  }, []);

  if (coupons.length === 0) return null;
  const displayCoupons = showAll ? coupons : coupons.slice(0, 2);

  return (
    <div style={{ marginBottom: '14px' }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: '#333', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        🎟️ Available Coupons
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayCoupons.map(c => {
          const eligible = itemsPrice >= (c.minOrderValue || 0);
          const remaining = (c.minOrderValue || 0) - itemsPrice;
          const isCategorySpecific = c.applicableCategories && c.applicableCategories.length > 0;
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: eligible ? '#f0fdf4' : '#fafafa', border: `1.5px dashed ${eligible ? '#10b981' : '#ddd'}`, borderRadius: '10px', opacity: eligible ? 1 : 0.7, gap: '8px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: '800', fontSize: '13px', color: '#1a1a2e', fontFamily: 'monospace', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', letterSpacing: '1px' }}>
                    {c.code}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#ff6b9d' }}>
                    {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                  </span>
                  {/* Show badge if category-specific */}
                  {isCategorySpecific && (
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff', background: '#f59e0b', padding: '2px 6px', borderRadius: '4px' }}>
                      CATEGORY
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>
                  {c.minOrderValue > 0 ? `Min order: ₹${c.minOrderValue.toLocaleString('en-IN')}` : 'No minimum order'}
                  {c.maxDiscount ? ` • Max: ₹${c.maxDiscount}` : ''}
                </p>
                {/* Show description */}
                {c.description && (
                  <p style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '600', margin: '3px 0 0' }}>
                    📢 {c.description}
                  </p>
                )}
              </div>
              <button onClick={() => eligible && onApply(c.code)} disabled={!eligible} style={{ background: eligible ? 'linear-gradient(135deg, #ff6b9d, #7c3aed)' : '#e5e7eb', color: eligible ? 'white' : '#999', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: eligible ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {eligible ? 'Apply' : `₹${remaining.toLocaleString('en-IN')} more`}
              </button>
            </div>
          );
        })}
      </div>
      {coupons.length > 2 && (
        <button onClick={() => setShowAll(!showAll)} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginTop: '6px', padding: '4px 0' }}>
          {showAll ? '← Show less' : `View all ${coupons.length} coupons →`}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN CART CLIENT
═══════════════════════════════════════ */
export default function CartClient() {
  const router = useRouter();
  const { data: session } = useSession();

  const {
    items,
    updateQuantity,
    removeItem,
    itemsPrice,
    shippingPrice,
    hasFoodItems,        
    freeShippingThreshold,
    discountAmount,
    totalPrice,
    coupon,
    setCoupon,
    removeCoupon,
    clearCart,
    addresses,
    selectedAddress,
    selectedAddressIndex,
    addAddress,
    updateAddress,
    deleteAddress,
    selectAddress,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [stockMap, setStockMap] = useState({});

  // Panel states
  const [showAddressPanel, setShowAddressPanel] = useState(false);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [addressForm, setAddressForm] = useState({
    name: '', phone: '', address: '', city: '', state: '', pincode: '',
  });

  // Auto-select first address if only one exists
  useEffect(() => {
    if (addresses.length === 1 && selectedAddressIndex === null) {
      selectAddress(0);
    }
  }, [addresses.length]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = (showAddressPanel || showPaymentPanel) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showAddressPanel, showPaymentPanel]);

  // Fetch live stock
  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map(i => i.id || i._id).filter(Boolean);
    if (ids.length === 0) return;

    Promise.all(
      ids.map(id =>
        fetch(`/api/products/${id}`)
          .then(r => r.json())
          .then(d => ({ id, stock: d.product?.stock ?? 0 }))
          .catch(() => ({ id, stock: 0 }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { map[r.id] = r.stock; });
      setStockMap(map);
    });
  }, [items.length]);

  const getMaxStock = (item) => {
    const id = item.id || item._id;
    if (stockMap[id] !== undefined) return stockMap[id];
    return item.stock ?? 999;
  };

  const handleQtyChange = (item, newQty) => {
    if (newQty < 1) return;
    const maxStock = getMaxStock(item);
    if (maxStock === 0) { toast.error(`❌ ${item.name} is out of stock!`); return; }
    if (newQty > maxStock) { toast.error(`⚠️ Only ${maxStock} available!`); return; }
    updateQuantity(item.id || item._id, newQty);
  };

  // ✅ FIXED PAYLOAD: Send 'items' (not 'cartItems') to match API expectations
  const applyCoupon = async (code) => {
    const codeToApply = code || couponCode;
    if (!codeToApply.trim()) return;
    setApplying(true);
    try {
      const res = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToApply,
          orderTotal: itemsPrice,
          items: items.map(i => ({
            productId: i.id || i._id,
            quantity: i.quantity,
            price: i.discountPrice || i.price,
            category: i.category,
            categoryId: i.categoryId
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupon({ code: codeToApply.toUpperCase(), discountAmount: data.discountAmount });
      setCouponCode('');
      toast.success(`🎉 Coupon applied! Saved ₹${data.discountAmount}`);
    } catch (err) {
      toast.error(err.message || 'Invalid coupon');
    } finally {
      setApplying(false);
    }
  };

  // ✅ FIXED PAYLOAD: Revalidation updated to send 'items'
  useEffect(() => {
    if (!coupon?.code || items.length === 0) return;

    const revalidate = async () => {
      try {
        const res = await fetch('/api/coupons/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: coupon.code,
            orderTotal: itemsPrice,
            items: items.map(i => ({
              productId: i.id || i._id,
              quantity: i.quantity,
              price: i.discountPrice || i.price,
              category: i.category,
              categoryId: i.categoryId
            })),
          }),
        });
        const data = await res.json();
        if (res.ok) {
          // Update discount if amount changed
          if (data.discountAmount !== discountAmount) {
            setCoupon({ code: coupon.code, discountAmount: data.discountAmount });
          }
        } else {
          // Coupon no longer valid — remove it
          removeCoupon();
          toast.error(`Coupon "${coupon.code}" removed: ${data.error}`);
        }
      } catch (err) {
        console.error('Coupon revalidation error:', err);
      }
    };

    const timer = setTimeout(revalidate, 600); // debounce
    return () => clearTimeout(timer);
  }, [items, coupon?.code, itemsPrice]);

  const hasStockIssue = items.some(item => {
    const maxStock = getMaxStock(item);
    return item.quantity > maxStock || maxStock === 0;
  });

  // ═══════════════════════════════════════
  // ADDRESS HANDLERS
  // ═══════════════════════════════════════
  const openAddAddress = () => {
    setAddressForm({ name: '', phone: '', address: '', city: '', state: '', pincode: '' });
    setEditingIndex(null);
    setShowAddressForm(true);
    setShowAddressPanel(true);
  };

  const openEditAddress = (index) => {
    setAddressForm(addresses[index]);
    setEditingIndex(index);
    setShowAddressForm(true);
    setShowAddressPanel(true);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const { name, phone, address, city, state, pincode } = addressForm;
    if (!name || !phone || !address || !city || !state || !pincode) {
      toast.error('Please fill all fields');
      return;
    }
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      toast.error('Enter valid 10-digit phone');
      return;
    }
    if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      toast.error('Enter valid 6-digit pincode');
      return;
    }

    if (editingIndex !== null) {
      updateAddress(editingIndex, addressForm);
      toast.success('✅ Address updated');
    } else {
      addAddress(addressForm);
      selectAddress(addresses.length);
      toast.success('✅ Address saved');
    }

    setShowAddressForm(false);
    setEditingIndex(null);
  };

  const handleSelectAddress = (index) => {
    selectAddress(index);
    setShowAddressPanel(false);
    toast.success('📍 Address selected');
  };

  // ═══════════════════════════════════════
  // PLACE ORDER FLOW
  // ═══════════════════════════════════════
  const handlePlaceOrder = () => {
    if (!session) {
      toast.error('Please login first');
      router.push('/login?redirect=/cart');
      return;
    }
    if (hasStockIssue) {
      toast.error('Please fix stock issues');
      return;
    }
    if (!selectedAddress) {
      toast.error('Please select delivery address');
      setShowAddressPanel(true);
      return;
    }
    setShowPaymentPanel(true);
  };

  // ═══════════════════════════════════════
  // PAYMENT HANDLERS
  // ═══════════════════════════════════════
  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleCODOrder = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItems: items.map(i => ({
            productId: i.id || i._id,
            name: i.name,
            image: i.images?.[0]?.url || '',
            price: i.discountPrice || i.price,
            quantity: i.quantity,
          })),
          shippingAddress: selectedAddress,
          paymentMethod: 'COD',
          itemsPrice,
          shippingPrice,
          taxPrice: 0,
          discountAmount,
          totalPrice,
          couponCode: coupon?.code || null,
          isPaid: false,
          paymentStatus: 'not_applicable',
          orderStatus: 'Pending',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const orderId = data.order?.id || data.order?._id;
      clearCart();
      toast.success('🎉 Order placed! Pay on delivery.', { duration: 4000 });
      router.push(`/orders/${orderId}`);
    } catch (err) {
      toast.error(err.message || 'Order failed');
      setProcessing(false);
    }
  };

  const handleRazorpayOrder = async () => {
    setProcessing(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Payment gateway failed'); setProcessing(false); return; }

      const dbRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItems: items.map(i => ({
            productId: i.id || i._id,
            name: i.name,
            image: i.images?.[0]?.url || '',
            price: i.discountPrice || i.price,
            quantity: i.quantity,
          })),
          shippingAddress: selectedAddress,
          paymentMethod: 'Razorpay',
          itemsPrice, shippingPrice, taxPrice: 0, discountAmount, totalPrice,
          couponCode: coupon?.code || null,
          isPaid: false, paymentStatus: 'pending', orderStatus: 'Pending',
        }),
      });
      const dbData = await dbRes.json();
      if (!dbRes.ok) throw new Error(dbData.error);
      const orderId = dbData.order?.id || dbData.order?._id;

      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPrice }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      clearCart();

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'Arunas Baby World',
        description: 'Baby & Kids Products',
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast.success('🎉 Payment successful!');
              router.push(`/orders/${orderId}`);
            } else {
              await fetch(`/api/orders/${orderId}/payment-failed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Verification failed' }) });
              toast.error('Payment failed');
              router.push(`/orders/${orderId}?paymentFailed=true`);
            }
          } catch (err) {
            router.push(`/orders/${orderId}?paymentFailed=true`);
          }
        },
        prefill: {
          name: selectedAddress.name,
          email: session.user.email,
          contact: selectedAddress.phone,
        },
        theme: { color: '#ff6b9d' },
        modal: {
          ondismiss: async () => {
            setProcessing(false);
            await fetch(`/api/orders/${orderId}/payment-failed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Cancelled' }) });
            toast.error('Payment cancelled');
            router.push(`/orders/${orderId}?paymentFailed=true`);
          },
        },
      });
      razorpay.on('payment.failed', async (response) => {
        await fetch(`/api/orders/${orderId}/payment-failed`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: response.error?.description }) });
        router.push(`/orders/${orderId}?paymentFailed=true`);
      });
      razorpay.open();
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
      setProcessing(false);
    }
  };

  const handlePaymentSelect = (method) => {
    setShowPaymentPanel(false);
    setTimeout(() => {
      if (method === 'COD') handleCODOrder();
      else handleRazorpayOrder();
    }, 300);
  };

  const PAYMENT_OPTIONS = [
    { id: 'card', icon: '💳', title: 'Credit/Debit Card', subtitle: 'Visa, Mastercard, RuPay', color: '#3B82F6', method: 'Razorpay' },
    { id: 'upi', icon: '📱', title: 'UPI', subtitle: 'GPay, PhonePe, Paytm', color: '#10B981', badge: 'Paytm', method: 'Razorpay', recommended: true },
    { id: 'netbanking', icon: '🏦', title: 'Net Banking', subtitle: totalPrice >= 2000 ? 'All major banks' : 'Available on orders above ₹2000', color: '#F59E0B', method: 'Razorpay', disabled: totalPrice < 2000 },
    { id: 'emi', icon: '📊', title: 'EMI', subtitle: totalPrice >= 3000 ? 'Convert to EMI' : 'Available on orders above ₹3000', color: '#8B5CF6', method: 'Razorpay', disabled: totalPrice < 3000 },
    { id: 'cod', icon: '💵', title: 'Cash on Delivery', subtitle: 'Pay when you receive', color: '#EF4444', method: 'COD' },
  ];

  if (items.length === 0) return (
    <div className={`container ${styles.empty}`}>
      <div className={styles.emptyContent}>
        <span className={styles.emptyIcon}>🛒</span>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any items yet. Start shopping!</p>
        <Link href="/products" className="btn btn-primary">🛍️ Start Shopping</Link>
      </div>
    </div>
  );

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>
        🛒 Shopping Cart <span>({items.length} items)</span>
      </h1>

      {/* DELIVERY ADDRESS STRIP */}
      {session && (
        <div style={{
          background: 'white',
          border: '2px solid #FFE4EC',
          borderRadius: '14px',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 4px 14px rgba(255,107,157,0.08)',
        }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', flexShrink: 0,
          }}>📍</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedAddress ? (
              <>
                <p style={{ margin: 0, fontSize: '0.90rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
                  Deliver to <span style={{ color: '#FF6B9D' }}>{selectedAddress.name}</span>, {selectedAddress.pincode}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#6B7280', fontWeight: '600', fontFamily: 'Nunito, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedAddress.address}, {selectedAddress.city}
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '0.90rem', fontWeight: '800', color: '#DC2626', fontFamily: 'Nunito, sans-serif' }}>
                  No delivery address selected
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#6B7280', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
                  Add an address to continue
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => setShowAddressPanel(true)}
            style={{
              padding: '8px 18px',
              background: 'white',
              border: '2px solid #FF6B9D',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: '800',
              color: '#FF6B9D',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
              letterSpacing: '0.6px',
              flexShrink: 0,
            }}
          >
            {selectedAddress ? 'CHANGE' : '+ ADD'}
          </button>
        </div>
      )}

      {/* Login prompt */}
      {!session && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)',
          border: '2px solid #FFE4EC',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
              🔒 Please login to continue
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#6B7280', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
              Login to save address & place order
            </p>
          </div>
          <Link href="/login?redirect=/cart" style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, #FF6B9D, #7B2FBE)',
            color: 'white',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '0.85rem',
            fontFamily: 'Nunito, sans-serif',
            textDecoration: 'none',
          }}>Login</Link>
        </div>
      )}

      <div className={styles.layout}>

        {/* ===== CART ITEMS ===== */}
        <div className={styles.itemsList}>
          {items.map((item) => {
            const itemId = item.id || item._id;
            const price = item.discountPrice || item.price;
            const image = item.images?.[0]?.url || `https://via.placeholder.com/100`;
            const maxStock = getMaxStock(item);
            const isOutOfStock = maxStock === 0;
            const exceedsStock = item.quantity > maxStock;
            const atMaxStock = item.quantity >= maxStock && maxStock > 0;
            const isLowStock = maxStock > 0 && maxStock <= 5;

            return (
              <div key={itemId} className={styles.cartItem} style={{
                border: exceedsStock || isOutOfStock ? '2px solid #dc2626' : undefined,
                background: exceedsStock || isOutOfStock ? '#fef2f2' : undefined,
              }}>
                <div className={styles.itemImage}>
                  <Image src={image} alt={item.name} width={100} height={100} style={{ objectFit: 'cover', borderRadius: '8px' }} />
                </div>
                <div className={styles.itemInfo}>
                  <Link href={`/products/${itemId}`} className={styles.itemName}>{item.name}</Link>
                  <div className={styles.itemPrice}>₹{price.toLocaleString('en-IN')} each</div>
                  {item.discountPrice && <div className={styles.itemOriginal}>MRP: ₹{item.price.toLocaleString('en-IN')}</div>}
                  {item.ageGroup && <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>👶 {item.ageGroup}</div>}
                  {isOutOfStock && <div style={{ display: 'inline-block', marginTop: '6px', padding: '3px 10px', background: '#dc2626', color: 'white', borderRadius: '999px', fontSize: '11px', fontWeight: '800' }}>❌ OUT OF STOCK</div>}
                  {exceedsStock && !isOutOfStock && <div style={{ display: 'inline-block', marginTop: '6px', padding: '3px 10px', background: '#dc2626', color: 'white', borderRadius: '999px', fontSize: '11px', fontWeight: '800' }}>⚠️ Only {maxStock} available</div>}
                  {!exceedsStock && !isOutOfStock && isLowStock && <div style={{ display: 'inline-block', marginTop: '6px', padding: '3px 10px', background: '#fef3c7', color: '#92400e', borderRadius: '999px', fontSize: '11px', fontWeight: '800' }}>⚠️ Only {maxStock} left</div>}
                </div>
                <div className={styles.itemControls}>
                  <div className={styles.quantityCtrl}>
                    <button onClick={() => handleQtyChange(item, item.quantity - 1)} disabled={item.quantity <= 1} style={{ opacity: item.quantity <= 1 ? 0.4 : 1, cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer' }}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleQtyChange(item, item.quantity + 1)} disabled={atMaxStock || isOutOfStock} style={{ opacity: (atMaxStock || isOutOfStock) ? 0.4 : 1, cursor: (atMaxStock || isOutOfStock) ? 'not-allowed' : 'pointer' }}>+</button>
                  </div>
                  <div className={styles.itemTotal}>₹{(price * item.quantity).toLocaleString('en-IN')}</div>
                  <button className={styles.removeBtn} onClick={() => { removeItem(itemId); toast.success('Item removed'); }}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== ORDER SUMMARY ===== */}
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>
          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
              <span>₹{itemsPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span className={shippingPrice === 0 ? styles.free : ''}>
                {shippingPrice === 0 ? '🎉 FREE' : `₹${shippingPrice}`}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>Coupon ({coupon?.code})</span>
                <span>− ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className={styles.couponSection}>
            {coupon ? (
              <div className={styles.couponApplied}>
                <span>🎉 {coupon.code} applied! Saved ₹{discountAmount.toLocaleString('en-IN')}</span>
                <button onClick={() => { removeCoupon(); setCouponCode(''); }}>Remove</button>
              </div>
            ) : (
              <>
                <AvailableCoupons itemsPrice={itemsPrice} onApply={(code) => applyCoupon(code)} />
                <div className={styles.couponInput}>
                  <input type="text" placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="form-control" />
                  <button className="btn btn-secondary" onClick={() => applyCoupon()} disabled={applying}>{applying ? '...' : 'Apply'}</button>
                </div>
              </>
            )}
          </div>

          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
          </div>

          {/* Shipping messages */}
{(() => {
  const hasFood = items.some((item) => {
    const cat = (item.categorySlug || item.category?.slug || item.category || '').toString().toLowerCase();
    const catName = (item.categoryName || item.category?.name || '').toLowerCase();
    return cat.includes('food') || catName.includes('food') || Boolean(item.foodCategory) || item.isFood;
  });

  if (hasFood) {
    return (
      <div style={{
        padding: '10px 12px', marginTop: '8px', borderRadius: '10px',
        background: '#FFF3E8', border: '1.5px solid #FFD4A8',
        fontSize: '12px', fontWeight: '700', color: '#C2410C', textAlign: 'center',
      }}>
        🍼 Food items always include ₹50 shipping (any cart value)
      </div>
    );
  }

  if (shippingPrice === 0) {
    return (
      <div className={styles.freeDeliveryMsg}>
        ✅ You qualify for FREE delivery!
      </div>
    );
  }

  const remaining = Math.max(0, 800 - itemsPrice);
  return (
    <div className={styles.freeDeliveryHint}>
      Add ₹{remaining.toLocaleString('en-IN')} more for FREE delivery
    </div>
  );
})()}
          {hasStockIssue && (
            <div style={{ padding: '12px 14px', background: '#fef2f2', border: '2px solid #dc2626', borderRadius: '10px', marginTop: '10px', fontSize: '13px', color: '#991b1b', fontWeight: '700', textAlign: 'center' }}>
              ⚠️ Please fix stock issues before checkout
            </div>
          )}

          {/* PLACE ORDER BUTTON */}
          <button
            onClick={handlePlaceOrder}
            disabled={hasStockIssue || processing}
            className={styles.checkoutBtn}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: (hasStockIssue || processing)
                ? '#9ca3af'
                : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: (hasStockIssue || processing) ? 'not-allowed' : 'pointer',
              fontFamily: 'Nunito, sans-serif',
              boxShadow: (hasStockIssue || processing) ? 'none' : '0 6px 20px rgba(255,107,53,0.30)',
              marginTop: '10px',
            }}
          >
            {processing ? '⏳ Processing...' : `₹${fmt(totalPrice)}  PLACE ORDER`}
          </button>

          <Link href="/products" className={styles.continueShopping}>← Continue Shopping</Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          📍 ADDRESS PANEL
          ═══════════════════════════════════════ */}
      {showAddressPanel && (
        <>
          <div onClick={() => { setShowAddressPanel(false); setShowAddressForm(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, animation: 'fadeIn 0.3s ease' }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '460px',
            background: 'white', zIndex: 9999, display: 'flex', flexDirection: 'column',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.15)', animation: 'slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 22px', borderBottom: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '14px', background: 'white', flexShrink: 0 }}>
              <button onClick={() => { setShowAddressPanel(false); setShowAddressForm(false); }} style={{ background: '#F3F4F6', border: 'none', borderRadius: '10px', width: '38px', height: '38px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#1F2937', flexShrink: 0 }}>←</button>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
                {showAddressForm ? (editingIndex !== null ? 'Edit Address' : 'Add New Address') : 'Select Delivery Address'}
              </h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
              {showAddressForm ? (
                <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', textTransform: 'uppercase' }}>Full Name *</label>
                    <input type="text" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} placeholder="John Doe" required style={{ width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', textTransform: 'uppercase' }}>Phone *</label>
                    <input type="tel" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit mobile" required style={{ width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', textTransform: 'uppercase' }}>Address *</label>
                    <textarea value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} placeholder="Flat/House no., Street, Area" rows={3} required style={{ width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif', resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', textTransform: 'uppercase' }}>City *</label>
                      <input type="text" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City" required style={{ width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', textTransform: 'uppercase' }}>Pincode *</label>
                      <input type="text" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="6-digit" required style={{ width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#6B4E8A', marginBottom: '6px', textTransform: 'uppercase' }}>State *</label>
                    <select value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required style={{ width: '100%', padding: '11px 14px', border: '2px solid #EDD9FF', borderRadius: '10px', fontSize: '14px', outline: 'none', fontFamily: 'Nunito, sans-serif', background: 'white' }}>
                      <option value="">Select State</option>
                      {['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowAddressForm(false)} style={{ padding: '12px 18px', background: 'white', border: '2px solid #E5E7EB', borderRadius: '10px', fontWeight: '700', color: '#6B7280', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>Cancel</button>
                    <button type="submit" style={{ flex: 1, padding: '12px 18px', background: 'linear-gradient(135deg, #FF6B9D, #7B2FBE)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                      {editingIndex !== null ? '💾 Update Address' : '✨ Save Address'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {addresses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📍</div>
                      <h3 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>No addresses saved</h3>
                      <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#6B7280', fontFamily: 'Nunito, sans-serif' }}>Add your first delivery address</p>
                      <button onClick={openAddAddress} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #FF6B9D, #7B2FBE)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>+ Add New Address</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                        {addresses.map((addr, index) => {
                          const isSelected = selectedAddressIndex === index;
                          return (
                            <div key={index} style={{
                              padding: '14px 16px',
                              background: isSelected ? 'linear-gradient(135deg, #FFF5F7, #F3E8FF)' : 'white',
                              border: `2px solid ${isSelected ? '#FF6B9D' : '#E5E7EB'}`,
                              borderRadius: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              position: 'relative',
                            }}
                            onClick={() => handleSelectAddress(index)}
                            >
                              {isSelected && (
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#10B981', color: 'white', borderRadius: '999px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800' }}>✓</div>
                              )}
                              <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
                                {addr.name}
                              </p>
                              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#6B7280', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
                                📱 {addr.phone}
                              </p>
                              <p style={{ margin: '4px 0 0', fontSize: '0.80rem', color: '#4B5563', fontWeight: '600', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>
                                {addr.address}<br />
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                <button onClick={(e) => { e.stopPropagation(); openEditAddress(index); }} style={{ padding: '5px 12px', background: 'white', border: '1.5px solid #7B2FBE', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', color: '#7B2FBE', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>✏️ EDIT</button>
                                <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this address?')) deleteAddress(index); }} style={{ padding: '5px 12px', background: 'white', border: '1.5px solid #DC2626', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', color: '#DC2626', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>🗑️ DELETE</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={openAddAddress} style={{ width: '100%', padding: '12px', background: 'white', border: '2px dashed #FF6B9D', borderRadius: '10px', color: '#FF6B9D', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontSize: '0.90rem' }}>
                        + Add New Address
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════
          💳 PAYMENT PANEL
          ═══════════════════════════════════════ */}
      {showPaymentPanel && (
        <>
          <div onClick={() => setShowPaymentPanel(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998, animation: 'fadeIn 0.3s ease' }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '460px',
            background: 'white', zIndex: 9999, display: 'flex', flexDirection: 'column',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.15)', animation: 'slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 22px', borderBottom: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '14px', background: 'white', flexShrink: 0 }}>
              <button onClick={() => setShowPaymentPanel(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '10px', width: '38px', height: '38px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: '#1F2937', flexShrink: 0 }}>←</button>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>Payment Method</h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
              <div style={{ padding: '14px 16px', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '12px', display: 'flex', justifycontent: 'space-between', alignitems: 'flex-start', gap: '10px', marginBottom: '18px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>
                    📍 Deliver to <span style={{ color: '#FF6B35' }}>{selectedAddress?.name}</span>, {selectedAddress?.pincode}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#6B7280', fontWeight: '600', fontFamily: 'Nunito, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedAddress?.address}
                  </p>
                </div>
                <button onClick={() => { setShowPaymentPanel(false); setShowAddressPanel(true); }} style={{ padding: '5px 12px', background: 'white', border: '1.5px solid #FF6B35', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', color: '#FF6B35', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', letterSpacing: '0.5px', flexShrink: 0 }}>CHANGE</button>
              </div>

              <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)', border: '1.5px solid #FFE4EC', borderRadius: '12px', marginBottom: '18px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#6B4E8A', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Nunito, sans-serif' }}>Total Amount</p>
                <p style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: '900', color: '#BE185D', fontFamily: 'Nunito, sans-serif' }}>₹{fmt(totalPrice)}</p>
              </div>

              <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: '800', color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>Payment Options</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => !opt.disabled && !processing && handlePaymentSelect(opt.method)}
                    disabled={opt.disabled || processing}
                    style={{
                      padding: '16px 18px',
                      background: 'white',
                      border: '1.5px solid #E5E7EB',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      cursor: (opt.disabled || processing) ? 'not-allowed' : 'pointer',
                      opacity: opt.disabled ? 0.55 : 1,
                      transition: 'all 0.2s ease',
                      fontFamily: 'Nunito, sans-serif',
                      textAlign: 'left',
                      width: '100%',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!opt.disabled && !processing) {
                        e.currentTarget.style.borderColor = opt.color;
                        e.currentTarget.style.background = `${opt.color}08`;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!opt.disabled && !processing) {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `${opt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                      {opt.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#1F2937' }}>{opt.title}</p>
                        {opt.badge && <span style={{ padding: '2px 8px', background: '#F3F4F6', borderRadius: '4px', fontSize: '0.62rem', fontWeight: '800', color: '#6B7280', border: '1px solid #E5E7EB' }}>{opt.badge}</span>}
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: opt.disabled ? '#EF4444' : '#6B7280', fontWeight: '600' }}>{opt.subtitle}</p>
                    </div>
                    <span style={{ fontSize: '1.3rem', color: '#9CA3AF', fontWeight: '800', flexShrink: 0 }}>›</span>
                    {opt.recommended && (
                      <div style={{ position: 'absolute', top: '-8px', right: '12px', padding: '2px 10px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', borderRadius: '999px', fontSize: '0.62rem', fontWeight: '800', letterSpacing: '0.4px', boxShadow: '0 3px 8px rgba(16,185,129,0.35)' }}>
                        ⭐ RECOMMENDED
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '18px', padding: '10px 14px', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '700', color: '#166534', fontFamily: 'Nunito, sans-serif' }}>
                  Most parents prefer: Instant Payments & Refunds
                </p>
              </div>
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1.5px solid #E5E7EB', background: '#FAFAFA', flexShrink: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
                {[
                  { icon: '🛡️', title: 'Quick &', line2: 'Secure', line3: 'Payments' },
                  { icon: '↩️', title: 'Easy Returns', line2: '& Refunds' },
                  { icon: '🔒', title: 'Encrypted', line2: 'User data' },
                  { icon: '✓', title: 'PCI', line2: 'Certified' },
                ].map((b, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '1.3rem', marginBottom: '3px' }}>{b.icon}</div>
                    <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: '700', color: '#6B7280', lineHeight: 1.3, fontFamily: 'Nunito, sans-serif' }}>
                      {b.title}<br />{b.line2}{b.line3 && <><br />{b.line3}</>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}