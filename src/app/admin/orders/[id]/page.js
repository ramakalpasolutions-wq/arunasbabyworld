'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const STATUS_OPTIONS = [
  'Pending', 'Confirmed', 'Processing',
  'Shipped', 'Delivered', 'Cancelled', 'Refunded',
  'Return_Requested',
];

const STATUS_COLOR = {
  Pending:          '#f59e0b',
  Confirmed:        '#3b82f6',
  Processing:       '#8b5cf6',
  Shipped:          '#06b6d4',
  Delivered:        '#10b981',
  Cancelled:        '#ef4444',
  Refunded:         '#6b7280',
  Return_Requested: '#f97316',
};

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

function fmtOrderNum(order) {
  return order?.orderNumber
    ? `ABW-${order.orderNumber}`
    : `#${order?.id?.slice(-8)?.toUpperCase()}`;
}

/* ══════════════════════════════════════════
   SHIP BUTTON — Manual AWB fallback
══════════════════════════════════════════ */
function ShipButton({ order, onSuccess }) {
  const [loading,       setLoading]       = useState(false);
  const [showManual,    setShowManual]    = useState(true);
  const [manualAwb,     setManualAwb]     = useState('');
  const [manualCourier, setManualCourier] = useState('Nimbus Post');

  const handleAutoShip = async () => {
    if (!confirm('Try auto-creating shipment via Nimbus Post API?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/shipping/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.suggestion || 'API not ready. Use manual AWB below.');
        setShowManual(true);
        return;
      }
      toast.success(`✅ Shipment created! AWB: ${data.awb}`);
      onSuccess();
    } catch (err) {
      toast.error(err.message);
      setShowManual(true);
    } finally {
      setLoading(false);
    }
  };

  const handleManualShip = async () => {
    if (!manualAwb.trim()) {
      toast.error('Please enter AWB number');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/shipping/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orderId:       order.id,
          manualAwb:     manualAwb.trim(),
          manualCourier: manualCourier.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✅ AWB saved! ${data.awb}`);
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (order.awbNumber) {
    return (
      <div style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #E0F2FE, #EDE9FE)',
        border: '1.5px solid #7DD3FC',
        borderRadius: '12px',
      }}>
        <p style={{
          margin: '0 0 6px', fontSize: '0.72rem', fontWeight: '800',
          color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          🚚 Shipment Info
        </p>
        <p style={{
          margin: '0 0 4px', fontFamily: 'monospace', fontWeight: '800',
          color: '#0369A1', fontSize: '1rem',
        }}>
          AWB: {order.awbNumber}
        </p>
        {order.courierName && (
          <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#0369A1', fontWeight: '600' }}>
            via {order.courierName}
          </p>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank" rel="noopener noreferrer"
              style={{
                padding: '7px 14px', background: '#0369A1', color: 'white',
                borderRadius: '8px', textDecoration: 'none',
                fontWeight: '700', fontSize: '0.80rem', fontFamily: 'Nunito, sans-serif',
              }}
            >
              📦 Track Shipment
            </a>
          )}
          <button
            onClick={() => { navigator.clipboard.writeText(order.awbNumber); toast.success('AWB copied!'); }}
            style={{
              padding: '7px 14px', background: 'white', color: '#0369A1',
              border: '1.5px solid #7DD3FC', borderRadius: '8px',
              fontWeight: '700', fontSize: '0.80rem', cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            📋 Copy AWB
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        padding: '10px 12px',
        background: '#FEF3C7',
        border: '1.5px solid #FDE68A',
        borderRadius: '10px',
        fontSize: '0.78rem',
        color: '#92400E',
        fontWeight: '600',
        lineHeight: 1.5,
      }}>
        ℹ️ <strong>How to ship:</strong>
        <br />
        1. Go to{' '}
        <a
          href="https://ship.nimbuspost.com"
          target="_blank" rel="noopener noreferrer"
          style={{ color: '#0369A1', fontWeight: '800' }}
        >
          Nimbus Post Dashboard
        </a>
        <br />
        2. Create shipment for this order manually
        <br />
        3. Copy the AWB number and paste below
      </div>

      <div style={{
        padding: '16px',
        background: '#F8FAFC',
        border: '1.5px solid #E2E8F0',
        borderRadius: '12px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: '800', color: '#374151' }}>
          ✏️ Enter AWB from Nimbus Post
        </p>
        <input
          type="text"
          value={manualAwb}
          onChange={e => setManualAwb(e.target.value)}
          placeholder="e.g. NP123456789"
          style={{
            width: '100%', padding: '10px 12px',
            border: '1.5px solid #D1D5DB', borderRadius: '8px',
            fontSize: '0.90rem', fontFamily: 'monospace',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <input
          type="text"
          value={manualCourier}
          onChange={e => setManualCourier(e.target.value)}
          placeholder="Courier name (e.g. Delhivery, DTDC)"
          style={{
            width: '100%', padding: '10px 12px',
            border: '1.5px solid #D1D5DB', borderRadius: '8px',
            fontSize: '0.88rem', fontFamily: 'Nunito, sans-serif',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleManualShip}
          disabled={loading || !manualAwb.trim()}
          style={{
            width: '100%', padding: '12px',
            background: manualAwb.trim() && !loading
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : '#E5E7EB',
            color: manualAwb.trim() && !loading ? 'white' : '#9CA3AF',
            border: 'none', borderRadius: '10px',
            fontWeight: '800', fontSize: '0.92rem',
            cursor: manualAwb.trim() && !loading ? 'pointer' : 'not-allowed',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          {loading ? '⏳ Saving...' : '✅ Save AWB & Mark as Shipped'}
        </button>
      </div>

      <button
        onClick={handleAutoShip}
        disabled={loading}
        style={{
          width: '100%', padding: '10px',
          background: 'white', color: '#6B7280',
          border: '1.5px solid #E5E7EB', borderRadius: '10px',
          fontWeight: '700', fontSize: '0.80rem',
          cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
        }}
      >
        🔄 Try Auto-Create via API (when activated)
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN TRACKING PANEL
══════════════════════════════════════════ */
function AdminTrackingPanel({ awb }) {
  const [tracking, setTracking] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!awb) return;
    fetchTracking();
    const interval = setInterval(fetchTracking, 60000);
    return () => clearInterval(interval);
  }, [awb]);

  const fetchTracking = async () => {
    try {
      const res  = await fetch(`/api/shipping/track/${awb}`);
      const data = await res.json();
      if (data.success) setTracking(data.tracking);
    } catch (err) {
      console.error('Tracking error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!awb) return null;

  return (
    <div style={{
      background: 'white',
      border: '1.5px solid #E0F2FE',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '12px',
    }}>
      <h4 style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: '800', color: '#0369A1' }}>
        📡 Live Tracking Events
      </h4>

      {loading ? (
        <p style={{ color: '#9CA3AF', fontSize: '0.82rem', textAlign: 'center' }}>
          Loading tracking...
        </p>
      ) : tracking ? (
        <div>
          {tracking.current_status && (
            <div style={{
              padding: '10px 12px',
              background: '#E0F2FE',
              borderRadius: '8px',
              marginBottom: '12px',
            }}>
              <p style={{ margin: 0, fontWeight: '800', color: '#0369A1', fontSize: '0.88rem' }}>
                Current: {tracking.current_status}
              </p>
              {tracking.current_timestamp && (
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#6B7280' }}>
                  {new Date(tracking.current_timestamp).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          )}

          {tracking.tracking_data?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {tracking.tracking_data.map((event, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: i === 0 ? '#0369A1' : '#CBD5E1',
                      marginTop: '4px', flexShrink: 0,
                    }} />
                    {i < tracking.tracking_data.length - 1 && (
                      <div style={{ width: '2px', height: '28px', background: '#E2E8F0' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: '10px', flex: 1 }}>
                    <p style={{
                      margin: 0, fontSize: '0.82rem',
                      fontWeight: i === 0 ? '700' : '600',
                      color: i === 0 ? '#0F172A' : '#6B7280',
                    }}>
                      {event.status || event.activity}
                    </p>
                    {event.location && (
                      <p style={{ margin: '1px 0 0', fontSize: '0.72rem', color: '#94A3B8' }}>
                        📍 {event.location}
                      </p>
                    )}
                    {event.timestamp && (
                      <p style={{ margin: '1px 0 0', fontSize: '0.70rem', color: '#94A3B8' }}>
                        🕒 {new Date(event.timestamp).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9CA3AF', fontSize: '0.82rem', textAlign: 'center', padding: '8px 0' }}>
              No tracking events yet
            </p>
          )}
        </div>
      ) : (
        <p style={{ color: '#9CA3AF', fontSize: '0.82rem', textAlign: 'center' }}>
          Tracking info not available yet
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN CANCEL & REFUND MODAL
══════════════════════════════════════════ */
function AdminCancelModal({ order, onClose, onSuccess }) {
  const [reason,        setReason]        = useState('');
  const [customReason,  setCustomReason]  = useState('');
  const [adminNotes,    setAdminNotes]    = useState('');
  const [refundMethod,  setRefundMethod]  = useState('');
  const [bankDetails,   setBankDetails]   = useState({
    accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', upiId: '',
  });
  const [loading,       setLoading]       = useState(false);

  const isPaid      = order.isPaid;
  const isRazorpay  = order.paymentMethod === 'Razorpay';
  const needsRefund = isPaid;

  const CANCEL_REASONS = [
    'Out of stock',
    'Customer requested cancellation',
    'Payment fraud detected',
    'Address undeliverable',
    'Duplicate order',
    'Product discontinued',
    'Wrong price displayed',
    'Other',
  ];

  const handleSubmit = async () => {
    const finalReason = reason === 'Other' ? customReason : reason;

    if (!finalReason.trim()) {
      toast.error('Please select or enter a reason');
      return;
    }

    if (needsRefund && !refundMethod) {
      toast.error('Please choose a refund method');
      return;
    }

    if (needsRefund && refundMethod === 'manual') {
      if (!bankDetails.upiId && (!bankDetails.accountNumber || !bankDetails.ifscCode)) {
        toast.error('Enter UPI ID or complete bank details');
        return;
      }
    }

    if (!confirm(`Cancel this order?\n\nReason: ${finalReason}\n\nRefund: ${needsRefund ? refundMethod : 'Not required'}`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/admin-cancel`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          reason:       finalReason,
          adminNotes:   adminNotes || null,
          refundMethod: needsRefund ? refundMethod : 'none',
          bankDetails:  refundMethod === 'manual' ? bankDetails : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('✅ Order cancelled successfully');
      if (data.refundType === 'razorpay') {
        setTimeout(() => toast.success('💰 Refund initiated via Razorpay!', { duration: 5000 }), 500);
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', fontFamily: 'Nunito, sans-serif',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'white', borderRadius: '20px',
        width: '100%', maxWidth: '560px', maxHeight: '92vh',
        overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '2px solid #FEF2F2',
          background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
          borderRadius: '20px 20px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#DC2626' }}>
              ❌ Cancel & Refund Order
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#7F1D1D', fontWeight: '700', fontFamily: 'monospace' }}>
              {fmtOrderNum(order)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'white', border: '1.5px solid #E5E7EB',
              width: '34px', height: '34px', borderRadius: '50%',
              cursor: 'pointer', color: '#DC2626', fontSize: '1rem', fontWeight: '700',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Order Summary */}
          <div style={{
            padding: '12px 14px', background: '#F9FAFB', borderRadius: '12px',
            marginBottom: '16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
          }}>
            <div>
              <p style={{ fontSize: '0.84rem', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                {order.orderItems?.length} item{order.orderItems?.length > 1 ? 's' : ''}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#6B7280', margin: 0, fontWeight: '600' }}>
                {order.paymentMethod} · {isPaid ? '✅ Paid' : '⏳ Not Paid'}
              </p>
            </div>
            <strong style={{ color: '#FF6B35', fontSize: '1.1rem' }}>
              ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
            </strong>
          </div>

          {/* Cancel Reason */}
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#1F2937', marginBottom: '8px' }}>
            Cancellation Reason <span style={{ color: '#EF4444' }}>*</span>
          </label>

          <div style={{ display: 'grid', gap: '6px', marginBottom: '12px' }}>
            {CANCEL_REASONS.map(r => (
              <label key={r} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px',
                background: reason === r ? '#FEF2F2' : 'white',
                border: `1.5px solid ${reason === r ? '#FCA5A5' : '#E5E7EB'}`,
                borderRadius: '10px', cursor: 'pointer',
                fontSize: '0.86rem', fontWeight: '600', color: '#1F2937',
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
              placeholder="Enter custom reason..."
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

          {/* Refund Section */}
          {needsRefund && (
            <>
              <div style={{
                padding: '12px 14px',
                background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                border: '1.5px solid #10B981',
                borderRadius: '12px', marginBottom: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>
                    💰 Refund Amount
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: '1.4rem', fontWeight: '900', color: '#10B981' }}>
                    ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
                  </p>
                </div>
                <span style={{ fontSize: '2rem' }}>💰</span>
              </div>

              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#1F2937', marginBottom: '8px' }}>
                Refund Method <span style={{ color: '#EF4444' }}>*</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {isRazorpay && (
                  <div
                    onClick={() => setRefundMethod('razorpay')}
                    style={{
                      padding: '14px', textAlign: 'center',
                      background: refundMethod === 'razorpay' ? '#F0FDF4' : 'white',
                      border: `2px solid ${refundMethod === 'razorpay' ? '#10B981' : '#E5E7EB'}`,
                      borderRadius: '12px', cursor: 'pointer',
                      transition: 'all 0.2s', position: 'relative',
                    }}
                  >
                    <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>⚡</div>
                    <p style={{
                      margin: '0 0 4px', fontSize: '0.86rem', fontWeight: '800',
                      color: refundMethod === 'razorpay' ? '#059669' : '#374151',
                    }}>
                      Auto Razorpay
                    </p>
                    <span style={{
                      display: 'inline-block', fontSize: '0.62rem', fontWeight: '700',
                      background: '#D1FAE5', color: '#065F46',
                      padding: '2px 8px', borderRadius: '999px',
                    }}>
                      Instant / 2-3 hrs
                    </span>
                    {refundMethod === 'razorpay' && (
                      <div style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '18px', height: '18px', borderRadius: '50%',
                        background: '#10B981', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.68rem', fontWeight: '900',
                      }}>✓</div>
                    )}
                  </div>
                )}

                <div
                  onClick={() => setRefundMethod('manual')}
                  style={{
                    padding: '14px', textAlign: 'center',
                    background: refundMethod === 'manual' ? '#EFF6FF' : 'white',
                    border: `2px solid ${refundMethod === 'manual' ? '#3B82F6' : '#E5E7EB'}`,
                    borderRadius: '12px', cursor: 'pointer',
                    transition: 'all 0.2s', position: 'relative',
                  }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>🏦</div>
                  <p style={{
                    margin: '0 0 4px', fontSize: '0.86rem', fontWeight: '800',
                    color: refundMethod === 'manual' ? '#1D4ED8' : '#374151',
                  }}>
                    Manual Transfer
                  </p>
                  <span style={{ fontSize: '0.62rem', fontWeight: '700', color: '#6B7280' }}>
                    UPI / Bank
                  </span>
                  {refundMethod === 'manual' && (
                    <div style={{
                      position: 'absolute', top: '6px', right: '6px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: '#3B82F6', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.68rem', fontWeight: '900',
                    }}>✓</div>
                  )}
                </div>
              </div>

              {refundMethod === 'manual' && (
                <div style={{
                  padding: '14px', background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0', borderRadius: '12px',
                  marginBottom: '14px',
                }}>
                  <p style={{ margin: '0 0 10px', fontSize: '0.78rem', fontWeight: '800', color: '#374151' }}>
                    Customer's Refund Details
                  </p>

                  <input
                    type="text"
                    value={bankDetails.upiId}
                    onChange={e => setBankDetails(p => ({ ...p, upiId: e.target.value }))}
                    placeholder="UPI ID (optional — fastest)"
                    style={{
                      width: '100%', padding: '9px 12px', marginBottom: '8px',
                      border: '1.5px solid #E5E7EB', borderRadius: '8px',
                      fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />

                  <p style={{ margin: '8px 0', fontSize: '0.72rem', color: '#6B7280', fontWeight: '700', textAlign: 'center' }}>
                    — OR bank details —
                  </p>

                  <input
                    type="text"
                    value={bankDetails.accountHolderName}
                    onChange={e => setBankDetails(p => ({ ...p, accountHolderName: e.target.value }))}
                    placeholder="Account holder name"
                    style={{
                      width: '100%', padding: '9px 12px', marginBottom: '8px',
                      border: '1.5px solid #E5E7EB', borderRadius: '8px',
                      fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={e => setBankDetails(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Account number"
                    maxLength={18}
                    style={{
                      width: '100%', padding: '9px 12px', marginBottom: '8px',
                      border: '1.5px solid #E5E7EB', borderRadius: '8px',
                      fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      value={bankDetails.ifscCode}
                      onChange={e => setBankDetails(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                      placeholder="IFSC"
                      maxLength={11}
                      style={{
                        width: '100%', padding: '9px 12px',
                        border: '1.5px solid #E5E7EB', borderRadius: '8px',
                        fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={e => setBankDetails(p => ({ ...p, bankName: e.target.value }))}
                      placeholder="Bank name"
                      style={{
                        width: '100%', padding: '9px 12px',
                        border: '1.5px solid #E5E7EB', borderRadius: '8px',
                        fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {!needsRefund && (
            <div style={{
              padding: '12px 14px', background: '#F0F9FF',
              border: '1.5px solid #BFDBFE', borderRadius: '12px', marginBottom: '14px',
            }}>
              <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: '700', color: '#1E40AF' }}>
                ℹ️ No refund required
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#1E3A8A', fontWeight: '600' }}>
                Customer hasn't paid for this order yet.
              </p>
            </div>
          )}

          {/* Admin Notes */}
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '800', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
            📝 Admin Notes (internal)
          </label>
          <textarea
            value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
            placeholder="Internal notes about this cancellation..."
            rows={2}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid #E5E7EB', borderRadius: '10px',
              fontFamily: 'Nunito, sans-serif', fontSize: '0.86rem',
              resize: 'vertical', outline: 'none', marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          />

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
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
              {loading
                ? '⏳ Processing...'
                : needsRefund
                  ? `❌ Cancel & Refund ₹${Math.round(order.totalPrice)?.toLocaleString('en-IN')}`
                  : '❌ Confirm Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminOrderDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [order,                setOrder]                = useState(null);
  const [refund,               setRefund]               = useState(null);
  const [loading,              setLoading]              = useState(true);
  const [updating,             setUpdating]             = useState(false);
  const [processingRefund,     setProcessingRefund]     = useState(false);
  const [newStatus,            setNewStatus]            = useState('');
  const [trackingNumber,       setTrackingNumber]       = useState('');
  const [adminNotes,           setAdminNotes]           = useState('');
  const [showAdminCancelModal, setShowAdminCancelModal] = useState(false);

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try {
      const res  = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setOrder(data.order);
      setNewStatus(data.order?.orderStatus || '');
      setTrackingNumber(data.order?.trackingNumber || '');

      const refundRes  = await fetch(`/api/refunds?limit=200`);
      const refundData = await refundRes.json();
      const found = (refundData.refunds || []).find(r => r.orderId === id);
      if (found) {
        setRefund(found);
        setAdminNotes(found.notes || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orderStatus:    newStatus,
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

  const handleProcessRefund = async (status) => {
    if (!refund) { toast.error('No refund record found'); return; }
    if (!confirm(`Mark refund as ${status}?`)) return;

    setProcessingRefund(true);
    try {
      const res = await fetch('/api/refunds', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          refundId:     refund.id,
          refundStatus: status,
          notes:        adminNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (status === 'completed') {
        await fetch(`/api/orders/${id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ orderStatus: 'Refunded' }),
        });
      }
      toast.success(`✅ Refund marked as ${status}`);
      fetchOrder();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleRejectReturn = async () => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason?.trim()) return;

    setProcessingRefund(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          orderStatus:   'Delivered',
          returnRequest: null,
          returnStatus:  'rejected',
          notes:         `Return rejected: ${reason}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (refund) {
        await fetch('/api/refunds', {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            refundId:     refund.id,
            refundStatus: 'failed',
            notes:        `Return rejected: ${reason}`,
          }),
        });
      }
      toast.success('❌ Return rejected');
      fetchOrder();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingRefund(false);
    }
  };

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '50vh', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '4px solid #fce4ec', borderTop: '4px solid #ff6b9d',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#888' }}>Loading order details...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!order) return (
    <div className={styles.notFound}>
      <span>📦</span>
      <h2>Order not found</h2>
      <button onClick={() => router.back()}>← Go Back</button>
    </div>
  );

  const currentStep       = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled       = order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';
  const isReturnRequested = order.orderStatus === 'Return_Requested' || !!order.returnRequest;
  const hasRefund         = !!refund;
  const returnReq         = order.returnRequest;

  const canShip = ['Confirmed', 'Processing', 'Shipped'].includes(order.orderStatus);

  // ✅ Admin can cancel — not already cancelled, not delivered, not return-requested
  const canAdminCancel = !isCancelled && !isReturnRequested && order.orderStatus !== 'Delivered';

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>
              Order{' '}
              <span style={{
                fontFamily: 'monospace',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {fmtOrderNum(order)}
              </span>
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            padding: '6px 16px', borderRadius: '20px',
            fontWeight: '700', fontSize: '14px',
            background: `${STATUS_COLOR[order.orderStatus] || '#888'}20`,
            color: STATUS_COLOR[order.orderStatus] || '#888',
          }}>
            {order.orderStatus?.replace('_', ' ')}
          </span>

          {/* ✅ Admin Cancel & Refund button */}
          {canAdminCancel && (
            <button
              onClick={() => setShowAdminCancelModal(true)}
              style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                color: 'white', border: 'none',
                borderRadius: '10px', fontWeight: '800',
                fontSize: '13px', cursor: 'pointer',
                fontFamily: 'Nunito, sans-serif',
                boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
              }}
            >
              ❌ Cancel & Refund
            </button>
          )}

          <button className="btn btn-outline" onClick={() => router.back()}>
            ← Back to Orders
          </button>
        </div>
      </div>

      {/* ── RETURN REQUEST BANNER ── */}
      {isReturnRequested && returnReq && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
          border: '2px solid #F97316', borderRadius: '16px',
          padding: '20px 24px', marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(249,115,22,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', color: 'white', flexShrink: 0,
            }}>🔄</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', color: '#9A3412', fontSize: '1.15rem', fontWeight: '800' }}>
                Return Request — {fmtOrderNum(order)}
              </h3>
              <p style={{ margin: 0, color: '#7C2D12', fontSize: '0.9rem', fontWeight: '600' }}>
                Customer wants to return this order. Review and take action.
              </p>
            </div>
            <span style={{
              padding: '6px 14px', background: 'white',
              color: '#F97316', border: '2px solid #FDBA74',
              borderRadius: '999px', fontSize: '0.78rem', fontWeight: '800',
            }}>
              ⏳ Pending Action
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px', marginBottom: '16px',
          }}>
            <div style={{ padding: '12px 14px', background: 'white', borderRadius: '10px', border: '1.5px solid #FED7AA' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#9A3412', textTransform: 'uppercase' }}>📝 Return Reason</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#7C2D12', fontWeight: '700' }}>{returnReq.reason}</p>
            </div>
            <div style={{ padding: '12px 14px', background: 'white', borderRadius: '10px', border: '1.5px solid #A7F3D0' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>💰 Refund Amount</p>
              <p style={{ margin: '4px 0 0', fontSize: '1.1rem', color: '#10B981', fontWeight: '900' }}>₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}</p>
            </div>
            <div style={{ padding: '12px 14px', background: 'white', borderRadius: '10px', border: '1.5px solid #FED7AA' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#9A3412', textTransform: 'uppercase' }}>🟡 Refund Status</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#F97316', fontWeight: '800' }}>{refund?.refundStatus || 'Under Review'}</p>
            </div>
          </div>

          {returnReq.refundMethod === 'upi' && (
            <div style={{
              padding: '14px', background: 'white', borderRadius: '10px',
              marginBottom: '16px', border: '1.5px solid #A7F3D0',
              display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '1.5rem' }}>📱</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>Send Refund to UPI ID</p>
                <p style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: '800', color: '#10B981', fontFamily: 'monospace', wordBreak: 'break-all' }}>{returnReq.upiId}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(returnReq.upiId); toast.success('UPI ID copied!'); }}
                style={{ padding: '8px 16px', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer' }}
              >
                📋 Copy
              </button>
            </div>
          )}

          {returnReq.refundMethod === 'bank' && (
            <div style={{ padding: '14px', background: 'white', borderRadius: '10px', marginBottom: '16px', border: '1.5px solid #BFDBFE' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: '800', color: '#1E40AF' }}>🏦 Bank Account Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#6B7280' }}>Account Holder</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.86rem', fontWeight: '700' }}>{returnReq.accountHolderName}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#6B7280' }}>IFSC Code</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.86rem', fontWeight: '700', fontFamily: 'monospace' }}>{returnReq.ifscCode}</p>
                </div>
                {returnReq.bankName && (
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#6B7280' }}>Bank Name</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.86rem', fontWeight: '700' }}>{returnReq.bankName}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px', marginTop: '16px', paddingTop: '16px',
            borderTop: '1.5px solid #FED7AA',
          }}>
            {refund?.refundStatus === 'pending' && (
              <button onClick={() => handleProcessRefund('processing')} disabled={processingRefund}
                style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                {processingRefund ? '⏳...' : '⚙️ Mark Processing'}
              </button>
            )}
            {refund && refund.refundStatus !== 'completed' && refund.refundStatus !== 'failed' && (
              <button onClick={() => handleProcessRefund('completed')} disabled={processingRefund}
                style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                {processingRefund ? '⏳...' : '✅ Mark Completed'}
              </button>
            )}
            {refund?.refundStatus !== 'completed' && (
              <button onClick={handleRejectReturn} disabled={processingRefund}
                style={{ padding: '12px 16px', background: 'white', color: '#EF4444', border: '2px solid #FCA5A5', borderRadius: '10px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                ❌ Reject Return
              </button>
            )}
            {refund && (
              <Link href={`/admin/refunds/${refund.id}`}
                style={{ padding: '12px 16px', background: 'white', color: '#7B2FBE', border: '2px solid #DDD6FE', borderRadius: '10px', fontWeight: '800', fontSize: '0.88rem', textAlign: 'center', textDecoration: 'none', fontFamily: 'Nunito, sans-serif' }}>
                👁️ View Refund
              </Link>
            )}
          </div>

          {refund?.refundStatus === 'completed' && (
            <div style={{ marginTop: '16px', padding: '14px', background: '#ECFDF5', border: '2px solid #10B981', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#065F46' }}>✅ Refund Completed Successfully</p>
            </div>
          )}

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: '800', color: '#9A3412', marginBottom: '6px', textTransform: 'uppercase' }}>
              📝 Admin Notes
            </label>
            <textarea
              value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
              placeholder="Add notes about this refund..."
              rows={2}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #FED7AA', borderRadius: '8px', fontFamily: 'Nunito, sans-serif', fontSize: '0.86rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#7C2D12', background: 'white' }}
            />
          </div>
        </div>
      )}

      {/* ── PROGRESS TRACKER ── */}
      {!isCancelled && !isReturnRequested && (
        <div className={styles.tracker}>
          <h3>Order Progress</h3>
          <div className={styles.steps}>
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={styles.stepWrap}>
                <div className={styles.stepCircle} style={{
                  background: i <= currentStep ? STATUS_COLOR[order.orderStatus] : '#e5e7eb',
                  color: i <= currentStep ? 'white' : '#999',
                }}>
                  {i < currentStep ? '✓' : ['📋', '✅', '⚙️', '🚚', '🎉'][i]}
                </div>
                <span className={styles.stepLabel} style={{ color: i <= currentStep ? STATUS_COLOR[order.orderStatus] : '#999' }}>
                  {step}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={styles.stepLine} style={{ background: i < currentStep ? STATUS_COLOR[order.orderStatus] : '#e5e7eb' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div style={{
          background: order.orderStatus === 'Refunded' ? '#ECFDF5' : '#fee2e2',
          border: `1.5px solid ${order.orderStatus === 'Refunded' ? '#10B981' : '#fca5a5'}`,
          borderRadius: '12px', padding: '16px',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
          marginBottom: '20px',
        }}>
          <span style={{ fontSize: '24px' }}>
            {order.orderStatus === 'Refunded' ? '💰' : '❌'}
          </span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: order.orderStatus === 'Refunded' ? '#065F46' : '#DC2626' }}>
              Order {order.orderStatus}
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              {order.cancelReason && <>Reason: <strong>{order.cancelReason}</strong><br /></>}
              {order.cancelledAt && <>Cancelled on: {new Date(order.cancelledAt).toLocaleDateString('en-IN')}<br /></>}
              {order.refundStatus === 'processing' && (
                <span style={{ color: '#3B82F6', fontWeight: '700' }}>⚙️ Refund Processing</span>
              )}
              {order.refundStatus === 'completed' && (
                <span style={{ color: '#10B981', fontWeight: '800' }}>✅ Refund Completed — ₹{Math.round(order.refundAmount)?.toLocaleString('en-IN')}</span>
              )}
              {order.refundStatus === 'pending' && (
                <span style={{ color: '#F59E0B', fontWeight: '700' }}>⏳ Refund Pending</span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className={styles.grid}>

        {/* ── LEFT COLUMN ── */}
        <div className={styles.mainCol}>

          {/* Order Items */}
          <div className={styles.card}>
            <h3>🛍️ Order Items ({order.orderItems?.length})</h3>
            {order.orderItems?.map((item, i) => (
              <div key={i} className={styles.item}>
                <img src={item.image || 'https://via.placeholder.com/60'} alt={item.name} className={styles.itemImg} />
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemSub}>Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                </div>
                <span className={styles.itemTotal}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>

          {/* Customer Details */}
          <div className={styles.card}>
            <h3>👤 Customer Details</h3>
            <div className={styles.detailGrid}>
              <div><label>Name</label><p>{order.user?.name || '—'}</p></div>
              <div>
                <label>Email</label>
                <p><a href={`mailto:${order.user?.email}`} style={{ color: '#7c3aed', textDecoration: 'none' }}>{order.user?.email || '—'}</a></p>
              </div>
              <div>
                <label>Phone</label>
                <p>
                  {order.shippingAddress?.phone
                    ? <a href={`tel:${order.shippingAddress.phone}`} style={{ color: '#7c3aed', textDecoration: 'none' }}>📞 {order.shippingAddress.phone}</a>
                    : '—'}
                </p>
              </div>
              <div>
                <label>Payment Status</label>
                <p style={{ color: order.isPaid ? '#10b981' : '#f59e0b', fontWeight: '700' }}>
                  {order.isPaid ? `✅ Paid on ${new Date(order.paidAt).toLocaleDateString('en-IN')}` : '⏳ Pending'}
                </p>
              </div>
              <div><label>Payment Method</label><p>{order.paymentMethod || 'Razorpay'}</p></div>
              {order.paymentResult?.razorpayPaymentId && (
                <div>
                  <label>Transaction ID</label>
                  <p style={{ fontFamily: 'monospace', fontSize: '12px' }}>{order.paymentResult.razorpayPaymentId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className={styles.card}>
            <h3>📍 Shipping Address {isReturnRequested && '(Pickup From Here)'}</h3>
            {order.shippingAddress ? (
              <div className={styles.address}>
                <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>{order.shippingAddress.name}</p>
                <p>📞 {order.shippingAddress.phone}</p>
                <p>🏠 {order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
              </div>
            ) : <p style={{ color: '#888' }}>No address on record</p>}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className={styles.sideCol}>

          {/* Price Summary */}
          <div className={styles.card}>
            <h3>💰 Price Summary</h3>
            <div className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span>Items ({order.orderItems?.reduce((a, i) => a + i.quantity, 0)})</span>
                <span>₹{Math.round(order.itemsPrice)?.toLocaleString('en-IN')}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Shipping</span>
                <span style={{ color: order.shippingPrice === 0 ? '#10b981' : 'inherit' }}>
                  {order.shippingPrice === 0 ? '🎉 FREE' : `₹${order.shippingPrice}`}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className={`${styles.priceRow} ${styles.discountRow}`}>
                  <span>Coupon ({order.couponCode})</span>
                  <span>− ₹{Math.round(order.discountAmount)?.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <strong style={{ color: '#ff6b9d', fontSize: '1.2rem' }}>
                ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* ✅ Nimbus Post Shipping */}
          {canShip && (
            <div className={styles.card}>
              <h3>🚚 Shipping</h3>
              <ShipButton order={order} onSuccess={fetchOrder} />
              {order.awbNumber && (
                <AdminTrackingPanel awb={order.awbNumber} />
              )}
            </div>
          )}

          {/* Update Order */}
          {!isReturnRequested && !isCancelled && (
            <div className={styles.card}>
              <h3>🔄 Update Order</h3>
              <div className="form-group">
                <label>Order Status</label>
                <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tracking Number (optional)</label>
                <input
                  className="form-control"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder={order.awbNumber ? order.awbNumber : 'e.g. DTDC123456789'}
                />
                <small style={{ color: '#888', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {order.awbNumber
                    ? `✅ Auto-filled from AWB`
                    : 'Customer will receive email with tracking info'}
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
          )}

          {/* Quick Links */}
          {hasRefund && (
            <div className={styles.card} style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)' }}>
              <h3 style={{ color: '#7B2FBE' }}>🔗 Quick Links</h3>
              <Link href={`/admin/refunds/${refund.id}`} style={{
                display: 'block', padding: '10px 14px', background: 'white',
                color: '#7B2FBE', border: '1.5px solid #DDD6FE', borderRadius: '10px',
                textAlign: 'center', textDecoration: 'none', fontWeight: '800',
                fontSize: '0.86rem', marginBottom: '8px',
              }}>
                💰 View Refund #{refund.id?.slice(-8).toUpperCase()}
              </Link>
              <Link href="/admin/refunds" style={{
                display: 'block', padding: '10px 14px', background: 'white',
                color: '#7B2FBE', border: '1.5px solid #DDD6FE', borderRadius: '10px',
                textAlign: 'center', textDecoration: 'none', fontWeight: '800', fontSize: '0.86rem',
              }}>
                📊 All Refunds Dashboard
              </Link>
            </div>
          )}

          {/* Delivered */}
          {order.isDelivered && !isReturnRequested && (
            <div className={styles.card} style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }}>
              <h3 style={{ color: '#065f46' }}>🎉 Delivered</h3>
              <p style={{ color: '#047857', fontSize: '13px' }}>
                Delivered on {order.deliveredAt
                  ? new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* ✅ Admin Cancel & Refund Modal */}
      {showAdminCancelModal && (
        <AdminCancelModal
          order={order}
          onClose={() => setShowAdminCancelModal(false)}
          onSuccess={() => { setShowAdminCancelModal(false); fetchOrder(); }}
        />
      )}
    </div>
  );
}