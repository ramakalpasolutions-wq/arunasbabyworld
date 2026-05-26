'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';
import Link from 'next/link';
import styles from './CheckoutClient.module.css';

const STEPS = ['Address', 'Review', 'Payment'];

export default function CheckoutClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    items,
    itemsPrice,
    shippingPrice,
    taxPrice,
    discountAmount,
    totalPrice,
    coupon,
    clearCart,
  } = useCart();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

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

  // ✅ Handle COD order
  const handleCODOrder = async () => {
    setLoading(true);
    try {
      const dbOrderRes = await fetch('/api/orders', {
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
          shippingAddress: address,
          paymentMethod: 'COD',
          itemsPrice,
          shippingPrice,
          taxPrice,
          discountAmount,
          totalPrice,
          couponCode: coupon?.code || null,
          isPaid: false,
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

  // ✅ Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load');
        setLoading(false);
        return;
      }

      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPrice }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const dbOrderRes = await fetch('/api/orders', {
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
          shippingAddress: address,
          paymentMethod: 'Razorpay',
          itemsPrice,
          shippingPrice,
          taxPrice,
          discountAmount,
          totalPrice,
          couponCode: coupon?.code || null,
        }),
      });
      const dbOrder = await dbOrderRes.json();
      if (!dbOrderRes.ok) throw new Error(dbOrder.error);

      const createdOrderId = dbOrder.order?.id || dbOrder.order?._id;
      if (!createdOrderId) throw new Error('Order ID not found');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'BabyBliss',
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
              clearCart();
              toast.success('🎉 Order placed successfully!');
              router.push(`/orders/${createdOrderId}`);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            toast.error('Payment verification error');
            console.error(err);
          }
        },
        prefill: {
          name: session.user.name,
          email: session.user.email,
          contact: address.phone,
        },
        theme: { color: '#ff6b9d' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Master handler
  const handlePayment = () => {
    if (paymentMethod === 'COD') {
      handleCODOrder();
    } else {
      handleRazorpayPayment();
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>Checkout</h1>

      {/* ===== STEPS ===== */}
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

          {/* ===== STEP 0: ADDRESS ===== */}
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

          {/* ===== STEP 1: REVIEW ===== */}
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
                      ₹{((item.discountPrice || item.price) * item.quantity).toLocaleString('en-IN')}
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

          {/* ===== STEP 2: PAYMENT ===== */}
          {step === 2 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>💳 Choose Payment Method</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>

                {/* Razorpay Option */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '18px 20px',
                  background: paymentMethod === 'Razorpay' ? 'linear-gradient(135deg, #FFF5F7, #F3E8FF)' : 'white',
                  border: `2.5px solid ${paymentMethod === 'Razorpay' ? '#FF6B9D' : '#E5E7EB'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: paymentMethod === 'Razorpay' ? '0 6px 18px rgba(255,107,157,0.15)' : 'none',
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value="Razorpay"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#FF6B9D',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #FF6B9D, #7B2FBE)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(255,107,157,0.30)',
                  }}>
                    💳
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: '800',
                      color: '#1F2937',
                      fontFamily: 'Nunito, sans-serif',
                    }}>
                      Razorpay Online Payment
                    </p>
                    <p style={{
                      margin: '4px 0 0',
                      fontSize: '0.82rem',
                      color: '#6B7280',
                      fontWeight: '600',
                      fontFamily: 'Nunito, sans-serif',
                    }}>
                      UPI, Cards, NetBanking, Wallets
                    </p>
                    {paymentMethod === 'Razorpay' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {['UPI', 'Visa', 'MasterCard', 'Paytm', 'PhonePe'].map(p => (
                          <span key={p} style={{
                            padding: '2px 8px',
                            background: 'white',
                            border: '1px solid #FCA5A5',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            color: '#7B2FBE',
                          }}>{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    background: '#10B981',
                    color: 'white',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    fontFamily: 'Nunito, sans-serif',
                  }}>
                    🔒 SECURE
                  </div>
                </label>

                {/* COD Option */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '18px 20px',
                  background: paymentMethod === 'COD' ? 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' : 'white',
                  border: `2.5px solid ${paymentMethod === 'COD' ? '#F59E0B' : '#E5E7EB'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: paymentMethod === 'COD' ? '0 6px 18px rgba(245,158,11,0.15)' : 'none',
                }}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#F59E0B',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(245,158,11,0.30)',
                  }}>
                    💵
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: '800',
                      color: '#1F2937',
                      fontFamily: 'Nunito, sans-serif',
                    }}>
                      Cash on Delivery (COD)
                    </p>
                    <p style={{
                      margin: '4px 0 0',
                      fontSize: '0.82rem',
                      color: '#6B7280',
                      fontWeight: '600',
                      fontFamily: 'Nunito, sans-serif',
                    }}>
                      Pay with cash when order arrives
                    </p>
                    {paymentMethod === 'COD' && (
                      <p style={{
                        margin: '8px 0 0',
                        fontSize: '0.76rem',
                        color: '#92400E',
                        fontWeight: '700',
                        fontFamily: 'Nunito, sans-serif',
                      }}>
                        💡 No advance payment required
                      </p>
                    )}
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    background: '#F59E0B',
                    color: 'white',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    fontFamily: 'Nunito, sans-serif',
                  }}>
                    💵 EASY
                  </div>
                </label>
              </div>

              {/* Security note */}
              <div style={{
                padding: '12px 14px',
                background: paymentMethod === 'Razorpay' ? '#F0FDF4' : '#EFF6FF',
                border: `1.5px solid ${paymentMethod === 'Razorpay' ? '#BBF7D0' : '#BFDBFE'}`,
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '0.82rem',
                color: paymentMethod === 'Razorpay' ? '#166534' : '#1E40AF',
                fontWeight: '600',
                fontFamily: 'Nunito, sans-serif',
              }}>
                {paymentMethod === 'Razorpay'
                  ? '🔒 Your payment is secured by Razorpay encryption'
                  : 'ℹ️ Please keep exact change ready. Pay only after receiving your order.'}
              </div>

              <div className={styles.reviewActions}>
                <button className="btn btn-outline" onClick={() => setStep(1)} disabled={loading}>
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handlePayment}
                  disabled={loading}
                  style={{
                    minWidth: 200,
                    background: paymentMethod === 'COD'
                      ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                      : 'linear-gradient(135deg, #FF6B9D, #7B2FBE)',
                  }}
                >
                  {loading
                    ? '⏳ Processing...'
                    : paymentMethod === 'COD'
                      ? `📦 Place Order ₹${totalPrice.toLocaleString('en-IN')}`
                      : `💳 Pay ₹${totalPrice.toLocaleString('en-IN')}`
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== SUMMARY SIDEBAR ===== */}
        <div className={styles.summary}>
          <h3>Price Details</h3>
          <div className={styles.summaryRows}>
            <div className={styles.row}>
              <span>Items ({items.reduce((a, i) => a + i.quantity, 0)})</span>
              <span>₹{itemsPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.row}>
              <span>Delivery</span>
              <span style={{ color: shippingPrice === 0 ? 'var(--success)' : 'inherit' }}>
                {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
              </span>
            </div>
            <div className={styles.row}>
              <span>Tax</span>
              <span>₹{taxPrice.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className={`${styles.row} ${styles.discount}`}>
                <span>Coupon Discount</span>
                <span>− ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
          <div className={styles.totalRow}>
            <span>Total</span>
            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
          </div>
          {discountAmount > 0 && (
            <div className={styles.savingMsg}>
              🎉 You save ₹{discountAmount.toLocaleString('en-IN')} on this order!
            </div>
          )}

          {step === 2 && (
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: paymentMethod === 'COD' ? '#FFFBEB' : '#FFF5F7',
              border: `1.5px solid ${paymentMethod === 'COD' ? '#FDE68A' : '#FCA5A5'}`,
              borderRadius: '10px',
              fontFamily: 'Nunito, sans-serif',
            }}>
              <p style={{
                margin: 0,
                fontSize: '0.74rem',
                fontWeight: '700',
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Payment Method
              </p>
              <p style={{
                margin: '4px 0 0',
                fontSize: '0.88rem',
                fontWeight: '800',
                color: paymentMethod === 'COD' ? '#92400E' : '#BE185D',
              }}>
                {paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Razorpay'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}