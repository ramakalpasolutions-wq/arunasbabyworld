'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './OrderDetailClient.module.css';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

const STATUS_COLOR = {
  Pending:    '#f59e0b',
  Confirmed:  '#3b82f6',
  Processing: '#8b5cf6',
  Shipped:    '#06b6d4',
  Delivered:  '#10b981',
  Cancelled:  '#ef4444',
  Refunded:   '#6b7280',
};

const STATUS_EMOJI = {
  Pending:    '📋',
  Confirmed:  '✅',
  Processing: '⚙️',
  Shipped:    '🚚',
  Delivered:  '🎉',
  Cancelled:  '❌',
  Refunded:   '↩️',
};

export default function OrderDetailClient({ id }) {
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => { setOrder(d.order); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', border: '4px solid #F3E8FF', borderTop: '4px solid #7B2FBE', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#9585B0', fontFamily: 'Nunito, sans-serif', fontWeight: '600' }}>Loading your order...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!order) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
      <h2 style={{ fontFamily: 'Nunito, sans-serif', color: '#2D1A4A' }}>Order not found</h2>
      <Link href="/" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 28px', background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontFamily: 'Nunito, sans-serif' }}>
        Go Home
      </Link>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) 20px', fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 6px' }}>
            Order Details
          </h1>
          <p style={{ color: '#9585B0', margin: '0 0 4px', fontWeight: '600', fontSize: '0.88rem' }}>
            #{order.id?.slice(-12).toUpperCase()}
          </p>
          <p style={{ color: '#9585B0', margin: 0, fontWeight: '600', fontSize: '0.85rem' }}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 18px',
            background: `${STATUS_COLOR[order.orderStatus]}15`,
            border: `2px solid ${STATUS_COLOR[order.orderStatus]}35`,
            borderRadius: '999px',
            color: STATUS_COLOR[order.orderStatus],
            fontWeight: '800', fontSize: '0.92rem',
          }}>
            {STATUS_EMOJI[order.orderStatus]} {order.orderStatus}
          </span>
          <Link href="/products" style={{ padding: '10px 20px', border: '2px solid #EDD9FF', borderRadius: '12px', color: '#7B2FBE', textDecoration: 'none', fontWeight: '700', fontSize: '0.88rem', background: 'white' }}>
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* ✅ LIVE TRACKING TIMELINE */}
      {!isCancelled && (
        <div style={{ background: 'white', borderRadius: '24px', padding: 'clamp(20px,3vw,36px)', boxShadow: '0 8px 32px rgba(123,47,190,0.08)', border: '1.5px solid #F3E8FF', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', animation: 'liveBlip 1.5s ease-in-out infinite' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', margin: 0 }}>
              Live Order Tracking
            </h3>
          </div>

          {/* Horizontal on desktop, vertical on mobile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {STATUS_STEPS.map((step, i) => {
              const isDone    = i < currentStep;
              const isCurrent = i === currentStep;

              return (
                <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
                  {/* Circle + Line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isCurrent ? '1.3rem' : '1rem',
                      background: isDone
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : isCurrent
                          ? `linear-gradient(135deg, ${STATUS_COLOR[order.orderStatus]}, ${STATUS_COLOR[order.orderStatus]}CC)`
                          : '#F3F4F6',
                      color: isDone || isCurrent ? 'white' : '#9CA3AF',
                      boxShadow: isCurrent
                        ? `0 0 0 5px ${STATUS_COLOR[order.orderStatus]}22, 0 6px 18px ${STATUS_COLOR[order.orderStatus]}30`
                        : isDone
                          ? '0 4px 12px rgba(16,185,129,0.22)'
                          : 'none',
                      animation: isCurrent ? 'trackingPulse 2s ease-in-out infinite' : 'none',
                      fontWeight: '800',
                      transition: 'all 0.3s ease',
                    }}>
                      {isDone ? '✓' : STATUS_EMOJI[step]}
                    </div>

                    {/* Connector line */}
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{
                        width: '3px',
                        height: '32px',
                        background: isDone
                          ? 'linear-gradient(to bottom, #10B981, #059669)'
                          : '#E5E7EB',
                        marginTop: '3px',
                        marginBottom: '3px',
                        borderRadius: '999px',
                        transition: 'all 0.3s ease',
                      }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ paddingTop: '12px', paddingBottom: i < STATUS_STEPS.length - 1 ? '16px' : '0', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <p style={{
                        fontSize: '0.96rem',
                        fontWeight: isCurrent ? '800' : isDone ? '700' : '600',
                        color: isCurrent
                          ? STATUS_COLOR[order.orderStatus]
                          : isDone
                            ? '#10B981'
                            : '#9CA3AF',
                        margin: 0,
                      }}>
                        {step}
                      </p>
                      {isCurrent && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          background: `${STATUS_COLOR[order.orderStatus]}15`,
                          color: STATUS_COLOR[order.orderStatus],
                          border: `1.5px solid ${STATUS_COLOR[order.orderStatus]}30`,
                          padding: '2px 10px',
                          borderRadius: '999px',
                          letterSpacing: '0.4px',
                        }}>
                          ● In Progress
                        </span>
                      )}
                      {isDone && (
                        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#10B981' }}>
                          ✅ Done
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: '3px 0 0', fontWeight: '500' }}>
                      {isDone
                        ? 'Completed successfully'
                        : isCurrent
                          ? 'Currently being processed...'
                          : 'Waiting...'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '20px', padding: '20px 24px', display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '24px' }}>
          <span style={{ fontSize: '2rem' }}>❌</span>
          <div>
            <strong style={{ color: '#DC2626', fontSize: '1rem' }}>Order {order.orderStatus}</strong>
            <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#6B7280' }}>
              This order has been {order.orderStatus.toLowerCase()}. If you paid, a refund will be processed within 5–7 business days.
            </p>
          </div>
        </div>
      )}

      {/* Tracking Number */}
      {order.trackingNumber && (
        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #E0F2FE, #EDE9FE)', border: '1.5px solid #7DD3FC', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>📦 Tracking Number</p>
            <p style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0369A1', fontSize: '1.1rem', margin: 0 }}>{order.trackingNumber}</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(order.trackingNumber); }} style={{ padding: '8px 16px', background: '#0369A1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.80rem', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            📋 Copy
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: '20px' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Order Items */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(123,47,190,0.07)', border: '1.5px solid #F3E8FF' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 16px' }}>
              🛍️ Ordered Items ({order.orderItems?.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {order.orderItems?.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F3E8FF' }}>
                  <img src={item.image || 'https://via.placeholder.com/56'} alt={item.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.90rem', fontWeight: '700', color: '#2D1A4A', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ fontSize: '0.78rem', color: '#9585B0', margin: 0, fontWeight: '600' }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                  </div>
                  <strong style={{ color: '#FF6B35', whiteSpace: 'nowrap' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(123,47,190,0.07)', border: '1.5px solid #F3E8FF' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 16px' }}>💳 Payment Info</h3>
            {[
              { label: 'Payment Method', value: order.paymentMethod },
              { label: 'Payment Status', value: order.isPaid ? '✅ Paid' : '⏳ Pending', color: order.isPaid ? '#10B981' : '#F59E0B' },
              ...(order.isPaid && order.paidAt ? [{ label: 'Paid On', value: new Date(order.paidAt).toLocaleDateString('en-IN') }] : []),
              ...(order.paymentResult?.razorpayPaymentId ? [{ label: 'Transaction ID', value: order.paymentResult.razorpayPaymentId, mono: true }] : []),
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3E8FF' }}>
                <span style={{ fontSize: '0.85rem', color: '#9585B0', fontWeight: '600' }}>{row.label}</span>
                <strong style={{ fontSize: '0.88rem', color: row.color || '#2D1A4A', fontFamily: row.mono ? 'monospace' : 'Nunito, sans-serif' }}>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Price Summary */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(123,47,190,0.07)', border: '1.5px solid #F3E8FF' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 16px' }}>💰 Price Summary</h3>
            {[
              { label: 'Items', value: `₹${order.itemsPrice?.toLocaleString('en-IN')}` },
              { label: 'Shipping', value: order.shippingPrice === 0 ? '🎉 FREE' : `₹${order.shippingPrice}`, color: order.shippingPrice === 0 ? '#10B981' : undefined },
              { label: 'Tax', value: `₹${order.taxPrice?.toLocaleString('en-IN')}` },
              ...(order.discountAmount > 0 ? [{ label: `Coupon (${order.couponCode})`, value: `− ₹${order.discountAmount?.toLocaleString('en-IN')}`, color: '#10B981' }] : []),
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3E8FF' }}>
                <span style={{ fontSize: '0.85rem', color: '#9585B0', fontWeight: '600' }}>{row.label}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: row.color || '#2D1A4A' }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', marginTop: '6px' }}>
              <span style={{ fontWeight: '800', color: '#2D1A4A' }}>Total</span>
              <strong style={{ fontSize: '1.2rem', color: '#FF6B35' }}>₹{order.totalPrice?.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Delivery Address */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(123,47,190,0.07)', border: '1.5px solid #F3E8FF' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 14px' }}>📍 Delivery Address</h3>
            {order.shippingAddress ? (
              <div style={{ lineHeight: 1.8 }}>
                <p style={{ fontWeight: '800', color: '#2D1A4A', margin: '0 0 2px', fontSize: '0.95rem' }}>{order.shippingAddress.name}</p>
                <p style={{ color: '#6B4E8A', margin: '0 0 2px', fontSize: '0.85rem', fontWeight: '600' }}>📞 {order.shippingAddress.phone}</p>
                <p style={{ color: '#6B4E8A', margin: '0 0 2px', fontSize: '0.85rem', fontWeight: '600' }}>🏠 {order.shippingAddress.address}</p>
                <p style={{ color: '#6B4E8A', margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
              </div>
            ) : (
              <p style={{ color: '#9CA3AF' }}>No address on record</p>
            )}
          </div>

          {/* Delivered card */}
          {order.isDelivered && (
            <div style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', borderRadius: '20px', padding: '20px 24px', border: '1.5px solid #6EE7B7', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <div>
                <strong style={{ fontSize: '1rem', color: '#065F46' }}>Order Delivered!</strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#047857' }}>
                  {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes liveBlip {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes trackingPulse {
          0%, 100% { box-shadow: 0 0 0 5px rgba(255,107,53,0.15); }
          50%       { box-shadow: 0 0 0 10px rgba(255,107,53,0.06); }
        }
        @media (max-width: 768px) {
          .orderGrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}