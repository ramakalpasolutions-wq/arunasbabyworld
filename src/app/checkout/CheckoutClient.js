'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import styles from './CheckoutClient.module.css';

const fmt = (val) => Math.round(val || 0).toLocaleString('en-IN');

const STEPS = ['Address', 'Review', 'Payment'];

export default function CheckoutClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    items,
    itemsPrice,
    shippingPrice,
    discountAmount,
    totalPrice,
    coupon,
    clearCart,
  } = useCart();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    document.body.style.overflow = showPaymentPanel ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showPaymentPanel]);

  if (!session) return (
    <div className={`container ${styles.authWall}`}>
      <span>🔒</span>
      <h2>Please login to checkout</h2>
      <Link href="/login?redirect=/checkout" className="btn btn-primary">
        Login to Continue
      </Link>
    </div>
  );

  if (items.length === 0) return (
    <div className={`container ${styles.authWall}`}>
      <span>🛒</span>
      <h2>Your cart is empty</h2>
      <Link href="/products" className="btn btn-primary">Shop Now</Link>
    </div>
  );

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    const { name, phone, address: addr, city, state, pincode } = address;
    if (!name || !phone || !addr || !city || !state || !pincode) {
      toast.error('Please fill all address fields');
      return;
    }
    setStep(1);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const mapOrderItems = () => items.map(i => ({
    productId: i.id || i._id,
    name: i.name,
    image: i.images?.[0]?.url || '',
    price: i.discountPrice || i.price,
    quantity: i.quantity,
    categorySlug: i.categorySlug || i.category?.slug || '',
    categoryName: i.categoryName || i.category?.name || '',
    categoryId: i.categoryId || i.category?.id || '',
    foodCategory: i.foodCategory || null,
    isFood: !!(
      i.isFood ||
      (i.categorySlug || i.category?.slug || '').toString().toLowerCase().includes('food') ||
      (i.categoryName || i.category?.name || '').toString().toLowerCase().includes('food') ||
      i.foodCategory
    ),
  }));

  const handleCODOrder = async () => {
    setLoading(true);
    try {
      const dbOrderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItems: mapOrderItems(),
          shippingAddress: address,
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

      const dbOrder = await dbOrderRes.json();
      if (!dbOrderRes.ok) throw new Error(dbOrder.error);

      const createdOrderId = dbOrder.order?.id || dbOrder.order?._id;
      if (!createdOrderId) throw new Error('Order ID not found');

      clearCart();
      toast.success('🎉 Order placed successfully! Pay on delivery.', { duration: 4000 });
      router.push(`/orders/${createdOrderId}`);
    } catch (err) {
      console.error('COD order error:', err);
      toast.error(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load');
        setLoading(false);
        return;
      }

      const dbOrderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItems: mapOrderItems(),
          shippingAddress: address,
          paymentMethod: 'Razorpay',
          itemsPrice,
          shippingPrice,
          taxPrice: 0,
          discountAmount,
          totalPrice,
          couponCode: coupon?.code || null,
          isPaid: false,
          paymentStatus: 'pending',
          orderStatus: 'Pending',
        }),
      });
      const dbOrder = await dbOrderRes.json();
      if (!dbOrderRes.ok) throw new Error(dbOrder.error);

      const createdOrderId = dbOrder.order?.id || dbOrder.order?._id;
      if (!createdOrderId) throw new Error('Order ID not found');

      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPrice }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      clearCart();

      const options = {
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
                orderId: createdOrderId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.success('🎉 Payment successful!');
              router.push(`/orders/${createdOrderId}`);
            } else {
              await fetch(`/api/orders/${createdOrderId}/payment-failed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Payment verification failed' }),
              });
              toast.error('Payment verification failed');
              router.push(`/orders/${createdOrderId}?paymentFailed=true`);
            }
          } catch (err) {
            console.error(err);
            await fetch(`/api/orders/${createdOrderId}/payment-failed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: 'Verification error' }),
            });
            router.push(`/orders/${createdOrderId}?paymentFailed=true`);
          }
        },

        prefill: {
          name: session.user.name,
          email: session.user.email,
          contact: address.phone,
        },
        theme: { color: '#ff6b9d' },

        modal: {
          ondismiss: async () => {
            setLoading(false);
            try {
              await fetch(`/api/orders/${createdOrderId}/payment-failed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Payment cancelled by user' }),
              });
            } catch (err) {
              console.error('Failed to mark payment as failed:', err);
            }
            toast.error('Payment cancelled. You can retry from your order page.');
            router.push(`/orders/${createdOrderId}?paymentFailed=true`);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', async (response) => {
        console.error('Payment failed:', response.error);
        await fetch(`/api/orders/${createdOrderId}/payment-failed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: response.error?.description || 'Payment failed',
            errorCode: response.error?.code,
          }),
        });
        toast.error(`Payment failed: ${response.error?.description || 'Try again'}`);
        router.push(`/orders/${createdOrderId}?paymentFailed=true`);
      });

      razorpay.open();

    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setShowPaymentPanel(false);

    setTimeout(() => {
      if (method === 'COD') {
        handleCODOrder();
      } else {
        handleRazorpayPayment();
      }
    }, 300);
  };

  const PAYMENT_OPTIONS = [
    {
      id: 'card',
      icon: '💳',
      title: 'Credit/Debit Card',
      subtitle: 'Visa, Mastercard, RuPay',
      color: '#3B82F6',
      method: 'Razorpay',
    },
    {
      id: 'upi',
      icon: '📱',
      title: 'UPI',
      subtitle: 'GPay, PhonePe, Paytm',
      color: '#10B981',
      badge: 'Paytm',
      method: 'Razorpay',
      recommended: true,
    },
    {
      id: 'netbanking',
      icon: '🏦',
      title: 'Net Banking',
      subtitle: 'Available on orders above ₹2000',
      color: '#F59E0B',
      method: 'Razorpay',
      disabled: totalPrice < 2000,
    },
    {
      id: 'emi',
      icon: '📊',
      title: 'EMI',
      subtitle: 'Available on orders above ₹3000',
      color: '#8B5CF6',
      method: 'Razorpay',
      disabled: totalPrice < 3000,
    },
    {
      id: 'cod',
      icon: '💵',
      title: 'Cash on Delivery',
      subtitle: 'Pay when you receive',
      color: '#EF4444',
      method: 'COD',
    },
  ];

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Checkout</h1>

      <div className={styles.steps}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`${styles.step} ${i <= step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}
          >
            <div className={styles.stepCircle}>
              {i < step ? '✓' : i + 1}
            </div>
            <span>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>

          {step === 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>📍 Delivery Address</h2>
              <form onSubmit={handleAddressSubmit} className={styles.addressForm}>
                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      className="form-control"
                      value={address.name}
                      onChange={e => setAddress(a => ({ ...a, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      className="form-control"
                      value={address.phone}
                      onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address *</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={address.address}
                    onChange={e => setAddress(a => ({ ...a, address: e.target.value }))}
                    placeholder="Flat/House no., Street, Area"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      className="form-control"
                      value={address.city}
                      onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                      placeholder="City"
                    />
                  </div>
                  <div className="form-group">
                    <label>State *</label>
                    <select
                      className="form-control"
                      value={address.state}
                      onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
                    >
                      <option value="">Select State</option>
                      {[
                        'Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka',
                        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab',
                        'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh',
                        'West Bengal',
                      ].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input
                      className="form-control"
                      value={address.pincode}
                      onChange={e => setAddress(a => ({ ...a, pincode: e.target.value }))}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '12px 32px' }}
                >
                  Continue to Review →
                </button>
              </form>
            </div>
          )}

          {step === 1 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>📋 Order Review</h2>

              <div className={styles.addressReview}>
                <h4>Delivering to:</h4>
                <p><strong>{address.name}</strong> · {address.phone}</p>
                <p>{address.address}, {address.city}, {address.state} - {address.pincode}</p>
                <button className={styles.changeBtn} onClick={() => setStep(0)}>
                  Change
                </button>
              </div>

              <div className={styles.reviewItems}>
                {items.map(item => (
                  <div key={item.id || item._id} className={styles.reviewItem}>
                    <img
                      src={item.images?.[0]?.url || 'https://via.placeholder.com/60'}
                      alt={item.name}
                    />
                    <div className={styles.reviewItemInfo}>
                      <p className={styles.reviewItemName}>{item.name}</p>
                      <p>Qty: {item.quantity}</p>
                    </div>
                    <span className={styles.reviewItemPrice}>
                      ₹{Math.round((item.discountPrice || item.price) * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.reviewActions}>
                <button className="btn btn-outline" onClick={() => setStep(0)}>
                  ← Back
                </button>
                <button className="btn btn-primary" onClick={() => setStep(2)}>
                  Proceed to Payment →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>💳 Ready to Pay</h2>

              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)',
                borderRadius: '14px',
                border: '2px solid #FFE4EC',
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛍️</div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#6B4E8A', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
                  Total Amount to Pay
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '2rem', fontWeight: '900', color: '#BE185D', fontFamily: 'Nunito, sans-serif' }}>
                  ₹{fmt(totalPrice)}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#9585B0', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
                  {items.reduce((a, i) => a + i.quantity, 0)} items · Delivery to {address.city}
                </p>
              </div>

              <div className={styles.reviewActions}>
                <button className="btn btn-outline" onClick={() => setStep(1)} disabled={loading}>
                  ← Back
                </button>
                <button
                  onClick={() => setShowPaymentPanel(true)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '800',
                    fontFamily: 'Nunito, sans-serif',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(255,107,53,0.30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {loading ? '⏳ Processing...' : `💳 Select Payment Method · ₹${fmt(totalPrice)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.summary}>
          <h3>Price Details</h3>
          <div className={styles.summaryRows}>
            <div className={styles.row}>
              <span>Items ({items.reduce((a, i) => a + i.quantity, 0)})</span>
              <span>₹{fmt(itemsPrice)}</span>
            </div>
            <div className={styles.row}>
              <span>Delivery</span>
              <span style={{ color: shippingPrice === 0 ? 'var(--success)' : 'inherit' }}>
                {shippingPrice === 0 ? 'FREE' : `₹${fmt(shippingPrice)}`}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className={`${styles.row} ${styles.discount}`}>
                <span>Coupon Discount</span>
                <span>− ₹{fmt(discountAmount)}</span>
              </div>
            )}
          </div>
          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹{fmt(totalPrice)}</span>
          </div>
          {discountAmount > 0 && (
            <div className={styles.savingMsg}>
              🎉 You save ₹{fmt(discountAmount)} on this order!
            </div>
          )}
        </div>
      </div>

      {showPaymentPanel && (
        <>
          <div
            onClick={() => setShowPaymentPanel(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9998,
              animation: 'fadeIn 0.3s ease',
            }}
          />

          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '460px',
            background: 'white',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.15)',
            animation: 'slideInRight 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          }}>

            <div style={{
              padding: '18px 22px',
              borderBottom: '1.5px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'white',
              flexShrink: 0,
            }}>
              <button
                onClick={() => setShowPaymentPanel(false)}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  color: '#1F2937',
                  flexShrink: 0,
                }}
              >
                ←
              </button>
              <h2 style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: '800',
                color: '#1F2937',
                fontFamily: 'Nunito, sans-serif',
              }}>
                Payment Method
              </h2>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 22px',
            }}>
              <div style={{
                padding: '14px 16px',
                background: '#F9FAFB',
                border: '1.5px solid #E5E7EB',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '18px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    color: '#1F2937',
                    fontFamily: 'Nunito, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    📍 Deliver to <span style={{ color: '#FF6B35' }}>{address.name}</span>, {address.pincode}
                  </p>
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: '0.76rem',
                    color: '#6B7280',
                    fontWeight: '600',
                    fontFamily: 'Nunito, sans-serif',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {address.address}
                  </p>
                </div>
                <button
                  onClick={() => { setShowPaymentPanel(false); setStep(0); }}
                  style={{
                    padding: '5px 12px',
                    background: 'white',
                    border: '1.5px solid #FF6B35',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    color: '#FF6B35',
                    cursor: 'pointer',
                    fontFamily: 'Nunito, sans-serif',
                    letterSpacing: '0.5px',
                    flexShrink: 0,
                  }}
                >
                  CHANGE
                </button>
              </div>

              <h3 style={{
                margin: '0 0 14px',
                fontSize: '1rem',
                fontWeight: '800',
                color: '#1F2937',
                fontFamily: 'Nunito, sans-serif',
              }}>
                Payment Options
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => !opt.disabled && handlePaymentMethodSelect(opt.method)}
                    disabled={opt.disabled || loading}
                    style={{
                      padding: '16px 18px',
                      background: 'white',
                      border: '1.5px solid #E5E7EB',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      opacity: opt.disabled ? 0.55 : 1,
                      transition: 'all 0.2s ease',
                      fontFamily: 'Nunito, sans-serif',
                      textAlign: 'left',
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: `${opt.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      flexShrink: 0,
                    }}>
                      {opt.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          fontWeight: '800',
                          color: '#1F2937',
                        }}>
                          {opt.title}
                        </p>
                        {opt.badge && (
                          <span style={{
                            padding: '2px 8px',
                            background: '#F3F4F6',
                            borderRadius: '4px',
                            fontSize: '0.62rem',
                            fontWeight: '800',
                            color: '#6B7280',
                            border: '1px solid #E5E7EB',
                          }}>
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p style={{
                        margin: '3px 0 0',
                        fontSize: '0.76rem',
                        color: opt.disabled ? '#EF4444' : '#6B7280',
                        fontWeight: '600',
                      }}>
                        {opt.subtitle}
                      </p>
                    </div>

                    <span style={{
                      fontSize: '1.3rem',
                      color: '#9CA3AF',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}>
                      ›
                    </span>

                    {opt.recommended && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '12px',
                        padding: '2px 10px',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: 'white',
                        borderRadius: '999px',
                        fontSize: '0.62rem',
                        fontWeight: '800',
                        letterSpacing: '0.4px',
                        boxShadow: '0 3px 8px rgba(16,185,129,0.35)',
                      }}>
                        ⭐ RECOMMENDED
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div style={{
                marginTop: '18px',
                padding: '10px 14px',
                background: '#F0FDF4',
                border: '1.5px solid #BBF7D0',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                <p style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#166534',
                  fontFamily: 'Nunito, sans-serif',
                }}>
                  Most parents prefer: Instant Payments & Refunds
                </p>
              </div>
            </div>

            <div style={{
              padding: '14px 22px',
              borderTop: '1.5px solid #E5E7EB',
              background: '#FAFAFA',
              flexShrink: 0,
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                textAlign: 'center',
              }}>
                {[
                  { icon: '🛡️', title: 'Quick &', line2: 'Secure', line3: 'Payments' },
                  { icon: '↩️', title: 'Easy Returns', line2: '& Refunds' },
                  { icon: '🔒', title: 'Encrypted', line2: 'User data' },
                  { icon: '✓', title: 'PCI', line2: 'Certified' },
                ].map((b, i) => (
                  <div key={i}>
                    <div style={{
                      fontSize: '1.3rem',
                      marginBottom: '3px',
                    }}>
                      {b.icon}
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '0.62rem',
                      fontWeight: '700',
                      color: '#6B7280',
                      lineHeight: 1.3,
                      fontFamily: 'Nunito, sans-serif',
                    }}>
                      {b.title}<br />
                      {b.line2}
                      {b.line3 && <><br />{b.line3}</>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}