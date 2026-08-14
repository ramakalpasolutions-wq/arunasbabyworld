'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending: {
    label: 'Under Review',
    color: '#F59E0B',
    bg:    '#FEF3C7',
    border:'#FDE68A',
    icon:  '🟡',
    desc:  'Waiting for admin approval',
  },
  processing: {
    label: 'Processing',
    color: '#3B82F6',
    bg:    '#DBEAFE',
    border:'#BFDBFE',
    icon:  '⚙️',
    desc:  'Refund being processed',
  },
  completed: {
    label: 'Completed',
    color: '#10B981',
    bg:    '#D1FAE5',
    border:'#A7F3D0',
    icon:  '✅',
    desc:  'Refund successfully sent',
  },
  failed: {
    label: 'Failed',
    color: '#EF4444',
    bg:    '#FEE2E2',
    border:'#FCA5A5',
    icon:  '❌',
    desc:  'Refund failed — contact support',
  },
  not_required: {
    label: 'Not Required',
    color: '#6B7280',
    bg:    '#F3F4F6',
    border:'#E5E7EB',
    icon:  'ℹ️',
    desc:  'No refund needed',
  },
};

export default function RefundsHistoryClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchRefunds(); }, []);

  const fetchRefunds = async () => {
    try {
      const res  = await fetch('/api/orders?limit=100');
      const data = await res.json();

      // Filter only orders with refund/return activity
      const withRefunds = (data.orders || []).filter(o =>
        o.returnRequest || o.refundStatus || o.isCancelled
      );

      setOrders(withRefunds);
    } catch (err) {
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    const status = getRefundStatus(order);
    return status === filter;
  });

  function getRefundStatus(order) {
    if (order.refundStatus === 'completed') return 'completed';
    if (order.refundStatus === 'processing') return 'processing';
    if (order.refundStatus === 'pending') return 'pending';
    if (order.refundStatus === 'failed') return 'failed';
    if (order.refundStatus === 'not_required') return 'not_required';
    if (order.returnRequest) return 'pending';
    return 'pending';
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '70vh', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '4px solid #F3E8FF', borderTop: '4px solid #7B2FBE',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#9585B0', fontFamily: 'Nunito, sans-serif', fontWeight: '600' }}>
          Loading your refunds...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Status counts ── */
  const counts = {
    all:        orders.length,
    pending:    orders.filter(o => getRefundStatus(o) === 'pending').length,
    processing: orders.filter(o => getRefundStatus(o) === 'processing').length,
    completed:  orders.filter(o => getRefundStatus(o) === 'completed').length,
    failed:     orders.filter(o => getRefundStatus(o) === 'failed').length,
  };

  return (
    <div style={{
      maxWidth: '1100px', margin: '0 auto',
      padding: 'clamp(24px,4vw,40px) 20px',
      fontFamily: 'Nunito, sans-serif',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap',
        gap: '16px', marginBottom: '28px',
      }}>
        <div>
          <Link href="/profile?tab=orders" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#7B2FBE', textDecoration: 'none', fontWeight: '700',
            fontSize: '0.86rem', marginBottom: '12px',
          }}>
            ← Back to Orders
          </Link>
          <h1 style={{
            fontSize: 'clamp(1.6rem,2.8vw,2.2rem)',
            fontWeight: '800', color: '#2D1A4A', margin: '0 0 6px',
          }}>
            💰 My Refunds
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontWeight: '600', fontSize: '0.92rem' }}>
            Track all your refund requests in one place
          </p>
        </div>

        <Link href="/products" style={{
          padding: '12px 22px',
          background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
          color: 'white', borderRadius: '12px',
          textDecoration: 'none', fontWeight: '800', fontSize: '0.9rem',
          boxShadow: '0 6px 18px rgba(255,107,53,0.22)',
        }}>
          🛍️ Continue Shopping
        </Link>
      </div>

      {/* ── Filter chips ── */}
      <div style={{
        display: 'flex', gap: '10px', marginBottom: '24px',
        flexWrap: 'wrap', overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {[
          { key: 'all',        label: 'All',        emoji: '📋' },
          { key: 'pending',    label: 'Pending',    emoji: '🟡' },
          { key: 'processing', label: 'Processing', emoji: '⚙️' },
          { key: 'completed',  label: 'Completed',  emoji: '✅' },
          { key: 'failed',     label: 'Failed',     emoji: '❌' },
        ].map(chip => {
          const active = filter === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px',
                background: active ? 'linear-gradient(135deg,#FF6B35,#7B2FBE)' : 'white',
                color: active ? 'white' : '#6B4E8A',
                border: `1.5px solid ${active ? 'transparent' : '#EDD9FF'}`,
                borderRadius: '999px',
                fontWeight: '800', fontSize: '0.82rem',
                cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 6px 16px rgba(123,47,190,0.22)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
              <span style={{
                background: active ? 'rgba(255,255,255,0.25)' : '#F3E8FF',
                color: active ? 'white' : '#7B2FBE',
                padding: '2px 8px', borderRadius: '999px',
                fontSize: '0.72rem', fontWeight: '800',
              }}>
                {counts[chip.key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Empty state ── */}
      {filteredOrders.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', borderRadius: '24px',
          border: '1.5px dashed #EDD9FF',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>💰</div>
          <h3 style={{ color: '#2D1A4A', fontSize: '1.3rem', margin: '0 0 8px' }}>
            {filter === 'all' ? 'No Refunds Yet' : `No ${filter} refunds`}
          </h3>
          <p style={{ color: '#9585B0', margin: '0 0 24px', fontWeight: '600' }}>
            {filter === 'all'
              ? "You haven't requested any refunds yet."
              : 'Try a different filter to see your refunds.'}
          </p>
          <Link href="/profile?tab=orders" style={{
            display: 'inline-block', padding: '12px 28px',
            background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
            color: 'white', borderRadius: '12px', textDecoration: 'none',
            fontWeight: '800', fontSize: '0.9rem',
          }}>
            📦 View My Orders
          </Link>
        </div>
      )}

      {/* ── Refund cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.map(order => (
          <RefundCard key={order.id} order={order} status={getRefundStatus(order)} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   REFUND CARD
   ============================================================ */
function RefundCard({ order, status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const refundAmount = order.refundAmount || order.totalPrice;
  const isUPI  = order.returnRequest?.refundMethod === 'upi';
  const isAuto = order.paymentMethod === 'Razorpay' && order.isPaid;

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      border: `1.5px solid ${cfg.border}`,
      boxShadow: '0 4px 20px rgba(123,47,190,0.06)',
      overflow: 'hidden',
    }}>
      {/* Top strip */}
      <div style={{
        background: cfg.bg,
        padding: '10px 18px',
        borderBottom: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>{cfg.icon}</span>
          <strong style={{ fontSize: '0.86rem', color: cfg.color, fontWeight: '800' }}>
            {cfg.label}
          </strong>
        </div>
        <span style={{ fontSize: '0.78rem', color: cfg.color, fontWeight: '700' }}>
          {cfg.desc}
        </span>
      </div>

      {/* Main content */}
      <div style={{ padding: '18px 20px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: '14px',
          flexWrap: 'wrap', marginBottom: '14px',
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{
              fontSize: '0.74rem', color: '#9585B0',
              margin: '0 0 4px', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Order ID
            </p>
            <p style={{
              fontSize: '0.95rem', color: '#2D1A4A',
              margin: 0, fontWeight: '800', fontFamily: 'monospace',
            }}>
              #{order.id?.slice(-12).toUpperCase()}
            </p>
            <p style={{
              fontSize: '0.78rem', color: '#9585B0',
              margin: '6px 0 0', fontWeight: '600',
            }}>
              Ordered: {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontSize: '0.74rem', color: '#9585B0',
              margin: '0 0 4px', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              Refund Amount
            </p>
            <p style={{
              fontSize: '1.4rem', color: '#10B981',
              margin: 0, fontWeight: '900', lineHeight: 1,
            }}>
              ₹{refundAmount?.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Items preview */}
        {order.orderItems?.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', background: '#FAFAFA',
            borderRadius: '12px', marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {order.orderItems.slice(0, 3).map((item, i) => (
                <img
                  key={i}
                  src={item.image || 'https://via.placeholder.com/40'}
                  alt=""
                  style={{
                    width: '40px', height: '40px',
                    objectFit: 'cover', borderRadius: '8px',
                    border: '2px solid white',
                    marginLeft: i > 0 ? '-12px' : 0,
                    zIndex: 3 - i,
                  }}
                />
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.82rem', color: '#2D1A4A',
                margin: 0, fontWeight: '700',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {order.orderItems[0]?.name}
                {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} more`}
              </p>
              <p style={{ fontSize: '0.74rem', color: '#9585B0', margin: '2px 0 0', fontWeight: '600' }}>
                {order.orderItems.length} item(s)
              </p>
            </div>
          </div>
        )}

        {/* Refund method info */}
        {order.returnRequest && (
          <div style={{
            padding: '10px 14px',
            background: isUPI ? '#F0FDF4' : '#EFF6FF',
            border: `1px solid ${isUPI ? '#BBF7D0' : '#BFDBFE'}`,
            borderRadius: '10px',
            marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '10px',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '1.1rem' }}>{isUPI ? '📱' : '🏦'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.76rem', color: isUPI ? '#065F46' : '#1E40AF',
                margin: 0, fontWeight: '800',
              }}>
                {isUPI ? 'UPI Refund' : 'Bank Transfer Refund'}
              </p>
              <p style={{
                fontSize: '0.78rem', color: isUPI ? '#047857' : '#1E40AF',
                margin: '2px 0 0', fontWeight: '600',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {isUPI
                  ? order.returnRequest.upiId
                  : `A/C ${order.returnRequest.accountNumberMasked || '****'} · ${order.returnRequest.ifscCode}`
                }
              </p>
            </div>
          </div>
        )}

        {/* Auto-refund badge */}
        {isAuto && status !== 'failed' && (
          <div style={{
            padding: '8px 12px',
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span>⚡</span>
            <span style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: '700' }}>
              Instant Razorpay auto-refund — {status === 'completed' ? 'Completed' : '2–3 hours'}
            </span>
          </div>
        )}

        {/* Reason */}
        {order.returnRequest?.reason && (
          <p style={{
            fontSize: '0.82rem', color: '#6B4E8A',
            margin: '0 0 14px', fontWeight: '600',
          }}>
            <strong style={{ color: '#7B2FBE' }}>Reason:</strong> {order.returnRequest.reason}
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href={`/orders/${order.id}`} style={{
            flex: 1,
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #7B2FBE, #9333EA)',
            color: 'white',
            borderRadius: '10px',
            fontSize: '0.84rem',
            fontWeight: '800',
            textAlign: 'center',
            textDecoration: 'none',
            minWidth: '140px',
          }}>
            👁️ View Order
          </Link>

          {status === 'failed' && (
            <a href="mailto:care@Arunas Baby World.in" style={{
              padding: '10px 16px',
              background: 'white',
              color: '#EF4444',
              border: '1.5px solid #FCA5A5',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: '800',
              textAlign: 'center',
              textDecoration: 'none',
              minWidth: '140px',
            }}>
              📧 Contact Support
            </a>
          )}
        </div>
      </div>
    </div>
  );
}