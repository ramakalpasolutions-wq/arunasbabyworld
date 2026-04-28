'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import styles from './CartClient.module.css';

// ✅ Available Coupons Component
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
      <p style={{
        fontSize: '13px',
        fontWeight: '700',
        color: '#333',
        margin: '0 0 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        🎟️ Available Coupons
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayCoupons.map(c => {
          const eligible = itemsPrice >= (c.minOrderValue || 0);
          const remaining = (c.minOrderValue || 0) - itemsPrice;
          return (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: eligible ? '#f0fdf4' : '#fafafa',
                border: `1.5px dashed ${eligible ? '#10b981' : '#ddd'}`,
                borderRadius: '10px',
                opacity: eligible ? 1 : 0.7,
                gap: '8px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontWeight: '800',
                    fontSize: '13px',
                    color: '#1a1a2e',
                    fontFamily: 'monospace',
                    background: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '1px',
                  }}>
                    {c.code}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#ff6b9d' }}>
                    {c.discountType === 'percentage'
                      ? `${c.discountValue}% OFF`
                      : `₹${c.discountValue} OFF`}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#888', margin: 0 }}>
                  {c.minOrderValue > 0
                    ? `Min order: ₹${c.minOrderValue.toLocaleString('en-IN')}`
                    : 'No minimum order'}
                  {c.maxDiscount ? ` • Max: ₹${c.maxDiscount}` : ''}
                </p>
              </div>
              <button
                onClick={() => eligible && onApply(c.code)}
                disabled={!eligible}
                style={{
                  background: eligible
                    ? 'linear-gradient(135deg, #ff6b9d, #7c3aed)'
                    : '#e5e7eb',
                  color: eligible ? 'white' : '#999',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: eligible ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {eligible
                  ? 'Apply'
                  : `₹${remaining.toLocaleString('en-IN')} more`}
              </button>
            </div>
          );
        })}
      </div>
      {coupons.length > 2 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            background: 'none',
            border: 'none',
            color: '#7c3aed',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            marginTop: '6px',
            padding: '4px 0',
          }}
        >
          {showAll ? '← Show less' : `View all ${coupons.length} coupons →`}
        </button>
      )}
    </div>
  );
}

export default function CartClient() {
  const {
    items,
    updateQuantity,
    removeItem,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discountAmount,
    totalPrice,
    coupon,
    setCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);

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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoupon({
        code: codeToApply.toUpperCase(),
        discountAmount: data.discountAmount,
      });
      setCouponCode('');
      toast.success(`🎉 Coupon applied! Saved ₹${data.discountAmount}`);
    } catch (err) {
      toast.error(err.message || 'Invalid coupon');
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) return (
    <div className={`container ${styles.empty}`}>
      <div className={styles.emptyContent}>
        <span className={styles.emptyIcon}>🛒</span>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any items yet. Start shopping!</p>
        <Link href="/products" className="btn btn-primary">
          🛍️ Start Shopping
        </Link>
      </div>
    </div>
  );

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>
        🛒 Shopping Cart{' '}
        <span>({items.length} items)</span>
      </h1>

      <div className={styles.layout}>

        {/* ===== CART ITEMS ===== */}
        <div className={styles.itemsList}>
          {items.map((item) => {
            const itemId = item.id || item._id;
            const price = item.discountPrice || item.price;
            const image = item.images?.[0]?.url ||
              `https://via.placeholder.com/100?text=${encodeURIComponent(item.name)}`;

            return (
              <div key={itemId} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  <Image
                    src={image}
                    alt={item.name}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                  />
                </div>

                <div className={styles.itemInfo}>
                  <Link href={`/products/${itemId}`} className={styles.itemName}>
                    {item.name}
                  </Link>
                  <div className={styles.itemPrice}>
                    ₹{price.toLocaleString('en-IN')} each
                  </div>
                  {item.discountPrice && (
                    <div className={styles.itemOriginal}>
                      MRP: ₹{item.price.toLocaleString('en-IN')}
                    </div>
                  )}
                  {item.ageGroup && (
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      👶 {item.ageGroup}
                    </div>
                  )}
                </div>

                <div className={styles.itemControls}>
                  <div className={styles.quantityCtrl}>
                    <button onClick={() => updateQuantity(itemId, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(itemId, item.quantity + 1)}>+</button>
                  </div>
                  <div className={styles.itemTotal}>
                    ₹{(price * item.quantity).toLocaleString('en-IN')}
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => { removeItem(itemId); toast.success('Item removed'); }}
                  >
                    🗑️
                  </button>
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
            <div className={styles.summaryRow}>
              <span>Tax (5%)</span>
              <span>₹{taxPrice.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>Coupon ({coupon?.code})</span>
                <span>− ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* ===== COUPON SECTION ===== */}
          <div className={styles.couponSection}>
            {coupon ? (
              <div className={styles.couponApplied}>
                <span>🎉 {coupon.code} applied! Saved ₹{discountAmount.toLocaleString('en-IN')}</span>
                <button
                  onClick={() => {
                    removeCoupon();
                    setCouponCode('');
                  }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                {/* ✅ Available Coupons List */}
                <AvailableCoupons
                  itemsPrice={itemsPrice}
                  onApply={(code) => applyCoupon(code)}
                />

                {/* Manual Coupon Input */}
                <div className={styles.couponInput}>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="form-control"
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => applyCoupon()}
                    disabled={applying}
                  >
                    {applying ? '...' : 'Apply'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
          </div>

          {shippingPrice === 0 && (
            <div className={styles.freeDeliveryMsg}>
              ✅ You qualify for FREE delivery!
            </div>
          )}
          {shippingPrice > 0 && itemsPrice < 499 && (
            <div className={styles.freeDeliveryHint}>
              Add ₹{(499 - itemsPrice).toLocaleString('en-IN')} more for FREE delivery
            </div>
          )}

          <Link href="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`}>
            Proceed to Checkout →
          </Link>

          <Link href="/products" className={styles.continueShopping}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}