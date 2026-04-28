'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const STATUS_OPTIONS = [
  'Pending', 'Confirmed', 'Processing',
  'Shipped', 'Delivered', 'Cancelled', 'Refunded',
];

const STATUS_COLOR = {
  Pending: '#f59e0b',
  Confirmed: '#3b82f6',
  Processing: '#8b5cf6',
  Shipped: '#06b6d4',
  Delivered: '#10b981',
  Cancelled: '#ef4444',
  Refunded: '#6b7280',
};

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export default function AdminOrderDetail({ params }) {
  const router = useRouter();

  // ✅ Unwrap params using React.use()
  const { id } = use(params);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    // ✅ Use id directly
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        setOrder(d.order);
        setNewStatus(d.order?.orderStatus || '');
        setTrackingNumber(d.order?.trackingNumber || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      // ✅ Use id directly
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: newStatus,
          trackingNumber: trackingNumber || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(data.order);
      toast.success('✅ Order updated! Email sent to customer.');
    } catch (err) {
      toast.error(err.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #fce4ec', borderTop: '4px solid #ff6b9d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#888' }}>Loading order details...</p>
    </div>
  );

  if (!order) return (
    <div className={styles.notFound}>
      <span>📦</span>
      <h2>Order not found</h2>
      <button className="btn btn-outline" onClick={() => router.back()}>← Go Back</button>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Order #{order.id?.slice(-8)?.toUpperCase()}</h1>
          <p>
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{
            padding: '6px 16px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '14px',
            background: `${STATUS_COLOR[order.orderStatus] || '#888'}20`,
            color: STATUS_COLOR[order.orderStatus] || '#888',
          }}>
            {order.orderStatus}
          </span>
          <button className="btn btn-outline" onClick={() => router.back()}>
            ← Back to Orders
          </button>
        </div>
      </div>

      {/* ORDER PROGRESS TRACKER */}
      {!isCancelled && (
        <div className={styles.tracker}>
          <h3>Order Progress</h3>
          <div className={styles.steps}>
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={styles.stepWrap}>
                <div
                  className={styles.stepCircle}
                  style={{
                    background: i <= currentStep
                      ? STATUS_COLOR[order.orderStatus]
                      : '#e5e7eb',
                    color: i <= currentStep ? 'white' : '#999',
                  }}
                >
                  {i < currentStep ? '✓' : ['📋', '✅', '⚙️', '🚚', '🎉'][i]}
                </div>
                <span
                  className={styles.stepLabel}
                  style={{ color: i <= currentStep ? STATUS_COLOR[order.orderStatus] : '#999' }}
                >
                  {step}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={styles.stepLine}
                    style={{ background: i < currentStep ? STATUS_COLOR[order.orderStatus] : '#e5e7eb' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '24px' }}>❌</span>
          <div>
            <strong>Order {order.orderStatus}</strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              This order has been {order.orderStatus.toLowerCase()}.
            </p>
          </div>
        </div>
      )}

      <div className={styles.grid}>

        {/* ===== LEFT COLUMN ===== */}
        <div className={styles.mainCol}>

          {/* Order Items */}
          <div className={styles.card}>
            <h3>🛍️ Order Items ({order.orderItems?.length})</h3>
            {order.orderItems?.map((item, i) => (
              <div key={i} className={styles.item}>
                <img
                  src={item.image || 'https://via.placeholder.com/60'}
                  alt={item.name}
                  className={styles.itemImg}
                />
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemSub}>
                    Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className={styles.itemTotal}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Customer Details */}
          <div className={styles.card}>
            <h3>👤 Customer Details</h3>
            <div className={styles.detailGrid}>
              <div>
                <label>Name</label>
                <p>{order.user?.name || '—'}</p>
              </div>
              <div>
                <label>Email</label>
                <p>
                  <a
                    href={`mailto:${order.user?.email}`}
                    style={{ color: '#7c3aed', textDecoration: 'none' }}
                  >
                    {order.user?.email || '—'}
                  </a>
                </p>
              </div>
              <div>
                <label>Phone</label>
                <p>{order.shippingAddress?.phone || '—'}</p>
              </div>
              <div>
                <label>Payment Status</label>
                <p style={{ color: order.isPaid ? '#10b981' : '#f59e0b', fontWeight: '700' }}>
                  {order.isPaid
                    ? `✅ Paid on ${new Date(order.paidAt).toLocaleDateString('en-IN')}`
                    : '⏳ Pending'}
                </p>
              </div>
              <div>
                <label>Payment Method</label>
                <p>{order.paymentMethod || 'Razorpay'}</p>
              </div>
              {order.paymentResult?.razorpayPaymentId && (
                <div>
                  <label>Transaction ID</label>
                  <p style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {order.paymentResult.razorpayPaymentId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className={styles.card}>
            <h3>📍 Shipping Address</h3>
            {order.shippingAddress ? (
              <div className={styles.address}>
                <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>
                  {order.shippingAddress.name}
                </p>
                <p>📞 {order.shippingAddress.phone}</p>
                <p>🏠 {order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                </p>
              </div>
            ) : (
              <p style={{ color: '#888' }}>No address on record</p>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className={styles.sideCol}>

          {/* Price Summary */}
          <div className={styles.card}>
            <h3>💰 Price Summary</h3>
            <div className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span>Items ({order.orderItems?.reduce((a, i) => a + i.quantity, 0)})</span>
                <span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Shipping</span>
                <span style={{ color: order.shippingPrice === 0 ? '#10b981' : 'inherit' }}>
                  {order.shippingPrice === 0 ? '🎉 FREE' : `₹${order.shippingPrice}`}
                </span>
              </div>
              <div className={styles.priceRow}>
                <span>Tax (5%)</span>
                <span>₹{order.taxPrice?.toLocaleString('en-IN')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className={`${styles.priceRow} ${styles.discountRow}`}>
                  <span>Coupon ({order.couponCode})</span>
                  <span>− ₹{order.discountAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <strong style={{ color: '#ff6b9d', fontSize: '1.2rem' }}>
                ₹{order.totalPrice?.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Update Order */}
          <div className={styles.card}>
            <h3>🔄 Update Order</h3>
            <div className="form-group">
              <label>Order Status</label>
              <select
                className="form-control"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tracking Number (optional)</label>
              <input
                className="form-control"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. DTDC123456789"
              />
              <small style={{ color: '#888', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Customer will receive email with tracking info
              </small>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
              onClick={handleUpdate}
              disabled={updating}
            >
              {updating ? '⏳ Updating...' : '💾 Update & Notify Customer'}
            </button>
            <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '8px' }}>
              📧 Customer will be notified by email
            </p>
          </div>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <div className={styles.card} style={{ background: '#e0f2fe', border: '1px solid #7dd3fc' }}>
              <h3 style={{ color: '#0369a1' }}>📦 Tracking Info</h3>
              <p style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0369a1', fontSize: '15px' }}>
                {order.trackingNumber}
              </p>
            </div>
          )}

          {/* Delivered */}
          {order.isDelivered && (
            <div className={styles.card} style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }}>
              <h3 style={{ color: '#065f46' }}>🎉 Delivered</h3>
              <p style={{ color: '#047857', fontSize: '13px' }}>
                Delivered on {order.deliveredAt
                  ? new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}