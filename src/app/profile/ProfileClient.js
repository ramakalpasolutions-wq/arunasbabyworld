'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './profile.module.css';

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

const STATUS_COLOR = {
  Pending:          '#f59e0b',
  Confirmed:        '#3b82f6',
  Processing:       '#8b5cf6',
  Shipped:          '#06b6d4',
  Delivered:        '#10b981',
  Cancelled:        '#ef4444',
  Refunded:         '#10b981',
  Return_Requested: '#f97316',
};

const STATUS_EMOJI = {
  Pending:          '📋',
  Confirmed:        '✅',
  Processing:       '⚙️',
  Shipped:          '🚚',
  Delivered:        '🎉',
  Cancelled:        '❌',
  Refunded:         '💰',
  Return_Requested: '🔄',
};

const STATUS_DESC = {
  Pending:    'Order received, waiting for confirmation',
  Confirmed:  'Order confirmed by our team',
  Processing: 'Your order is being packed',
  Shipped:    'Order is on the way to you',
  Delivered:  'Order delivered successfully!',
};

// ✅ Calculate expected delivery date (5–6 working days)
function getExpectedDelivery(createdAt) {
  const date = new Date(createdAt);

  // Find 5th working day (min)
  let count = 0;
  let minDate = new Date(date);
  while (count < 5) {
    minDate.setDate(minDate.getDate() + 1);
    const day = minDate.getDay();
    if (day !== 0 && day !== 6) count++;
  }

  // Find 6th working day (max)
  let maxDate = new Date(minDate);
  let found = false;
  while (!found) {
    maxDate.setDate(maxDate.getDate() + 1);
    const day = maxDate.getDay();
    if (day !== 0 && day !== 6) found = true;
  }

  const fmt = (d) => d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return { min: fmt(minDate), max: fmt(maxDate) };
}

/* ══════════════════════════════════════════
   ORDER TRACKING CARD
══════════════════════════════════════════ */
function OrderTrackingCard({ order }) {
  const [expanded, setExpanded] = useState(false);

 const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
const isCancelled = order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';
const isDelivered = order.orderStatus === 'Delivered';
const color       = STATUS_COLOR[order.orderStatus] || '#888';
const hasExchange = !!order.exchangeId; // ✅ NEW

const expected = getExpectedDelivery(order.createdAt);

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      border: `1.5px solid ${color}25`,
      boxShadow: '0 4px 20px rgba(123,47,190,0.07)',
      overflow: 'hidden',
      fontFamily: 'Nunito, sans-serif',
    }}>

      {/* ── Card Header ── */}
      <div style={{
        padding: '18px 20px',
        background: `linear-gradient(135deg, ${color}08, white)`,
        borderBottom: `1.5px solid ${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div>
          {/* Order ID + Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#2D1A4A' }}>
              #{order.id?.slice(-10).toUpperCase()}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 12px',
              background: `${color}15`,
              border: `1.5px solid ${color}30`,
              borderRadius: '999px',
              color: color,
              fontWeight: '800',
              fontSize: '0.78rem',
            }}>
              {!isCancelled && (
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: color, display: 'inline-block',
                  animation: currentStep < STATUS_STEPS.length - 1 && !isCancelled
                    ? 'liveBlip 1.5s ease-in-out infinite' : 'none',
                }} />
              )}
              {STATUS_EMOJI[order.orderStatus]} {order.orderStatus}
            </span>
          </div>

          {/* Placed date */}
          <p style={{ fontSize: '0.78rem', color: '#9585B0', margin: '4px 0 0', fontWeight: '600' }}>
            📦 Ordered: {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>

          {/* ✅ Expected delivery — show for active orders */}
          {!isCancelled && !isDelivered && (
            <p style={{ fontSize: '0.78rem', color: '#7B2FBE', margin: '2px 0 0', fontWeight: '700' }}>
              🗓️ Expected: {expected.min} – {expected.max}
            </p>
          )}

          {/* ✅ Actual delivery date — show when delivered */}
          {isDelivered && order.deliveredAt && (
            <p style={{ fontSize: '0.78rem', color: '#10B981', margin: '2px 0 0', fontWeight: '700' }}>
              🎉 Delivered: {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          )}

          {/* If delivered but no deliveredAt */}
          {isDelivered && !order.deliveredAt && (
            <p style={{ fontSize: '0.78rem', color: '#10B981', margin: '2px 0 0', fontWeight: '700' }}>
              🎉 Delivered successfully
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ color: '#FF6B35', fontSize: '1rem' }}>
            ₹{order.totalPrice?.toLocaleString('en-IN')}
          </strong>
          <button
            onClick={() => setExpanded(prev => !prev)}
            style={{
              padding: '7px 14px',
              background: expanded ? `${color}15` : '#F3E8FF',
              color: expanded ? color : '#7B2FBE',
              border: `1.5px solid ${expanded ? color + '40' : '#EDD9FF'}`,
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.80rem',
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
              whiteSpace: 'nowrap',
            }}
          >
            {expanded ? '▲ Hide' : '▼ Details'}
          </button>
        </div>
      </div>
{/* ✅ NEW: Exchange Status Badge */}
{hasExchange && (
  <div style={{
    margin: '0 20px',
    marginTop: '14px',
    padding: '10px 14px',
    background: order.exchangeStatus === 'completed' 
      ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' 
      : 'linear-gradient(135deg, #FFF3E8, #FFE4CC)',
    border: `1.5px solid ${order.exchangeStatus === 'completed' ? '#10B981' : '#FF6B35'}`,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  }}>
    <span style={{ fontSize: '1.3rem' }}>
      {order.exchangeStatus === 'completed' ? '🎉' : '🔄'}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ 
        margin: 0, 
        fontSize: '0.84rem', 
        fontWeight: '800', 
        color: order.exchangeStatus === 'completed' ? '#065F46' : '#9A3412',
      }}>
        {order.exchangeStatus === 'completed' 
          ? '✅ Exchange Completed!' 
          : `🔄 Exchange in Progress — ${order.exchangeStatus?.replace(/_/g, ' ')}`}
      </p>
      <p style={{ 
        margin: '2px 0 0', 
        fontSize: '0.74rem', 
        color: order.exchangeStatus === 'completed' ? '#047857' : '#7C2D12', 
        fontWeight: '600',
      }}>
        {order.exchangeStatus === 'completed' 
          ? 'New product delivered to you' 
          : 'Click "View Details" to track exchange'}
      </p>
    </div>
    <Link href="/orders/exchanges" style={{
      padding: '6px 14px',
      background: 'white',
      color: order.exchangeStatus === 'completed' ? '#10B981' : '#FF6B35',
      border: `1.5px solid ${order.exchangeStatus === 'completed' ? '#10B981' : '#FF6B35'}`,
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '800',
      fontSize: '0.76rem',
      whiteSpace: 'nowrap',
    }}>
      🔄 View Exchange
    </Link>
  </div>
)}
      {/* ── Items Preview ── */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${color}12`, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {order.orderItems?.slice(0, 3).map((item, i) => (
            <img key={i} src={item.image || 'https://via.placeholder.com/40'} alt={item.name}
              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #F3E8FF', flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#2D1A4A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.orderItems?.[0]?.name}
            {order.orderItems?.length > 1 ? ` + ${order.orderItems.length - 1} more` : ''}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#9585B0', margin: '2px 0 0', fontWeight: '600' }}>
            {order.orderItems?.length} item{order.orderItems?.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href={`/orders/${order.id}`} style={{ padding: '6px 14px', background: 'white', color: '#7B2FBE', border: '1.5px solid #EDD9FF', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '0.78rem', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>
          View Details →
        </Link>
      </div>

      {/* ── INLINE TRACKING TIMELINE ── */}
      <div style={{ padding: '18px 20px' }}>

   {isCancelled ? (
  <div style={{
    padding: '14px 18px',
    background: order.orderStatus === 'Refunded' ? '#ECFDF5' : '#FEF2F2',
    border: `1.5px solid ${order.orderStatus === 'Refunded' ? '#10B981' : '#FCA5A5'}`,
    borderRadius: '14px',
    display: 'flex', gap: '12px', alignItems: 'flex-start',
  }}>
    <span style={{ fontSize: '1.5rem' }}>
      {order.orderStatus === 'Refunded' ? '💰' : '✅'}
    </span>
    <div style={{ flex: 1 }}>
      <strong style={{
        color: order.orderStatus === 'Refunded' ? '#065F46' : '#DC2626',
        fontSize: '0.95rem',
      }}>
        {order.orderStatus === 'Refunded' ? '✅ Order Refunded' : `Order ${order.orderStatus}`}
      </strong>
      {order.orderStatus === 'Refunded' && order.refundAmount && (
        <p style={{
          margin: '6px 0 0', fontSize: '0.88rem',
          color: '#065F46', fontWeight: '800',
        }}>
          💵 Refunded: ₹{order.refundAmount.toLocaleString('en-IN')}
        </p>
      )}
      {order.refundStatus === 'completed' && (
        <p style={{
          margin: '4px 0 0', fontSize: '0.82rem',
          color: '#047857', fontWeight: '700',
        }}>
          ✅ Money credited to your account
        </p>
      )}
      {order.refundStatus === 'processing' && (
        <p style={{
          margin: '4px 0 0', fontSize: '0.82rem',
          color: '#1E40AF', fontWeight: '700',
        }}>
          ⚙️ Refund processing — will reach you in 2-3 hours
        </p>
      )}
      {order.refundStatus === 'scheduled' && (
        <p style={{
          margin: '4px 0 0', fontSize: '0.82rem',
          color: '#EA580C', fontWeight: '700',
        }}>
          ⏱️ Refund scheduled — processing soon
        </p>
      )}
      {order.refundStatus === 'pending' && (
        <p style={{
          margin: '4px 0 0', fontSize: '0.82rem',
          color: '#92400E', fontWeight: '700',
        }}>
          🟡 Refund being processed — 5-7 business days
        </p>
      )}
      {!order.refundStatus && (
        <p style={{
          margin: '4px 0 0', fontSize: '0.80rem',
          color: '#6B7280', fontWeight: '500',
        }}>
          {order.orderStatus === 'Refunded'
            ? 'Refund will be processed within 5-7 business days.'
            : 'Your order has been cancelled.'}
        </p>
      )}
    </div>
  </div>
) : (
          <>
            {/* HORIZONTAL STEP TRACKER */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>

                {/* Background line */}
                <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', height: '3px', background: '#E5E7EB', zIndex: 0 }} />

                {/* Filled line */}
                <div style={{
                  position: 'absolute', top: '20px', left: '20px', height: '3px',
                  background: `linear-gradient(to right, ${color}, ${color}88)`,
                  zIndex: 1,
                  width: currentStep <= 0 ? '0%' : `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`,
                  transition: 'width 0.5s ease',
                }} />

                {/* Steps */}
                {STATUS_STEPS.map((step, i) => {
                  const isDone    = i < currentStep;
                  const isCurrent = i === currentStep;
                  return (
                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, position: 'relative', zIndex: 2 }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: isDone ? '1rem' : '1.1rem', fontWeight: '800',
                        background: isDone
                          ? 'linear-gradient(135deg, #10B981, #059669)'
                          : isCurrent
                            ? `linear-gradient(135deg, ${color}, ${color}BB)`
                            : 'white',
                        border: isCurrent ? `3px solid ${color}` : isDone ? '3px solid #10B981' : '3px solid #E5E7EB',
                        color: isDone || isCurrent ? 'white' : '#9CA3AF',
                        boxShadow: isCurrent ? `0 0 0 5px ${color}20, 0 4px 14px ${color}30` : isDone ? '0 3px 10px rgba(16,185,129,0.20)' : 'none',
                        animation: isCurrent ? 'trackPulse 2s ease-in-out infinite' : 'none',
                        transition: 'all 0.3s ease',
                      }}>
                        {isDone ? '✓' : STATUS_EMOJI[step]}
                      </div>
                      <span style={{
                        fontSize: 'clamp(0.58rem,1.2vw,0.72rem)',
                        fontWeight: isCurrent ? '800' : isDone ? '700' : '600',
                        color: isCurrent ? color : isDone ? '#10B981' : '#9CA3AF',
                        textAlign: 'center', lineHeight: 1.3, maxWidth: '60px',
                      }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current status + delivery info box */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: `${color}10`, border: `1.5px solid ${color}25`, borderRadius: '12px', marginTop: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0, marginTop: '5px', animation: currentStep < STATUS_STEPS.length - 1 ? 'liveBlip 1.5s ease-in-out infinite' : 'none' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.82rem', fontWeight: '800', color: color, margin: 0 }}>
                  {STATUS_EMOJI[order.orderStatus]} {order.orderStatus}
                </p>
                <p style={{ fontSize: '0.76rem', color: '#6B4E8A', margin: '2px 0 0', fontWeight: '600' }}>
                  {STATUS_DESC[order.orderStatus] || 'Order in progress'}
                </p>

                {/* ✅ Expected delivery in status box */}
                {!isDelivered && (
                  <p style={{ fontSize: '0.74rem', color: '#7B2FBE', margin: '5px 0 0', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🗓️ Expected delivery:
                    <strong style={{ color: '#FF6B35', marginLeft: '4px' }}>
                      {expected.min} – {expected.max}
                    </strong>
                  </p>
                )}

                {/* ✅ Actual delivery date in status box */}
                {isDelivered && order.deliveredAt && (
                  <p style={{ fontSize: '0.74rem', color: '#10B981', margin: '5px 0 0', fontWeight: '700' }}>
                    📅 Delivered on {new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              {/* Tracking number */}
              {order.trackingNumber && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.65rem', color: '#9585B0', fontWeight: '700', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tracking No.
                  </p>
                  <p style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0369A1', fontSize: '0.80rem', margin: 0 }}>
                    {order.trackingNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Delivered celebration card */}
            {isDelivered && (
              <div style={{ marginTop: '10px', padding: '14px 16px', background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', border: '1.5px solid #6EE7B7', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '1.8rem' }}>🎉</span>
                <div>
                  <strong style={{ fontSize: '0.90rem', color: '#065F46' }}>Order Delivered!</strong>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#047857', fontWeight: '600' }}>
                    {order.deliveredAt
                      ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : 'Delivered successfully ✅'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Expanded Details ── */}
      {expanded && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${color}15` }}>
          <div style={{ paddingTop: '16px' }}>

            {/* Items full list */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                🛍️ Items
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.orderItems?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#FAFAFA', borderRadius: '10px', border: '1px solid #F3E8FF' }}>
                    <img src={item.image || 'https://via.placeholder.com/44'} alt={item.name}
                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.84rem', fontWeight: '700', color: '#2D1A4A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: '0.74rem', color: '#9585B0', margin: '2px 0 0', fontWeight: '600' }}>
                        Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <strong style={{ color: '#FF6B35', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ Delivery Date Info */}
            <div style={{ marginBottom: '12px', padding: '14px 16px', background: isDelivered ? 'linear-gradient(135deg,#F0FDF4,#D1FAE5)' : 'linear-gradient(135deg,#F8F4FF,#EDE9FE)', borderRadius: '14px', border: `1.5px solid ${isDelivered ? '#6EE7B7' : '#DDD6FE'}` }}>
              <h4 style={{ fontSize: '0.80rem', fontWeight: '800', color: isDelivered ? '#065F46' : '#7B2FBE', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                🗓️ Delivery Info
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.80rem', color: '#6B7280', fontWeight: '600' }}>Order Placed</span>
                  <span style={{ fontSize: '0.80rem', fontWeight: '700', color: '#2D1A4A' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {!isDelivered && !isCancelled && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.80rem', color: '#6B7280', fontWeight: '600' }}>Expected Delivery</span>
                    <span style={{ fontSize: '0.80rem', fontWeight: '800', color: '#FF6B35' }}>
                      {expected.min} – {expected.max}
                    </span>
                  </div>
                )}
                {isDelivered && order.deliveredAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.80rem', color: '#6B7280', fontWeight: '600' }}>Delivered On</span>
                    <span style={{ fontSize: '0.80rem', fontWeight: '800', color: '#10B981' }}>
                      {new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {!isCancelled && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.80rem', color: '#6B7280', fontWeight: '600' }}>Delivery Type</span>
                    <span style={{ fontSize: '0.80rem', fontWeight: '700', color: '#2D1A4A' }}>
                      {order.shippingPrice === 0 ? '🎉 FREE Delivery' : `₹${order.shippingPrice} Delivery`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Price + Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

              {/* Price */}
              <div style={{ padding: '14px', background: '#F8F4FF', borderRadius: '14px', border: '1px solid #EDD9FF' }}>
                <h4 style={{ fontSize: '0.80rem', fontWeight: '800', color: '#7B2FBE', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  💰 Price
                </h4>
                {[
                  { label: 'Items', value: `₹${order.itemsPrice?.toLocaleString('en-IN')}` },
                  { label: 'Shipping', value: order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`, color: order.shippingPrice === 0 ? '#10B981' : undefined },
                  { label: 'Tax', value: `₹${order.taxPrice?.toLocaleString('en-IN')}` },
                  ...(order.discountAmount > 0 ? [{ label: 'Coupon', value: `−₹${order.discountAmount?.toLocaleString('en-IN')}`, color: '#10B981' }] : []),
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #EDD9FF' }}>
                    <span style={{ fontSize: '0.78rem', color: '#9585B0', fontWeight: '600' }}>{row.label}</span>
                    <span style={{ fontSize: '0.80rem', fontWeight: '700', color: row.color || '#2D1A4A' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#2D1A4A' }}>Total</span>
                  <strong style={{ color: '#FF6B35' }}>₹{order.totalPrice?.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Address */}
              <div style={{ padding: '14px', background: '#F0FDF4', borderRadius: '14px', border: '1px solid #BBF7D0' }}>
                <h4 style={{ fontSize: '0.80rem', fontWeight: '800', color: '#166534', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  📍 Delivery
                </h4>
                {order.shippingAddress ? (
                  <div style={{ lineHeight: 1.7 }}>
                    <p style={{ fontWeight: '800', color: '#2D1A4A', margin: 0, fontSize: '0.84rem' }}>{order.shippingAddress.name}</p>
                    <p style={{ color: '#4B5563', margin: 0, fontSize: '0.78rem', fontWeight: '600' }}>📞 {order.shippingAddress.phone}</p>
                    <p style={{ color: '#4B5563', margin: 0, fontSize: '0.78rem', fontWeight: '600' }}>{order.shippingAddress.address}</p>
                    <p style={{ color: '#4B5563', margin: 0, fontSize: '0.78rem', fontWeight: '600' }}>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  </div>
                ) : (
                  <p style={{ color: '#9CA3AF', fontSize: '0.80rem' }}>No address</p>
                )}
              </div>
            </div>

            {/* Payment */}
            <div style={{ marginTop: '12px', padding: '12px 16px', background: '#F8F4FF', borderRadius: '12px', border: '1px solid #EDD9FF', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#9585B0', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment</p>
                <p style={{ fontSize: '0.84rem', fontWeight: '700', color: '#2D1A4A', margin: 0 }}>{order.paymentMethod}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#9585B0', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                <p style={{ fontSize: '0.84rem', fontWeight: '800', color: order.isPaid ? '#10B981' : '#F59E0B', margin: 0 }}>
                  {order.isPaid ? '✅ Paid' : '⏳ Pending'}
                </p>
              </div>
              {order.paymentResult?.razorpayPaymentId && (
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#9585B0', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transaction ID</p>
                  <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#2D1A4A', margin: 0, fontFamily: 'monospace' }}>
                    {order.paymentResult.razorpayPaymentId}
                  </p>
                </div>
              )}
            </div>

            {/* View full details */}
            <Link href={`/orders/${order.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '14px', padding: '11px', background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '800', fontSize: '0.88rem', fontFamily: 'Nunito, sans-serif' }}>
              📦 View Full Order Details →
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes liveBlip {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.5); opacity: 0.5; }
        }
        @keyframes trackPulse {
          0%, 100% { box-shadow: 0 0 0 5px rgba(255,107,53,0.15); }
          50%       { box-shadow: 0 0 0 10px rgba(255,107,53,0.06); }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PROFILE CLIENT
══════════════════════════════════════════ */
export default function ProfileClient() {
  const { data: session, status } = useSession();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const defaultTab   = searchParams.get('tab') || 'profile';

  const [activeTab,     setActiveTab]     = useState(defaultTab);
  const [userData,      setUserData]      = useState({ name: '', email: '', phone: '' });
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/profile');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
      fetchOrders();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/users/profile');
      if (res.ok) {
        const data = await res.json();
        setUserData({
          name:  data.user?.name  || session?.user?.name  || '',
          email: data.user?.email || session?.user?.email || '',
          phone: data.user?.phone || '',
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders?limit=20');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };
  // ✅ NEW: Auto-refresh orders every 10 seconds to show live refund status
useEffect(() => {
  if (status !== 'authenticated' || activeTab !== 'orders') return;
  
  const interval = setInterval(() => {
    fetchOrders();
  }, 10000); // refresh every 10 seconds
  
  return () => clearInterval(interval);
}, [status, activeTab]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!userData.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: userData.name, phone: userData.phone }),
      });
      if (res.ok) {
        toast.success('✅ Profile updated successfully!');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Update failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p style={{ color: '#888' }}>Loading your profile...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className={styles.profilePage}>

      {/* PROFILE HERO */}
      <div className={styles.profileHero}>
        <div className={styles.avatarBig}>
          {session?.user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className={styles.heroInfo}>
          <h1>{session?.user?.name || 'Customer'}</h1>
          <p>{session?.user?.email}</p>
          {session?.user?.role === 'admin' && (
            <span className={styles.adminBadge}>⚙️ Admin</span>
          )}
        </div>
        <div className={styles.heroActions}>
          {session?.user?.role === 'admin' && (
            <Link href="/admin/dashboard" className={styles.adminLink}>⚙️ Admin Panel</Link>
          )}
          <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/' })}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className={styles.quickStats}>
        {[
          { num: orders.length,                                                                           label: 'Total Orders', emoji: '📦' },
          { num: orders.filter(o => o.orderStatus === 'Delivered').length,                                label: 'Delivered',    emoji: '✅' },
          { num: orders.filter(o => o.orderStatus === 'Shipped').length,                                  label: 'In Transit',   emoji: '🚚' },
          { num: orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Confirmed').length, label: 'Pending',      emoji: '⏳' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
            <span className={styles.statNum}>{s.num}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'profile' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 My Profile
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'orders' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 My Orders
          {orders.length > 0 && <span className={styles.tabBadge}>{orders.length}</span>}
        </button>
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className={styles.tabContent}>
          <div className={styles.formCard}>
            <h2>Personal Information</h2>
            <p className={styles.formSubtitle}>Update your profile details below</p>
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>👤</span>
                  <input type="text" value={userData.name} onChange={e => setUserData(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>✉️</span>
                  <input type="email" value={userData.email} disabled className={styles.disabledField} />
                </div>
                <small className={styles.warningText}>⚠️ Email cannot be changed</small>
              </div>
              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>📞</span>
                  <input type="tel" value={userData.phone} onChange={e => setUserData(p => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </form>
          </div>

          <div className={styles.quickLinks}>
            <Link href="/products" className={styles.quickLink}><span>🛍️</span><span>Shop Products</span></Link>
            <Link href="/cart"     className={styles.quickLink}><span>🛒</span><span>My Cart</span></Link>
            <Link href="/wishlist" className={styles.quickLink}><span>❤️</span><span>Wishlist</span></Link>
            <Link href="/contact"  className={styles.quickLink}><span>📞</span><span>Contact Us</span></Link>
          </div>

          <div className={styles.logoutCard}>
            <div className={styles.logoutCardInfo}>
              <h4>Sign Out</h4>
              <p>Sign out from your BabyBliss account</p>
            </div>
            <button className={styles.logoutCardBtn} onClick={() => signOut({ callbackUrl: '/' })}>
              🚪 Logout
            </button>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className={styles.tabContent}>
          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9585B0', fontFamily: 'Nunito, sans-serif' }}>
              <div style={{ width: '44px', height: '44px', border: '4px solid #F3E8FF', borderTop: '4px solid #7B2FBE', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontWeight: '600' }}>Loading your orders...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyOrders}>
              <span>📦</span>
              <h3>No orders yet!</h3>
              <p>You haven&apos;t placed any orders yet.</p>
              <Link href="/products" className={styles.shopNowBtn}>🛍️ Start Shopping</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Info banner */}
              <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #F0FDF4, #F3E8FF)', border: '1.5px solid #BBF7D0', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'Nunito, sans-serif' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'liveBlip 1.5s ease-in-out infinite', flexShrink: 0 }} />
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#166534', margin: 0 }}>
                  Live tracking — your order status updates automatically. Expected delivery shown for active orders.
                </p>
              </div>

              {orders.map(order => (
                <OrderTrackingCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes liveBlip {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.5); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}