'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './OrderDetailClient.module.css';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
const STATUS_COLOR = {
  Pending: '#f59e0b', Confirmed: '#3b82f6', Processing: '#8b5cf6',
  Shipped: '#06b6d4', Delivered: '#10b981', Cancelled: '#ef4444', Refunded: '#6b7280',
};

export default function OrderDetailClient({ id }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => { setOrder(d.order); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className={`container ${styles.loading}`}>
      <div className="spinner" style={{ margin: '100px auto' }} />
    </div>
  );

  if (!order) return (
    <div className={`container ${styles.notFound}`}>
      <span>📦</span>
      <h2>Order not found</h2>
      <Link href="/" className="btn btn-primary">Go Home</Link>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';

  return (
    <div className={`container ${styles.page}`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Order Details</h1>
          <p className={styles.orderId}>Order #{order.id?.slice(-12).toUpperCase()}</p>
          <p className={styles.orderDate}>Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.statusBadge} style={{ background: `${STATUS_COLOR[order.orderStatus]}18`, color: STATUS_COLOR[order.orderStatus] }}>
            {order.orderStatus}
          </span>
          <Link href="/products" className="btn btn-outline">Continue Shopping</Link>
        </div>
      </div>

      {/* Progress Tracker */}
      {!isCancelled && (
        <div className={styles.tracker}>
          <h3>Order Progress</h3>
          <div className={styles.steps}>
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={`${styles.step} ${i <= currentStep ? styles.stepDone : ''} ${i === currentStep ? styles.stepCurrent : ''}`}>
                <div className={styles.stepCircle}>
                  {i < currentStep ? '✓' : (
                    <span>{['📋', '✅', '⚙️', '🚚', '🎉'][i]}</span>
                  )}
                </div>
                <span className={styles.stepLabel}>{step}</span>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`${styles.stepLine} ${i < currentStep ? styles.stepLineDone : ''}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className={styles.cancelledBanner}>
          <span>❌</span>
          <div>
            <strong>Order {order.orderStatus}</strong>
            <p>This order has been {order.orderStatus.toLowerCase()}. If you paid, a refund will be processed within 5–7 business days.</p>
          </div>
        </div>
      )}

      <div className={styles.layout}>
        {/* Left: Items + Payment */}
        <div className={styles.mainCol}>
          {/* Order Items */}
          <div className={styles.card}>
            <h3>Ordered Items ({order.orderItems?.length})</h3>
            <div className={styles.items}>
              {order.orderItems?.map((item, i) => (
                <div key={i} className={styles.item}>
                  <div className={styles.itemImg}>
                    <img src={item.image || 'https://via.placeholder.com/70'} alt={item.name} />
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemQty}>Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className={styles.itemTotal}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className={styles.card}>
            <h3>Payment Information</h3>
            <div className={styles.paymentGrid}>
              <div className={styles.payRow}>
                <span>Payment Method</span>
                <strong>{order.paymentMethod}</strong>
              </div>
              <div className={styles.payRow}>
                <span>Payment Status</span>
                <strong style={{ color: order.isPaid ? 'var(--success)' : 'var(--warning)' }}>
                  {order.isPaid ? '✅ Paid' : '⏳ Pending'}
                </strong>
              </div>
              {order.isPaid && order.paidAt && (
                <div className={styles.payRow}>
                  <span>Paid On</span>
                  <strong>{new Date(order.paidAt).toLocaleDateString('en-IN')}</strong>
                </div>
              )}
              {order.paymentResult?.razorpayPaymentId && (
                <div className={styles.payRow}>
                  <span>Transaction ID</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{order.paymentResult.razorpayPaymentId}</strong>
                </div>
              )}
              {order.trackingNumber && (
                <div className={styles.payRow}>
                  <span>Tracking Number</span>
                  <strong style={{ fontFamily: 'monospace' }}>{order.trackingNumber}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Summary + Address */}
        <div className={styles.sideCol}>
          {/* Price Summary */}
          <div className={styles.card}>
            <h3>Price Summary</h3>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}><span>Items</span><span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span></div>
              <div className={styles.summaryRow}><span>Shipping</span><span style={{ color: order.shippingPrice === 0 ? 'var(--success)' : undefined }}>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
              <div className={styles.summaryRow}><span>Tax</span><span>₹{order.taxPrice?.toLocaleString('en-IN')}</span></div>
              {order.discountAmount > 0 && (
                <div className={`${styles.summaryRow} ${styles.discount}`}><span>Coupon ({order.couponCode})</span><span>− ₹{order.discountAmount?.toLocaleString('en-IN')}</span></div>
              )}
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <strong>₹{order.totalPrice?.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Shipping Address */}
          <div className={styles.card}>
            <h3>Delivery Address</h3>
            {order.shippingAddress ? (
              <div className={styles.address}>
                <p><strong>{order.shippingAddress.name}</strong></p>
                <p>{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              </div>
            ) : <p className={styles.noAddress}>No address on record</p>}
          </div>

          {/* Delivery status */}
          {order.isDelivered && (
            <div className={styles.deliveredCard}>
              <span>🎉</span>
              <div>
                <strong>Order Delivered!</strong>
                <p>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
