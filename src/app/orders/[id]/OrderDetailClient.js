'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

export default function OrderDetailClient({ id }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [openSection, setOpenSection] = useState('items');

  useEffect(() => { fetchOrder(); }, [id]);

  // ✅ Auto-refresh every 10 seconds to show live refund/exchange status
  useEffect(() => {
    if (!order) return;
    
    const needsRefresh = 
      order.refundStatus === 'pending' ||
      order.refundStatus === 'processing' ||
      order.refundStatus === 'scheduled' ||
      order.returnStatus === 'Pending' ||
      (order.exchangeId && !['completed', 'rejected', 'cancelled'].includes(order.exchangeStatus));
    
    if (!needsRefresh) return;
    
    const interval = setInterval(() => {
      fetchOrder();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [order?.refundStatus, order?.returnStatus, order?.exchangeStatus]);

  const fetchOrder = () => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(d => { setOrder(d.order); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const toggleSection = (section) => {
    setOpenSection(prev => (prev === section ? '' : section));
  };

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '50vh', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '44px', height: '44px',
        border: '4px solid #F3E8FF', borderTop: '4px solid #7B2FBE',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#9585B0', fontFamily: 'Nunito, sans-serif', fontWeight: '600' }}>
        Loading your order...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!order) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
      <h2 style={{ fontFamily: 'Nunito, sans-serif', color: '#2D1A4A' }}>Order not found</h2>
      <Link href="/" style={{
        display: 'inline-block', marginTop: '16px', padding: '12px 28px',
        background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
        color: 'white', borderRadius: '12px', textDecoration: 'none',
        fontWeight: '800', fontFamily: 'Nunito, sans-serif',
      }}>
        Go Home
      </Link>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';
  const isReturnRequested = order.orderStatus === 'Return_Requested' || !!order.returnRequest;
  const hasExchange = !!order.exchangeId;
  const canCancel = !isCancelled && !isReturnRequested;
  const canReturn = (order.orderStatus === 'Delivered' || order.isDelivered) && !isReturnRequested && !isCancelled;
  const statusColor = STATUS_COLOR[order.orderStatus] || '#6b7280';

  const accordionCard = (title, icon, section, content) => (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(123,47,190,0.07)',
      border: '1.5px solid #F3E8FF',
      cursor: 'pointer',
    }} onClick={() => toggleSection(section)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', margin: 0 }}>
          {icon} {title}
        </h3>
        <span style={{ color: '#7B2FBE', fontWeight: '800', fontSize: '1.2rem' }}>
          {openSection === section ? '−' : '+'}
        </span>
      </div>
      {openSection === section && (
        <div style={{ marginTop: '16px' }}>
          {content}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      maxWidth: '1100px', margin: '0 auto',
      padding: 'clamp(24px,4vw,48px) 20px',
      fontFamily: 'Nunito, sans-serif',
    }}>

      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap',
        gap: '16px', marginBottom: '32px',
      }}>
        <div>
          <h1 style={{
            fontSize: 'clamp(1.4rem,2.5vw,2rem)',
            fontWeight: '800', color: '#2D1A4A', margin: '0 0 6px',
          }}>
            Order Details
          </h1>
          <p style={{ color: '#9585B0', margin: '0 0 4px', fontWeight: '600', fontSize: '0.88rem' }}>
            #{order.id?.slice(-12).toUpperCase()}
          </p>
          <p style={{ color: '#9585B0', margin: 0, fontWeight: '600', fontSize: '0.85rem' }}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 18px',
            background: `${statusColor}15`,
            border: `2px solid ${statusColor}35`,
            borderRadius: '999px',
            color: statusColor,
            fontWeight: '800', fontSize: '0.92rem',
          }}>
            {STATUS_EMOJI[order.orderStatus]} {order.orderStatus?.replace('_', ' ')}
          </span>

          {canReturn && (
            <button
              onClick={() => setShowReturnModal(true)}
              style={{
                padding: '10px 18px', background: 'white',
                color: '#f97316', border: '2px solid #fed7aa',
                borderRadius: '12px', fontWeight: '800', fontSize: '0.88rem',
                fontFamily: 'Nunito, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = '#f97316'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#fed7aa'; }}
            >
              🔄 Return Item
            </button>
          )}

          {canReturn && (
            <Link
              href={`/orders/${order.id}/refund`}
              style={{
                padding: '10px 18px', background: 'white',
                color: '#7B2FBE', border: '2px solid #EDD9FF',
                borderRadius: '12px', fontWeight: '800', fontSize: '0.88rem',
                fontFamily: 'Nunito, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                textDecoration: 'none', display: 'inline-block',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F5EDFF'; e.currentTarget.style.borderColor = '#7B2FBE'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#EDD9FF'; }}
            >
              💰 Refund
            </Link>
          )}

          {canReturn && (() => {
            const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
            const daysSince   = Math.floor((new Date() - deliveredAt) / (1000 * 60 * 60 * 24));
            const within3Days = daysSince <= 3;
            const noActiveExchange = !order.exchangeId || ['rejected', 'completed', 'cancelled'].includes(order.exchangeStatus);

            if (!within3Days || !noActiveExchange) return null;

            return (
              <Link
                href={`/orders/${order.id}/exchange`}
                style={{
                  padding: '10px 18px', background: 'white',
                  color: '#FF6B35', border: '2px solid #FFD4B8',
                  borderRadius: '12px', fontWeight: '800', fontSize: '0.88rem',
                  fontFamily: 'Nunito, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                  textDecoration: 'none', display: 'inline-block',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#FFF3E8'; e.currentTarget.style.borderColor = '#FF6B35'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#FFD4B8'; }}
              >
                🔄 Exchange
              </Link>
            );
          })()}

          {isReturnRequested && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', background: '#fff7ed',
              border: '2px solid #fed7aa', borderRadius: '999px',
              color: '#f97316', fontWeight: '800', fontSize: '0.88rem',
            }}>
              🔄 Return Requested
            </span>
          )}

          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                padding: '10px 18px', background: 'white',
                color: '#EF4444', border: '2px solid #FCA5A5',
                borderRadius: '12px', fontWeight: '800', fontSize: '0.88rem',
                fontFamily: 'Nunito, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
            >
              ❌ Cancel Order
            </button>
          )}

          <Link href="/products" style={{
            padding: '10px 18px', border: '2px solid #EDD9FF',
            borderRadius: '12px', color: '#7B2FBE', textDecoration: 'none',
            fontWeight: '700', fontSize: '0.88rem', background: 'white',
          }}>
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* ✅ EXCHANGE BANNER - Shows when order has an exchange */}
      {hasExchange && (
        <ExchangeStatusBanner orderId={order.id} exchangeId={order.exchangeId} />
      )}

      {/* RETURN REQUEST BANNER */}
      {isReturnRequested && order.returnRequest && (
        <div style={{
          background: order.refundStatus === 'completed' ? '#ECFDF5' : '#fff7ed',
          border: `1.5px solid ${order.refundStatus === 'completed' ? '#10B981' : '#fed7aa'}`,
          borderRadius: '20px',
          padding: '20px 24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          marginBottom: '24px',
        }}>
          <span style={{ fontSize: '2rem' }}>
            {order.refundStatus === 'completed' ? '✅' : '🔄'}
          </span>
          <div style={{ flex: 1 }}>
            <strong style={{
              color: order.refundStatus === 'completed' ? '#065F46' : '#f97316',
              fontSize: '1rem',
              display: 'block',
              marginBottom: '4px',
            }}>
              {order.refundStatus === 'completed'
                ? '✅ Refund Completed Successfully!'
                : 'Return Request Submitted'}
            </strong>

            <p style={{
              margin: 0,
              fontSize: '0.85rem',
              color: order.refundStatus === 'completed' ? '#047857' : '#9a3412',
              lineHeight: 1.7,
              fontWeight: '600',
            }}>
              Reason: {order.returnRequest.reason}
              <br />
              Refund via:{' '}
              {order.returnRequest.refundMethod === 'upi'
                ? `UPI — ${order.returnRequest.upiId}`
                : `Bank Transfer — ${order.returnRequest.bankName || 'Bank Account'}`}
              <br />

              {order.refundStatus === 'completed' && (
                <span style={{ color: '#10B981', fontWeight: '800' }}>
                  ✅ Refund Completed — ₹
                  {order.refundAmount?.toLocaleString('en-IN') ||
                    order.totalPrice?.toLocaleString('en-IN')}{' '}
                  credited to your account
                </span>
              )}

              {order.refundStatus === 'processing' && (
                <span style={{ color: '#3B82F6', fontWeight: '800' }}>
                  ⚙️ Refund Processing — Money will reach you in 2-3 hours
                </span>
              )}

              {order.refundStatus === 'scheduled' && (
                <span style={{ color: '#F97316', fontWeight: '800' }}>
                  ⏱️ Refund Scheduled — Auto-processing soon
                </span>
              )}

              {(!order.refundStatus || order.refundStatus === 'pending') && (
                <span style={{ color: '#f97316', fontWeight: '700' }}>
                  Status: {order.returnRequest.status || 'Under Review'} — Refund within 5–7 business days after pickup.
                </span>
              )}

              {order.refundStatus === 'failed' && (
                <span style={{ color: '#EF4444', fontWeight: '800' }}>
                  ❌ Refund Failed — Please contact support
                </span>
              )}
            </p>

            {order.refundStatus === 'completed' && order.refundedAt && (
              <p style={{
                margin: '8px 0 0',
                fontSize: '0.78rem',
                color: '#047857',
                fontWeight: '700',
              }}>
                🕒 Refunded on{' '}
                {new Date(order.refundedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {!isCancelled && !isReturnRequested && (
        <div style={{
          background: 'white', borderRadius: '24px',
          padding: 'clamp(20px,3vw,36px)',
          boxShadow: '0 8px 32px rgba(123,47,190,0.08)',
          border: '1.5px solid #F3E8FF', marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#10B981', animation: 'liveBlip 1.5s ease-in-out infinite',
            }} />
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#2D1A4A', margin: 0 }}>
              Live Order Tracking
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {STATUS_STEPS.map((step, i) => {
              const isDone = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isCurrent ? '1.3rem' : '1rem',
                      background: isDone
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : isCurrent
                          ? `linear-gradient(135deg, ${statusColor}, ${statusColor}CC)`
                          : '#F3F4F6',
                      color: isDone || isCurrent ? 'white' : '#9CA3AF',
                      boxShadow: isCurrent
                        ? `0 0 0 5px ${statusColor}22, 0 6px 18px ${statusColor}30`
                        : isDone ? '0 4px 12px rgba(16,185,129,0.22)' : 'none',
                      fontWeight: '800', transition: 'all 0.3s ease',
                    }}>
                      {isDone ? '✓' : STATUS_EMOJI[step]}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{
                        width: '3px', height: '32px',
                        background: isDone
                          ? 'linear-gradient(to bottom, #10B981, #059669)'
                          : '#E5E7EB',
                        margin: '3px 0', borderRadius: '999px',
                      }} />
                    )}
                  </div>
                  <div style={{
                    paddingTop: '12px',
                    paddingBottom: i < STATUS_STEPS.length - 1 ? '16px' : '0',
                    flex: 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <p style={{
                        fontSize: '0.96rem',
                        fontWeight: isCurrent ? '800' : isDone ? '700' : '600',
                        color: isCurrent ? statusColor : isDone ? '#10B981' : '#9CA3AF',
                        margin: 0,
                      }}>
                        {step}
                      </p>
                      {isCurrent && (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: '800',
                          background: `${statusColor}15`, color: statusColor,
                          border: `1.5px solid ${statusColor}30`,
                          padding: '2px 10px', borderRadius: '999px',
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
                      {isDone ? 'Completed successfully' : isCurrent ? 'Currently being processed...' : 'Waiting...'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div style={{
          background: order.orderStatus === 'Refunded' ? '#ECFDF5' : '#FEF2F2',
          border: `1.5px solid ${order.orderStatus === 'Refunded' ? '#10B981' : '#FCA5A5'}`,
          borderRadius: '20px', padding: '20px 24px',
          display: 'flex', gap: '14px', alignItems: 'flex-start',
          marginBottom: '24px',
        }}>
          <span style={{ fontSize: '2rem' }}>
            {order.orderStatus === 'Refunded' ? '💰' : '❌'}
          </span>
          <div style={{ flex: 1 }}>
            <strong style={{
              color: order.orderStatus === 'Refunded' ? '#065F46' : '#DC2626',
              fontSize: '1rem',
            }}>
              {order.orderStatus === 'Refunded' ? '✅ Order Refunded' : `Order ${order.orderStatus}`}
            </strong>
            <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#6B7280' }}>
              {order.cancelReason && (
                <><span>Reason: <strong>{order.cancelReason}</strong></span><br /></>
              )}
              {order.cancelledAt && (
                <><span>Cancelled on: {new Date(order.cancelledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span><br /></>
              )}
              {order.refundStatus === 'processing' && (
                <span style={{ color: '#3B82F6', fontWeight: '700' }}>⚙️ Refund Processing — Money will reach you in 2-3 hours</span>
              )}
              {order.refundStatus === 'completed' && (
                <span style={{ color: '#10B981', fontWeight: '800' }}>✅ Refund completed — ₹{order.refundAmount?.toLocaleString('en-IN')} credited to your account</span>
              )}
              {order.refundStatus === 'not_required' && (
                <span style={{ color: '#6B7280', fontWeight: '600' }}>ℹ️ No refund needed (COD order)</span>
              )}
            </p>
          </div>
        </div>
      )}

      {order.trackingNumber && (
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #E0F2FE, #EDE9FE)',
          border: '1.5px solid #7DD3FC', borderRadius: '16px',
          marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '10px',
        }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px' }}>
              📦 Tracking Number
            </p>
            <p style={{ fontFamily: 'monospace', fontWeight: '800', color: '#0369A1', fontSize: '1.1rem', margin: 0 }}>
              {order.trackingNumber}
            </p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(order.trackingNumber); toast.success('Copied!'); }}
            style={{
              padding: '8px 16px', background: '#0369A1', color: 'white',
              border: 'none', borderRadius: '10px', fontWeight: '700',
              fontSize: '0.80rem', cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >
            📋 Copy
          </button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {accordionCard(
            `Ordered Items (${order.orderItems?.length || 0})`,
            '🛍️',
            'items',
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {order.orderItems?.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', background: '#FAFAFA',
                  borderRadius: '12px', border: '1.5px solid #F3E8FF',
                }}>
                  <img
                    src={item.image || 'https://via.placeholder.com/56'}
                    alt={item.name}
                    style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.90rem', fontWeight: '700', color: '#2D1A4A',
                      margin: '0 0 4px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#9585B0', margin: 0, fontWeight: '600' }}>
                      Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <strong style={{ color: '#FF6B35', whiteSpace: 'nowrap' }}>
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </strong>
                </div>
              ))}
            </div>
          )}

          {accordionCard(
            'Payment Info',
            '💳',
            'payment',
            <div>
              {[
                { label: 'Payment Method', value: order.paymentMethod },
                {
                  label: 'Payment Status',
                  value: order.isPaid ? '✅ Paid' : '⏳ Pending',
                  color: order.isPaid ? '#10B981' : '#F59E0B',
                },
                ...(order.isPaid && order.paidAt
                  ? [{ label: 'Paid On', value: new Date(order.paidAt).toLocaleDateString('en-IN') }]
                  : []),
                ...(order.paymentResult?.razorpayPaymentId
                  ? [{ label: 'Transaction ID', value: order.paymentResult.razorpayPaymentId, mono: true }]
                  : []),
                ...(order.refundAmount > 0
                  ? [{ label: 'Refund Amount', value: `₹${order.refundAmount?.toLocaleString('en-IN')}`, color: '#10B981' }]
                  : []),
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid #F3E8FF',
                }}>
                  <span style={{ fontSize: '0.85rem', color: '#9585B0', fontWeight: '600' }}>{row.label}</span>
                  <strong style={{
                    fontSize: '0.88rem', color: row.color || '#2D1A4A',
                    fontFamily: row.mono ? 'monospace' : 'Nunito, sans-serif',
                  }}>
                    {row.value}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {accordionCard(
            'Price Summary',
            '💰',
            'price',
            <div>
              {[
                { label: 'Items', value: `₹${order.itemsPrice?.toLocaleString('en-IN')}` },
                {
                  label: 'Shipping',
                  value: order.shippingPrice === 0 ? '🎉 FREE' : `₹${order.shippingPrice}`,
                  color: order.shippingPrice === 0 ? '#10B981' : undefined,
                },
                { label: 'Tax', value: `₹${order.taxPrice?.toLocaleString('en-IN')}` },
                ...(order.discountAmount > 0
                  ? [{ label: `Coupon (${order.couponCode})`, value: `− ₹${order.discountAmount?.toLocaleString('en-IN')}`, color: '#10B981' }]
                  : []),
              ].map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid #F3E8FF',
                }}>
                  <span style={{ fontSize: '0.85rem', color: '#9585B0', fontWeight: '600' }}>{row.label}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: row.color || '#2D1A4A' }}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', marginTop: '6px' }}>
                <span style={{ fontWeight: '800', color: '#2D1A4A' }}>Total</span>
                <strong style={{ fontSize: '1.2rem', color: '#FF6B35' }}>
                  ₹{order.totalPrice?.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          )}

          {accordionCard(
            'Delivery Address',
            '📍',
            'address',
            order.shippingAddress ? (
              <div style={{ lineHeight: 1.8 }}>
                <p style={{ fontWeight: '800', color: '#2D1A4A', margin: '0 0 2px', fontSize: '0.95rem' }}>
                  {order.shippingAddress.name}
                </p>
                <p style={{ color: '#6B4E8A', margin: '0 0 2px', fontSize: '0.85rem', fontWeight: '600' }}>
                  📞 {order.shippingAddress.phone}
                </p>
                <p style={{ color: '#6B4E8A', margin: '0 0 2px', fontSize: '0.85rem', fontWeight: '600' }}>
                  🏠 {order.shippingAddress.address}
                </p>
                <p style={{ color: '#6B4E8A', margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                </p>
              </div>
            ) : (
              <p style={{ color: '#9CA3AF' }}>No address on record</p>
            )
          )}

          {order.isDelivered && !isCancelled && !isReturnRequested && (
            <div style={{
              background: 'white', borderRadius: '20px', padding: '20px 24px',
              border: '1.5px solid #6EE7B7',
              boxShadow: '0 4px 16px rgba(16,185,129,0.10)',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '2rem' }}>🎉</span>
                <div>
                  <strong style={{ fontSize: '1rem', color: '#065F46' }}>Order Delivered!</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#047857' }}>
                    {order.deliveredAt
                      ? new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#6B7280', fontWeight: '600' }}>
                Not happy with your order? You can return the item or request a refund.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowReturnModal(true)}
                  style={{
                    flex: 1, padding: '9px 10px',
                    background: 'white', color: '#f97316',
                    border: '1.5px solid #fed7aa',
                    borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem',
                    fontFamily: 'Nunito, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  🔄 Return Item
                </button>
                <Link
                  href={`/orders/${order.id}/refund`}
                  style={{
                    flex: 1, padding: '9px 10px',
                    background: 'white', color: '#7B2FBE',
                    border: '1.5px solid #EDD9FF',
                    borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem',
                    fontFamily: 'Nunito, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                    textDecoration: 'none', textAlign: 'center',
                  }}
                >
                  💰 Refund
                </Link>
                {(() => {
                  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
                  const daysSince   = Math.floor((new Date() - deliveredAt) / (1000 * 60 * 60 * 24));
                  if (daysSince > 3) return null;
                  return (
                    <Link
                      href={`/orders/${order.id}/exchange`}
                      style={{
                        flex: 1, padding: '9px 10px',
                        background: 'white', color: '#FF6B35',
                        border: '1.5px solid #FFD4B8',
                        borderRadius: '10px', fontWeight: '800', fontSize: '0.82rem',
                        fontFamily: 'Nunito, sans-serif', cursor: 'pointer', transition: 'all 0.2s',
                        textDecoration: 'none', textAlign: 'center',
                      }}
                    >
                      🔄 Exchange
                    </Link>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCancelModal && (
        <CancelOrderModal
          order={order}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => { setShowCancelModal(false); fetchOrder(); }}
        />
      )}
      {showReturnModal && (
        <ReturnModal
          order={order}
          onClose={() => setShowReturnModal(false)}
          onSuccess={() => { setShowReturnModal(false); fetchOrder(); }}
        />
      )}
      {showRefundModal && (
        <RefundModal
          order={order}
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => { setShowRefundModal(false); fetchOrder(); }}
        />
      )}

      <style>{`
        @keyframes liveBlip {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.6; }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: minmax"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════
   ✅ EXCHANGE STATUS BANNER - Customer view
══════════════════════════════════════════ */
function ExchangeStatusBanner({ orderId, exchangeId }) {
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchExchange();
    const interval = setInterval(fetchExchange, 10000);
    return () => clearInterval(interval);
  }, [exchangeId]);

  const fetchExchange = async () => {
    try {
      const res  = await fetch(`/api/exchanges?limit=100`);
      const data = await res.json();
      const found = (data.exchanges || []).find(e => e.id === exchangeId);
      if (found) setExchange(found);
    } catch (err) {
      console.error('Failed to fetch exchange:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !exchange) return null;

  const STATUS_CONFIG = {
    pending:          { label: 'Pending Approval',  color: '#F59E0B', bg: '#FEF3C7', icon: '🟡', desc: 'Waiting for admin approval' },
    approved:         { label: 'Approved',          color: '#3B82F6', bg: '#DBEAFE', icon: '✅', desc: 'Pickup will be arranged soon' },
    picked_up:        { label: 'Picked Up',         color: '#8B5CF6', bg: '#EDE9FE', icon: '📦', desc: 'On the way to our warehouse' },
    received:         { label: 'Received',          color: '#6366F1', bg: '#E0E7FF', icon: '📬', desc: 'Item received, verifying...' },
    verified:         { label: 'Verified',          color: '#10B981', bg: '#D1FAE5', icon: '🔍', desc: 'Quality check passed!' },
    awaiting_payment: { label: 'Awaiting Payment',  color: '#F97316', bg: '#FFEDD5', icon: '💳', desc: 'Complete payment to continue' },
    ready_to_ship:    { label: 'Ready to Ship',     color: '#10B981', bg: '#D1FAE5', icon: '🎁', desc: 'New product being packed' },
    shipped:          { label: 'Shipped',           color: '#06B6D4', bg: '#CFFAFE', icon: '🚚', desc: 'New product on the way!' },
    completed:        { label: 'Exchange Completed', color: '#10B981', bg: '#D1FAE5', icon: '🎉', desc: 'Exchange completed successfully!' },
    rejected:         { label: 'Rejected',          color: '#EF4444', bg: '#FEE2E2', icon: '❌', desc: 'Exchange request rejected' },
  };

  const cfg = STATUS_CONFIG[exchange.status] || STATUS_CONFIG.pending;
  const isCompleted = exchange.status === 'completed';
  const isRejected  = exchange.status === 'rejected';

  return (
    <div style={{
      background: isCompleted
        ? 'linear-gradient(135deg, #ECFDF5, #D1FAE5)'
        : isRejected
          ? 'linear-gradient(135deg, #FEF2F2, #FEE2E2)'
          : 'linear-gradient(135deg, #FFF3E8, #FFE4CC)',
      border: `2px solid ${cfg.color}`,
      borderRadius: '20px',
      padding: '20px 24px',
      marginBottom: '24px',
      fontFamily: 'Nunito, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        marginBottom: '16px', flexWrap: 'wrap',
      }}>
        <div style={{
          width: '50px', height: '50px', borderRadius: '12px',
          background: cfg.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', flexShrink: 0,
        }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            margin: 0, fontSize: '1.1rem', fontWeight: '900',
            color: cfg.color,
          }}>
            🔄 Exchange Request — {cfg.label}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#6B4E8A', fontWeight: '600' }}>
            {cfg.desc}
          </p>
        </div>
        <span style={{
          padding: '6px 14px',
          background: 'white',
          color: cfg.color,
          border: `2px solid ${cfg.color}40`,
          borderRadius: '999px',
          fontSize: '0.78rem', fontWeight: '800',
        }}>
          #{exchange.id?.slice(-8).toUpperCase()}
        </span>
      </div>

      {/* Product Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '14px',
      }}>
        {/* OLD */}
        <div style={{
          padding: '12px',
          background: 'white',
          border: '1.5px solid #FCA5A5',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <span style={{
            display: 'inline-block', fontSize: '0.66rem', fontWeight: '800',
            background: '#EF4444', color: 'white',
            padding: '3px 10px', borderRadius: '999px', marginBottom: '8px',
            textTransform: 'uppercase',
          }}>
            ↩️ Returned
          </span>
          <img
            src={exchange.oldProductImage || 'https://via.placeholder.com/60'}
            alt={exchange.oldProductName}
            style={{
              width: '60px', height: '60px',
              objectFit: 'cover', borderRadius: '8px',
              margin: '0 auto 6px', display: 'block',
            }}
          />
          <p style={{
            margin: '0 0 4px', fontSize: '0.78rem',
            fontWeight: '700', color: '#7F1D1D',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {exchange.oldProductName}
          </p>
          <strong style={{ color: '#DC2626', fontSize: '0.92rem' }}>
            ₹{exchange.oldPrice?.toLocaleString('en-IN')}
          </strong>
        </div>

        <div style={{ fontSize: '2rem', color: cfg.color, fontWeight: '900' }}>→</div>

        {/* NEW */}
        <div style={{
          padding: '12px',
          background: 'white',
          border: '1.5px solid #A7F3D0',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <span style={{
            display: 'inline-block', fontSize: '0.66rem', fontWeight: '800',
            background: '#10B981', color: 'white',
            padding: '3px 10px', borderRadius: '999px', marginBottom: '8px',
            textTransform: 'uppercase',
          }}>
            📦 Replacing
          </span>
          <img
            src={exchange.newProductImage || 'https://via.placeholder.com/60'}
            alt={exchange.newProductName}
            style={{
              width: '60px', height: '60px',
              objectFit: 'cover', borderRadius: '8px',
              margin: '0 auto 6px', display: 'block',
            }}
          />
          <p style={{
            margin: '0 0 4px', fontSize: '0.78rem',
            fontWeight: '700', color: '#065F46',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {exchange.newProductName}
          </p>
          <strong style={{ color: '#10B981', fontSize: '0.92rem' }}>
            ₹{exchange.newPrice?.toLocaleString('en-IN')}
          </strong>
        </div>
      </div>

      {/* Price Difference */}
      {exchange.priceDifference !== 0 && (
        <div style={{
          padding: '10px 14px',
          background: 'white',
          border: `1.5px solid ${exchange.priceDifference > 0 ? '#FDE68A' : '#BFDBFE'}`,
          borderRadius: '10px',
          marginBottom: '12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '8px',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: '800', color: exchange.priceDifference > 0 ? '#92400E' : '#1E40AF' }}>
              💰 Price Difference
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6B7280', fontWeight: '600' }}>
              {exchange.priceDifference > 0
                ? 'You paid extra for this exchange'
                : 'Refunded to your original payment method'}
            </p>
          </div>
          <strong style={{
            fontSize: '1.1rem',
            color: exchange.priceDifference > 0 ? '#F59E0B' : '#3B82F6',
          }}>
            {exchange.priceDifference > 0
              ? `+ ₹${exchange.priceDifference.toLocaleString('en-IN')}`
              : `− ₹${Math.abs(exchange.priceDifference).toLocaleString('en-IN')}`}
          </strong>
        </div>
      )}

      {/* Razorpay refund info */}
      {exchange.razorpayRefundId && (
        <div style={{
          padding: '10px 14px',
          background: '#ECFDF5',
          border: '1.5px solid #A7F3D0',
          borderRadius: '10px',
          marginBottom: '12px',
        }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#065F46', fontWeight: '800' }}>
            ✅ ₹{Math.abs(exchange.priceDifference)} refunded to your Razorpay account
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#047857', fontWeight: '600', fontFamily: 'monospace' }}>
            Ref: {exchange.razorpayRefundId}
          </p>
        </div>
      )}

      {/* Payment link */}
      {exchange.status === 'awaiting_payment' && exchange.paymentLinkUrl && (
        <a
          href={exchange.paymentLinkUrl}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'block',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white',
            borderRadius: '10px',
            textDecoration: 'none',
            textAlign: 'center',
            fontWeight: '800',
            fontSize: '0.92rem',
            marginBottom: '12px',
          }}
        >
          💳 Pay ₹{exchange.priceDifference} Now to Continue →
        </a>
      )}

      {/* Tracking */}
      {(exchange.pickupTracking || exchange.shipmentTracking) && (
        <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
          {exchange.pickupTracking && (
            <div style={{
              padding: '10px 14px', background: 'white',
              border: '1px solid #DDD6FE', borderRadius: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '8px',
            }}>
              <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#6D28D9' }}>
                📦 Pickup Tracking:
              </span>
              <code style={{ fontSize: '0.82rem', color: '#5B21B6', fontWeight: '800', fontFamily: 'monospace' }}>
                {exchange.pickupTracking}
              </code>
            </div>
          )}
          {exchange.shipmentTracking && (
            <div style={{
              padding: '10px 14px', background: 'white',
              border: '1px solid #A5F3FC', borderRadius: '10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '8px',
            }}>
              <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#0E7490' }}>
                🚚 New Product Tracking:
              </span>
              <code style={{ fontSize: '0.82rem', color: '#155E75', fontWeight: '800', fontFamily: 'monospace' }}>
                {exchange.shipmentTracking}
              </code>
            </div>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {isRejected && exchange.rejectionReason && (
        <div style={{
          padding: '12px 14px',
          background: '#FEE2E2',
          border: '1.5px solid #FCA5A5',
          borderRadius: '10px',
          marginBottom: '12px',
        }}>
          <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: '800', color: '#991B1B' }}>
            ❌ Reason: {exchange.rejectionReason}
          </p>
        </div>
      )}

      {/* Completed celebration */}
      {isCompleted && (
        <div style={{
          padding: '14px',
          background: 'white',
          border: '2px solid #10B981',
          borderRadius: '10px',
          textAlign: 'center',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>🎉</div>
          <p style={{ margin: 0, fontSize: '1rem', color: '#065F46', fontWeight: '900' }}>
            Exchange Completed Successfully!
          </p>
          {exchange.completedAt && (
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#047857', fontWeight: '700' }}>
              Completed on {new Date(exchange.completedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {/* View full exchange link */}
      <Link href="/orders/exchanges" style={{
        display: 'block',
        padding: '10px',
        background: 'white',
        color: cfg.color,
        border: `1.5px solid ${cfg.color}40`,
        borderRadius: '10px',
        textDecoration: 'none',
        textAlign: 'center',
        fontWeight: '800',
        fontSize: '0.86rem',
      }}>
        👁️ View Full Exchange Details →
      </Link>
    </div>
  );
}

function ModalWrapper({ children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Nunito, sans-serif',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        border: '1px solid #F3E8FF',
      }}>
        {children}
      </div>
    </div>
  );
}

function CloseBtn({ onClose, color = '#6B7280' }) {
  return (
    <button
      onClick={onClose}
      style={{
        background: 'white', border: '1.5px solid #E5E7EB',
        width: '34px', height: '34px', borderRadius: '50%',
        cursor: 'pointer', color, fontSize: '1rem', fontWeight: '700',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      ✕
    </button>
  );
}

function ReturnModal({ order, onClose, onSuccess }) {
  const [returnReason, setReturnReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const RETURN_REASONS = [
    { label: 'Size issue — too big / too small', emoji: '📏' },
    { label: 'Color mismatch — different from photo', emoji: '🎨' },
    { label: 'Wrong product received', emoji: '📦' },
    { label: 'Product damaged / defective', emoji: '💔' },
    { label: 'Poor quality / not as described', emoji: '⭐' },
    { label: 'Missing parts / accessories', emoji: '🔧' },
    // { label: 'Changed my mind', emoji: '💭' },
    { label: 'Other', emoji: '✏️' },
  ];

  const isValid = returnReason && (returnReason !== 'Other' || customReason.trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: returnReason === 'Other' ? customReason : returnReason,
          refundMethod: 'bank',
          bankDetails: {
            accountHolderName: 'Pending',
            accountNumber: '0000000000',
            ifscCode: 'PENDING0000',
            bankName: 'To be provided',
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('✅ Return request submitted!');
      setTimeout(() => toast('📞 Our team will contact you within 24–48 hours.', { icon: '📦' }), 600);
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{
        padding: '20px 24px 18px',
        borderBottom: '1px solid #FEE8D5',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
        borderRadius: '20px 20px 0 0',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#EA580C' }}>
            🔄 Return Item
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.80rem', color: '#9A3412', fontWeight: '600' }}>
            Order #{order.id?.slice(-10).toUpperCase()}
          </p>
        </div>
        <CloseBtn onClose={onClose} color="#EA580C" />
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{
          padding: '12px 14px', background: '#FFF7ED',
          border: '1px solid #FED7AA', borderRadius: '12px', marginBottom: '18px',
        }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#9A3412', fontWeight: '600', lineHeight: 1.6 }}>
            📋 <strong>Return Policy:</strong> Items must be unused and in original packaging.
            Pickup will be arranged within 2–3 business days. Refund processed after quality check.
          </p>
        </div>

        <p style={{ fontSize: '0.88rem', fontWeight: '700', color: '#2D1A4A', margin: '0 0 12px' }}>
          Why are you returning? <span style={{ color: '#EF4444' }}>*</span>
        </p>

        <div style={{ display: 'grid', gap: '7px', marginBottom: '16px' }}>
          {RETURN_REASONS.map(({ label, emoji }) => {
            const selected = returnReason === label;
            return (
              <label
                key={label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px',
                  background: selected ? '#FFF7ED' : 'white',
                  border: `1.5px solid ${selected ? '#F97316' : '#E5E7EB'}`,
                  borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <input
                  type="radio" name="returnReason" value={label}
                  checked={selected} onChange={e => setReturnReason(e.target.value)}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  border: `2px solid ${selected ? '#F97316' : '#D1D5DB'}`,
                  background: selected ? '#F97316' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}>
                  {selected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }} />}
                </div>
                <span style={{ fontSize: '0.9rem' }}>{emoji}</span>
                <span style={{
                  fontSize: '0.86rem',
                  fontWeight: selected ? '700' : '600',
                  color: selected ? '#EA580C' : '#374151',
                }}>
                  {label}
                </span>
              </label>
            );
          })}
        </div>

        {returnReason === 'Other' && (
          <textarea
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            placeholder="Describe your issue in detail..."
            rows={3}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid #E5E7EB', borderRadius: '10px',
              fontFamily: 'Nunito, sans-serif', fontSize: '0.86rem',
              resize: 'vertical', outline: 'none', marginBottom: '16px',
              boxSizing: 'border-box', color: '#1F2937',
            }}
          />
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', background: 'white',
              border: '1.5px solid #E5E7EB', borderRadius: '10px',
              fontWeight: '700', color: '#6B7280',
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            style={{
              flex: 2, padding: '12px',
              background: isValid && !submitting
                ? 'linear-gradient(135deg, #F97316, #EA580C)'
                : '#F3F4F6',
              color: isValid && !submitting ? 'white' : '#9CA3AF',
              border: 'none', borderRadius: '10px',
              fontWeight: '800', fontSize: '0.95rem',
              fontFamily: 'Nunito, sans-serif',
              cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: isValid ? '0 4px 14px rgba(249,115,22,0.25)' : 'none',
            }}
          >
            {submitting ? '⏳ Submitting...' : '🔄 Submit Return Request'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function RefundModal({ order, onClose, onSuccess }) {
  const [refundMethod, setRefundMethod] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const isValid = refundMethod === 'upi'
    ? upiId.trim().length > 3
    : refundMethod === 'bank'
      ? bankDetails.accountHolderName.trim() &&
        bankDetails.accountNumber.trim() &&
        bankDetails.ifscCode.trim()
      : false;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Refund requested by customer',
          refundMethod,
          ...(refundMethod === 'upi' ? { upiId } : { bankDetails }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('✅ Refund request submitted!');
      setTimeout(() => toast('💰 Refund will be processed within 5–7 business days.', { icon: '🏦' }), 600);
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 13px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '0.88rem',
    fontFamily: 'Nunito, sans-serif',
    outline: 'none',
    color: '#1F2937',
    background: 'white',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{
        padding: '20px 24px 18px',
        borderBottom: '1px solid #EDE9FE',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
        borderRadius: '20px 20px 0 0',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#7B2FBE' }}>
            💰 Refund Request
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.80rem', color: '#6D28D9', fontWeight: '600' }}>
            Order #{order.id?.slice(-10).toUpperCase()}
          </p>
        </div>
        <CloseBtn onClose={onClose} color="#7B2FBE" />
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{
          padding: '14px 16px', background: '#F0FDF4',
          border: '1px solid #BBF7D0', borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Refund Amount
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '1.5rem', fontWeight: '900', color: '#10B981' }}>
              ₹{order.totalPrice?.toLocaleString('en-IN')}
            </p>
          </div>
          <span style={{ fontSize: '2rem' }}>💰</span>
        </div>

        <p style={{ fontSize: '0.88rem', fontWeight: '700', color: '#2D1A4A', margin: '0 0 12px' }}>
          Choose refund method <span style={{ color: '#EF4444' }}>*</span>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div
            onClick={() => setRefundMethod('upi')}
            style={{
              padding: '16px', textAlign: 'center',
              background: refundMethod === 'upi' ? '#F0FDF4' : 'white',
              border: `2px solid ${refundMethod === 'upi' ? '#10B981' : '#E5E7EB'}`,
              borderRadius: '14px', cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📱</div>
            <p style={{
              margin: '0 0 6px', fontSize: '0.90rem', fontWeight: '800',
              color: refundMethod === 'upi' ? '#059669' : '#374151',
            }}>
              UPI ID
            </p>
            <span style={{
              display: 'inline-block', fontSize: '0.64rem', fontWeight: '800',
              background: '#D1FAE5', color: '#065F46',
              padding: '2px 8px', borderRadius: '999px', border: '1px solid #A7F3D0',
            }}>
              ⚡ Faster Refund
            </span>
            {refundMethod === 'upi' && (
              <div style={{
                position: 'absolute', top: '8px', right: '8px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#10B981', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.70rem', fontWeight: '900',
              }}>
                ✓
              </div>
            )}
          </div>

          <div
            onClick={() => setRefundMethod('bank')}
            style={{
              padding: '16px', textAlign: 'center',
              background: refundMethod === 'bank' ? '#EFF6FF' : 'white',
              border: `2px solid ${refundMethod === 'bank' ? '#3B82F6' : '#E5E7EB'}`,
              borderRadius: '14px', cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🏦</div>
            <p style={{
              margin: '0 0 6px', fontSize: '0.90rem', fontWeight: '800',
              color: refundMethod === 'bank' ? '#1D4ED8' : '#374151',
            }}>
              Bank Account
            </p>
            <span style={{ fontSize: '0.64rem', fontWeight: '700', color: '#6B7280' }}>
              5–7 business days
            </span>
            {refundMethod === 'bank' && (
              <div style={{
                position: 'absolute', top: '8px', right: '8px',
                width: '20px', height: '20px', borderRadius: '50%',
                background: '#3B82F6', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.70rem', fontWeight: '900',
              }}>
                ✓
              </div>
            )}
          </div>
        </div>

        {refundMethod === 'upi' && (
          <div style={{
            padding: '16px', background: '#F8FAFC',
            border: '1.5px solid #E2E8F0', borderRadius: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                fontSize: '0.72rem', fontWeight: '800',
                background: '#D1FAE5', color: '#065F46',
                padding: '3px 10px', borderRadius: '999px',
                border: '1px solid #A7F3D0',
              }}>
                ⚡ Faster Refund Recommended
              </span>
            </div>
            <label style={labelStyle}>
              UPI ID <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              style={inputStyle}
            />
          </div>
        )}

        {refundMethod === 'bank' && (
          <div style={{
            padding: '16px', background: '#F8FAFC',
            border: '1.5px solid #E2E8F0', borderRadius: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={labelStyle}>
                  Account Holder Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={e => setBankDetails(p => ({ ...p, accountHolderName: e.target.value }))}
                  placeholder="As per bank records"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Account Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={e => setBankDetails(p => ({
                    ...p, accountNumber: e.target.value.replace(/\D/g, ''),
                  }))}
                  placeholder="Enter your account number"
                  maxLength={18}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>
                    IFSC Code <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={e => setBankDetails(p => ({
                      ...p, ifscCode: e.target.value.toUpperCase(),
                    }))}
                    placeholder="SBIN0001234"
                    maxLength={11}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Bank Name</label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={e => setBankDetails(p => ({ ...p, bankName: e.target.value }))}
                    placeholder="e.g. SBI, HDFC"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', background: 'white',
              border: '1.5px solid #E5E7EB', borderRadius: '10px',
              fontWeight: '700', color: '#6B7280',
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            style={{
              flex: 2, padding: '12px',
              background: isValid && !submitting
                ? 'linear-gradient(135deg, #7B2FBE, #9333EA)'
                : '#F3F4F6',
              color: isValid && !submitting ? 'white' : '#9CA3AF',
              border: 'none', borderRadius: '10px',
              fontWeight: '800', fontSize: '0.95rem',
              fontFamily: 'Nunito, sans-serif',
              cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: isValid ? '0 4px 14px rgba(123,47,190,0.25)' : 'none',
            }}
          >
            {submitting ? '⏳ Submitting...' : '💰 Submit Refund Request'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

function CancelOrderModal({ order, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const needsBankDetails = order.paymentMethod === 'COD' && order.isDelivered;

  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: '',
  });

  const CANCEL_REASONS = [
    'Changed my mind',
    'Found a better price elsewhere',
    'Ordered by mistake',
    'Delivery taking too long',
    'Wrong product selected',
    'Quality issue',
    'No longer need it',
    'Other',
  ];

  const getRefundMessage = () => {
    if (order.paymentMethod === 'COD' && !order.isDelivered)
      return { type: 'info', icon: 'ℹ️', title: 'No refund needed', message: "You haven't paid yet (Cash on Delivery)." };
    if (order.paymentMethod === 'Razorpay' && order.isPaid)
      return { type: 'success', icon: '💰', title: 'Auto-refund will be initiated', message: `₹${order.totalPrice?.toLocaleString('en-IN')} will be refunded within 5–7 business days.` };
    if (order.paymentMethod === 'COD' && order.isDelivered)
      return { type: 'warning', icon: '🏦', title: 'Bank details required', message: `₹${order.totalPrice?.toLocaleString('en-IN')} will be transferred after we receive returned items.` };
    return null;
  };

  const refundMsg = getRefundMessage();

  const handleSubmit = async () => {
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason.trim()) { toast.error('Please select or enter a reason'); return; }
    if (needsBankDetails) {
      if (!bankDetails.accountHolderName.trim()) { toast.error('Please enter account holder name'); return; }
      if (!bankDetails.accountNumber.trim() || bankDetails.accountNumber.length < 9) { toast.error('Please enter a valid account number'); return; }
      if (!bankDetails.ifscCode.trim() || bankDetails.ifscCode.length !== 11) { toast.error('Please enter a valid IFSC code'); return; }
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: finalReason,
          bankDetails: needsBankDetails ? bankDetails : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order');
      toast.success('✅ Order cancelled successfully!', { duration: 4000 });
      if (data.refundType === 'razorpay') {
        setTimeout(() => toast.success('💰 Refund initiated!', { duration: 5000 }), 500);
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '2px solid #FEF2F2',
        background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
        borderRadius: '20px 20px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#DC2626' }}>
            ❌ Cancel Order
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#7F1D1D', fontWeight: '600' }}>
            #{order.id?.slice(-12).toUpperCase()}
          </p>
        </div>
        <CloseBtn onClose={onClose} color="#DC2626" />
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{
          padding: '12px 14px', background: '#F9FAFB', borderRadius: '12px',
          marginBottom: '16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {order.orderItems?.[0]?.image && (
              <img
                src={order.orderItems[0].image} alt=""
                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
              />
            )}
            <div>
              <p style={{ fontSize: '0.84rem', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                {order.orderItems?.length} item{order.orderItems?.length > 1 ? 's' : ''}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#6B7280', margin: 0, fontWeight: '600' }}>
                {order.paymentMethod} · {order.isPaid ? 'Paid' : 'Not paid'}
              </p>
            </div>
          </div>
          <strong style={{ color: '#FF6B35', fontSize: '1rem' }}>
            ₹{order.totalPrice?.toLocaleString('en-IN')}
          </strong>
        </div>

        {refundMsg && (
          <div style={{
            padding: '14px 16px',
            background: refundMsg.type === 'success' ? '#F0FDF4' : refundMsg.type === 'warning' ? '#FFFBEB' : '#EFF6FF',
            border: `1.5px solid ${refundMsg.type === 'success' ? '#BBF7D0' : refundMsg.type === 'warning' ? '#FDE68A' : '#BFDBFE'}`,
            borderRadius: '12px', marginBottom: '16px',
          }}>
            <p style={{
              margin: 0, fontSize: '0.86rem', fontWeight: '800',
              color: refundMsg.type === 'success' ? '#166534' : refundMsg.type === 'warning' ? '#92400E' : '#1E40AF',
            }}>
              {refundMsg.icon} {refundMsg.title}
            </p>
            <p style={{
              margin: '4px 0 0', fontSize: '0.80rem', fontWeight: '600', lineHeight: 1.5,
              color: refundMsg.type === 'success' ? '#047857' : refundMsg.type === 'warning' ? '#A16207' : '#1E40AF',
            }}>
              {refundMsg.message}
            </p>
          </div>
        )}

        <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#1F2937', marginBottom: '8px' }}>
          Why are you cancelling? <span style={{ color: '#EF4444' }}>*</span>
        </label>

        <div style={{ display: 'grid', gap: '6px', marginBottom: '12px' }}>
          {CANCEL_REASONS.map(r => (
            <label key={r} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 12px',
              background: reason === r ? '#FEF2F2' : 'white',
              border: `1.5px solid ${reason === r ? '#FCA5A5' : '#E5E7EB'}`,
              borderRadius: '10px', cursor: 'pointer',
              fontSize: '0.86rem', fontWeight: '600', color: '#1F2937', transition: 'all 0.15s',
            }}>
              <input
                type="radio" name="cancelReason" value={r}
                checked={reason === r} onChange={e => setReason(e.target.value)}
                style={{ accentColor: '#EF4444' }}
              />
              {r}
            </label>
          ))}
        </div>

        {reason === 'Other' && (
          <textarea
            value={customReason} onChange={e => setCustomReason(e.target.value)}
            placeholder="Please tell us your reason..."
            rows={2}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid #E5E7EB', borderRadius: '10px',
              fontFamily: 'Nunito, sans-serif', fontSize: '0.86rem',
              resize: 'vertical', outline: 'none', marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />
        )}

        {needsBankDetails && (
          <div style={{
            padding: '14px', background: '#FFFBEB',
            border: '1.5px solid #FDE68A', borderRadius: '12px', marginBottom: '16px',
          }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#92400E', margin: '0 0 10px' }}>
              🏦 Bank Details for Refund
            </h4>
            {[
              { key: 'accountHolderName', label: 'Account Holder Name *', placeholder: 'As per bank records' },
              { key: 'accountNumber', label: 'Account Number *', placeholder: '12-digit account number' },
              { key: 'ifscCode', label: 'IFSC Code *', placeholder: 'e.g., SBIN0001234', max: 11 },
              { key: 'bankName', label: 'Bank Name (optional)', placeholder: 'e.g., State Bank of India' },
              { key: 'upiId', label: 'UPI ID (optional)', placeholder: 'e.g., yourname@upi' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#78350F', marginBottom: '3px' }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  value={bankDetails[field.key]}
                  maxLength={field.max}
                  onChange={e => setBankDetails(p => ({
                    ...p,
                    [field.key]: field.key === 'ifscCode' ? e.target.value.toUpperCase() : e.target.value,
                  }))}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '8px 10px',
                    border: '1.5px solid #FDE68A', borderRadius: '8px',
                    fontSize: '0.84rem', fontFamily: 'inherit',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '12px', background: 'white',
              border: '1.5px solid #D1D5DB', borderRadius: '10px',
              fontWeight: '700', color: '#6B7280',
              cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
            }}
          >
            Keep Order
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1.5, padding: '12px',
              background: loading ? '#FCA5A5' : 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontWeight: '800', cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'Nunito, sans-serif',
              boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
            }}
          >
            {loading ? '⏳ Cancelling...' : '❌ Confirm Cancel'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}