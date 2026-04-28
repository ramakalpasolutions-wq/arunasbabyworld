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

  const handlePayment = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load');
        setLoading(false);
        return;
      }

      // ✅ Step 1: Create Razorpay order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPrice }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // ✅ Step 2: Create DB order (pending)
      const dbOrderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItems: items.map(i => ({
            // ✅ Use i.id not i._id
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

      // ✅ Get correct order ID
      const createdOrderId = dbOrder.order?.id || dbOrder.order?._id;
      console.log('Created order ID:', createdOrderId);

      if (!createdOrderId) {
        throw new Error('Order ID not found');
      }

      // ✅ Step 3: Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'BabyBliss',
        description: 'Baby & Kids Products',
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            // ✅ Step 4: Verify payment with correct orderId
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: createdOrderId, // ✅ Use correct id
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              clearCart();
              toast.success('🎉 Order placed successfully!');
              // ✅ Redirect with correct id
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
                  // ✅ Fixed: use item.id not item._id
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
              <h2 className={styles.cardTitle}>💳 Payment</h2>

              <div className={styles.paymentMethod}>
                <div className={styles.paymentOption}>
                  <input type="radio" id="razorpay" checked readOnly />
                  <label htmlFor="razorpay">
                    <span>Razorpay</span>
                    <small>UPI, Cards, NetBanking, Wallets</small>
                  </label>
                </div>
              </div>

              <div className={styles.secureNote}>
                🔒 Your payment is secured by Razorpay
              </div>

              <div className={styles.reviewActions}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handlePayment}
                  disabled={loading}
                  style={{ minWidth: 180 }}
                >
                  {loading ? '⏳ Processing...' : `Pay ₹${totalPrice.toLocaleString('en-IN')}`}
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
        </div>
      </div>
    </div>
  );
}