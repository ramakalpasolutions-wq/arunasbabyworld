'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:           { label: 'Pending Approval',  color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A', icon: '🟡', desc: 'Waiting for admin approval' },
  approved:          { label: 'Approved',          color: '#3B82F6', bg: '#DBEAFE', border: '#BFDBFE', icon: '✅', desc: 'Pickup will be arranged' },
  picked_up:         { label: 'Picked Up',         color: '#8B5CF6', bg: '#EDE9FE', border: '#DDD6FE', icon: '📦', desc: 'On the way to our warehouse' },
  received:          { label: 'Received',          color: '#6366F1', bg: '#E0E7FF', border: '#C7D2FE', icon: '📬', desc: 'Item received, verifying...' },
  verified:          { label: 'Verified',          color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0', icon: '🔍', desc: 'Quality check passed' },
  awaiting_payment:  { label: 'Awaiting Payment',  color: '#F97316', bg: '#FFEDD5', border: '#FED7AA', icon: '💳', desc: 'Pay price difference to continue' },
  ready_to_ship:     { label: 'Ready to Ship',     color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0', icon: '🎁', desc: 'New product being packed' },
  shipped:           { label: 'Shipped',           color: '#06B6D4', bg: '#CFFAFE', border: '#A5F3FC', icon: '🚚', desc: 'New product on the way' },
  delivered:         { label: 'Delivered',         color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0', icon: '🎉', desc: 'Exchange completed!' },
  completed:         { label: 'Completed',         color: '#10B981', bg: '#D1FAE5', border: '#A7F3D0', icon: '✨', desc: 'Exchange completed successfully' },
  rejected:          { label: 'Rejected',          color: '#EF4444', bg: '#FEE2E2', border: '#FCA5A5', icon: '❌', desc: 'Exchange request rejected' },
};

const TIMELINE_STEPS = [
  { key: 'pending',       label: 'Requested',       icon: '📝' },
  { key: 'approved',      label: 'Approved',        icon: '✅' },
  { key: 'picked_up',     label: 'Picked Up',       icon: '📦' },
  { key: 'received',      label: 'Received',        icon: '📬' },
  { key: 'verified',      label: 'Verified',        icon: '🔍' },
  { key: 'shipped',       label: 'New Shipped',     icon: '🚚' },
  { key: 'completed',     label: 'Completed',       icon: '🎉' },
];

export default function ExchangesHistoryClient() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');

  useEffect(() => { fetchExchanges(); }, [filter]);

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (filter !== 'all') params.append('status', filter);

      const res  = await fetch(`/api/exchanges?${params}`);
      const data = await res.json();
      setExchanges(data.exchanges || []);
    } catch (err) {
      toast.error('Failed to load exchanges');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (exchangeId) => {
    if (!confirm('Are you sure you want to cancel this exchange?')) return;
    try {
      const res = await fetch(`/api/exchanges/${exchangeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Exchange cancelled');
      fetchExchanges();
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '70vh', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '4px solid #FFF3E8', borderTop: '4px solid #FF6B35',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#9585B0', fontFamily: 'Nunito, sans-serif', fontWeight: '600' }}>
          Loading your exchanges...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
            color: '#FF6B35', textDecoration: 'none', fontWeight: '700',
            fontSize: '0.86rem', marginBottom: '12px',
          }}>
            ← Back to Orders
          </Link>
          <h1 style={{
            fontSize: 'clamp(1.6rem,2.8vw,2.2rem)',
            fontWeight: '800', color: '#2D1A4A', margin: '0 0 6px',
          }}>
            🔄 My Exchanges
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontWeight: '600', fontSize: '0.92rem' }}>
            Track all your exchange requests
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
          { key: 'all',       label: 'All',         emoji: '📋' },
          { key: 'pending',   label: 'Pending',     emoji: '🟡' },
          { key: 'approved',  label: 'Approved',    emoji: '✅' },
          { key: 'picked_up', label: 'Picked Up',   emoji: '📦' },
          { key: 'shipped',   label: 'Shipped',     emoji: '🚚' },
          { key: 'completed', label: 'Completed',   emoji: '🎉' },
          { key: 'rejected',  label: 'Rejected',    emoji: '❌' },
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
            </button>
          );
        })}
      </div>

      {/* ── Empty state ── */}
      {exchanges.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', borderRadius: '24px',
          border: '1.5px dashed #EDD9FF',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔄</div>
          <h3 style={{ color: '#2D1A4A', fontSize: '1.3rem', margin: '0 0 8px' }}>
            {filter === 'all' ? 'No Exchanges Yet' : `No ${filter} exchanges`}
          </h3>
          <p style={{ color: '#9585B0', margin: '0 0 24px', fontWeight: '600' }}>
            {filter === 'all'
              ? "You haven't requested any exchanges yet."
              : 'Try a different filter.'}
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

      {/* ── Exchange cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {exchanges.map(ex => (
          <ExchangeCard key={ex.id} exchange={ex} onCancel={handleCancel} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   EXCHANGE CARD (with timeline + product comparison)
   ============================================================ */
function ExchangeCard({ exchange, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[exchange.status] || STATUS_CONFIG.pending;
  const isRejected  = exchange.status === 'rejected';
  const isCompleted = exchange.status === 'completed';
  const canCancel   = ['pending', 'approved'].includes(exchange.status);

  // Calculate current step index in timeline
  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.key === exchange.status);

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      border: `2px solid ${cfg.border}`,
      boxShadow: '0 4px 20px rgba(123,47,190,0.06)',
      overflow: 'hidden',
    }}>
      {/* Status strip */}
      <div style={{
        background: cfg.bg,
        padding: '12px 20px',
        borderBottom: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>{cfg.icon}</span>
          <div>
            <strong style={{ fontSize: '0.92rem', color: cfg.color, fontWeight: '800', display: 'block' }}>
              {cfg.label}
            </strong>
            <span style={{ fontSize: '0.76rem', color: cfg.color, fontWeight: '600' }}>
              {cfg.desc}
            </span>
          </div>
        </div>
        <p style={{
          margin: 0, fontSize: '0.74rem', color: cfg.color,
          fontWeight: '700',
        }}>
          {new Date(exchange.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>

      {/* Product comparison */}
      <div style={{ padding: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '14px',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          {/* OLD product */}
          <div style={{
            padding: '14px',
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: '14px',
            textAlign: 'center',
          }}>
            <span style={{
              display: 'inline-block', fontSize: '0.66rem', fontWeight: '800',
              background: '#EF4444', color: 'white',
              padding: '3px 10px', borderRadius: '999px', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.6px',
            }}>
              ↩️ Returning
            </span>
            <img
              src={exchange.oldProductImage || 'https://via.placeholder.com/80'}
              alt={exchange.oldProductName}
              style={{
                width: '70px', height: '70px',
                objectFit: 'cover', borderRadius: '10px',
                margin: '0 auto 8px',
                display: 'block',
              }}
            />
            <p style={{
              margin: '0 0 4px', fontSize: '0.82rem',
              fontWeight: '700', color: '#7F1D1D',
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {exchange.oldProductName}
            </p>
            <strong style={{ color: '#DC2626', fontSize: '0.95rem' }}>
              ₹{exchange.oldPrice?.toLocaleString('en-IN')}
            </strong>
          </div>

          {/* Arrow */}
          <div style={{
            fontSize: '2rem', color: '#7B2FBE',
            fontWeight: '900',
          }}>
            →
          </div>

          {/* NEW product */}
          <div style={{
            padding: '14px',
            background: '#ECFDF5',
            border: '1.5px solid #A7F3D0',
            borderRadius: '14px',
            textAlign: 'center',
          }}>
            <span style={{
              display: 'inline-block', fontSize: '0.66rem', fontWeight: '800',
              background: '#10B981', color: 'white',
              padding: '3px 10px', borderRadius: '999px', marginBottom: '8px',
              textTransform: 'uppercase', letterSpacing: '0.6px',
            }}>
              📦 Getting
            </span>
            <img
              src={exchange.newProductImage || 'https://via.placeholder.com/80'}
              alt={exchange.newProductName}
              style={{
                width: '70px', height: '70px',
                objectFit: 'cover', borderRadius: '10px',
                margin: '0 auto 8px',
                display: 'block',
              }}
            />
            <p style={{
              margin: '0 0 4px', fontSize: '0.82rem',
              fontWeight: '700', color: '#065F46',
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {exchange.newProductName}
            </p>
            <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>
              ₹{exchange.newPrice?.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        {/* Price difference */}
        {exchange.priceDifference !== 0 && (
          <div style={{
            padding: '12px 16px',
            background: exchange.priceDifference > 0 ? '#FFFBEB' : '#F0F9FF',
            border: `1.5px solid ${exchange.priceDifference > 0 ? '#FDE68A' : '#BFDBFE'}`,
            borderRadius: '10px',
            marginBottom: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>
                {exchange.priceDifference > 0 ? '💰' : '💸'}
              </span>
              <div>
                <p style={{
                  margin: 0, fontSize: '0.82rem', fontWeight: '800',
                  color: exchange.priceDifference > 0 ? '#92400E' : '#1E40AF',
                }}>
                  Price Difference
                </p>
                <p style={{
                  margin: '2px 0 0', fontSize: '0.74rem',
                  color: exchange.priceDifference > 0 ? '#78350F' : '#1E40AF',
                  fontWeight: '600',
                }}>
                  {exchange.priceDifference > 0
                    ? 'You pay extra'
                    : 'Refunded to original payment method'}
                </p>
              </div>
            </div>
            <strong style={{
              fontSize: '1.2rem',
              color: exchange.priceDifference > 0 ? '#F59E0B' : '#3B82F6',
            }}>
              {exchange.priceDifference > 0
                ? `+ ₹${exchange.priceDifference.toLocaleString('en-IN')}`
                : `− ₹${Math.abs(exchange.priceDifference).toLocaleString('en-IN')}`}
            </strong>
          </div>
        )}

        {/* Payment link (if awaiting payment) */}
        {exchange.status === 'awaiting_payment' && exchange.paymentLinkUrl && (
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #FFEDD5, #FED7AA)',
            border: '1.5px solid #FB923C',
            borderRadius: '12px',
            marginBottom: '14px',
            textAlign: 'center',
          }}>
            <p style={{
              margin: '0 0 8px', fontSize: '0.86rem',
              fontWeight: '800', color: '#9A3412',
            }}>
              💳 Payment Required to Continue
            </p>
            <a
              href={exchange.paymentLinkUrl}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                color: 'white', borderRadius: '10px',
                textDecoration: 'none', fontWeight: '800',
                fontSize: '0.9rem',
              }}
            >
              💳 Pay ₹{exchange.priceDifference} Now →
            </a>
          </div>
        )}

        {/* Reason */}
        <p style={{
          margin: '0 0 14px', fontSize: '0.82rem', color: '#6B4E8A',
          padding: '10px 14px', background: '#FAFAFA',
          borderRadius: '8px', fontWeight: '600',
        }}>
          <strong style={{ color: '#7B2FBE' }}>Reason:</strong> {exchange.reason}
        </p>

        {/* Rejection reason */}
        {isRejected && exchange.rejectionReason && (
          <div style={{
            padding: '12px 14px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '10px',
            marginBottom: '14px',
          }}>
            <strong style={{ color: '#DC2626', fontSize: '0.84rem' }}>
              ❌ Rejection Reason:
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#991B1B', fontWeight: '600' }}>
              {exchange.rejectionReason}
            </p>
          </div>
        )}

        {/* Timeline (collapsible) */}
        {!isRejected && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                width: '100%', padding: '10px',
                background: '#F5F3FF', color: '#7B2FBE',
                border: '1px solid #EDD9FF', borderRadius: '10px',
                fontWeight: '700', fontSize: '0.82rem',
                cursor: 'pointer', fontFamily: 'inherit',
                marginBottom: expanded ? '14px' : 0,
              }}
            >
              {expanded ? '▲ Hide Progress Timeline' : '▼ View Progress Timeline'}
            </button>

            {expanded && (
              <div style={{
                padding: '16px',
                background: '#FAFAFA',
                borderRadius: '12px',
                marginBottom: '14px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {TIMELINE_STEPS.map((step, i) => {
                    const isDone    = i < currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step.key} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '8px 0',
                      }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: isDone
                            ? 'linear-gradient(135deg, #10B981, #059669)'
                            : isCurrent
                              ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}CC)`
                              : '#E5E7EB',
                          color: isDone || isCurrent ? 'white' : '#9CA3AF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '900', fontSize: '0.8rem',
                          flexShrink: 0,
                          boxShadow: isCurrent ? `0 0 0 4px ${cfg.color}22` : 'none',
                        }}>
                          {isDone ? '✓' : step.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            margin: 0, fontSize: '0.86rem',
                            fontWeight: isCurrent ? '800' : isDone ? '700' : '600',
                            color: isCurrent ? cfg.color : isDone ? '#10B981' : '#9CA3AF',
                          }}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: cfg.color, fontWeight: '600' }}>
                              ● Current step
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tracking numbers */}
        {(exchange.pickupTracking || exchange.shipmentTracking) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {exchange.pickupTracking && (
              <div style={{
                padding: '10px 14px', background: '#EDE9FE',
                border: '1px solid #DDD6FE', borderRadius: '10px',
              }}>
                <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: '800', color: '#6D28D9', textTransform: 'uppercase' }}>
                  📦 Pickup Tracking
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', fontWeight: '700', color: '#5B21B6', fontFamily: 'monospace' }}>
                  {exchange.pickupTracking}
                </p>
              </div>
            )}
            {exchange.shipmentTracking && (
              <div style={{
                padding: '10px 14px', background: '#CFFAFE',
                border: '1px solid #A5F3FC', borderRadius: '10px',
              }}>
                <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: '800', color: '#0E7490', textTransform: 'uppercase' }}>
                  🚚 New Product Tracking
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', fontWeight: '700', color: '#155E75', fontFamily: 'monospace' }}>
                  {exchange.shipmentTracking}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href={`/orders/${exchange.orderId}`} style={{
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

          {canCancel && (
            <button
              onClick={() => onCancel(exchange.id)}
              style={{
                padding: '10px 16px',
                background: 'white',
                color: '#EF4444',
                border: '1.5px solid #FCA5A5',
                borderRadius: '10px',
                fontSize: '0.84rem',
                fontWeight: '800',
                cursor: 'pointer',
                fontFamily: 'inherit',
                minWidth: '140px',
              }}
            >
              ❌ Cancel
            </button>
          )}

          {isRejected && (
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