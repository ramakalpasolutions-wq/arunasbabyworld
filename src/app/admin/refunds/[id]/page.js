'use client';

import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      color: '#F59E0B', bg: '#FEF3C7', icon: '🟡', desc: 'Waiting for action' },
  scheduled:    { label: 'Scheduled',    color: '#F97316', bg: '#FFEDD5', icon: '⏱️', desc: 'Auto-refund scheduled in 2 minutes' },
  processing:   { label: 'Processing',   color: '#3B82F6', bg: '#DBEAFE', icon: '⚙️', desc: 'Refund being processed' },
  completed:    { label: 'Completed',    color: '#10B981', bg: '#D1FAE5', icon: '✅', desc: 'Refund successfully sent' },
  failed:       { label: 'Failed',       color: '#EF4444', bg: '#FEE2E2', icon: '❌', desc: 'Refund failed' },
  not_required: { label: 'Not Required', color: '#6B7280', bg: '#F3F4F6', icon: 'ℹ️', desc: 'No refund needed' },
};

export default function AdminRefundDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [refund, setRefund]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(false);
  const [notes, setNotes]         = useState('');
  const [timeLeft, setTimeLeft]   = useState(null);
  const [autoProcessing, setAutoProcessing] = useState(false);
  const processedRef = useRef(false);

  /* ── Fetch refund ── */
  const fetchRefund = useCallback(async () => {
    try {
      const res  = await fetch(`/api/refunds?limit=200`);
      const data = await res.json();
      const found = (data.refunds || []).find(r => r.id === id);
      if (found) {
        setRefund(found);
        setNotes(found.notes || '');
      }
    } catch (err) {
      toast.error('Failed to load refund');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchRefund(); }, [fetchRefund]);

  /* ══════════════════════════════════════════
     ⏱️ COUNTDOWN TIMER (updates every second)
  ══════════════════════════════════════════ */
  useEffect(() => {
    if (!refund || refund.refundStatus !== 'scheduled' || !refund.scheduledAt) {
      setTimeLeft(null);
      processedRef.current = false;
      return;
    }

    const calculateTimeLeft = () => {
      const scheduledTime = new Date(refund.scheduledAt).getTime();
      const now = Date.now();
      const diff = scheduledTime - now;
      if (diff <= 0) return 0;
      return Math.ceil(diff / 1000);
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      // ✅ When timer hits 0 → trigger auto-process (only once!)
      if (remaining === 0 && !autoProcessing && !processedRef.current) {
        processedRef.current = true;
        setAutoProcessing(true);
        triggerAutoRefund();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [refund, autoProcessing]);

  /* ══════════════════════════════════════════
     🚀 AUTO-TRIGGER REFUND when countdown hits 0
  ══════════════════════════════════════════ */
  const triggerAutoRefund = async () => {
    try {
      console.log('⚡ Auto-triggering refund...');
      toast.loading('Processing refund...', { id: 'auto-refund' });

      const res = await fetch('/api/refunds/process-scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundId: id }),
      });
      const data = await res.json();

      toast.dismiss('auto-refund');

      if (data.success) {
        if (data.isAlreadyRefunded) {
          toast.success('✅ Money already refunded by Razorpay!', { duration: 5000 });
        } else if (data.razorpayResult?.success) {
          toast.success(`💰 ₹${refund.amount} sent via Razorpay!`, { duration: 5000 });
        } else {
          toast.success('✅ Refund processed!', { duration: 5000 });
        }
      } else {
        toast.error(data.message || 'Auto-refund failed');
      }
      // Refresh data to show new status
      setTimeout(() => fetchRefund(), 800);
    } catch (err) {
      toast.dismiss('auto-refund');
      toast.error('Error: ' + err.message);
    } finally {
      setAutoProcessing(false);
    }
  };

  /* ══════════════════════════════════════════
     🟢 Admin clicks "Accept Return" → Schedule
  ══════════════════════════════════════════ */
  const handleAcceptReturn = async () => {
    if (!confirm('Accept this return?\n\n⏱️ Refund will be auto-processed in 2 minutes.\nYou can cancel within 2 minutes if needed.')) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/refunds/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('⏱️ Refund scheduled! Will auto-process in 2 minutes.', { duration: 5000 });
      processedRef.current = false;
      fetchRefund();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  /* ══════════════════════════════════════════
     🛑 Admin clicks "Cancel Schedule"
  ══════════════════════════════════════════ */
  const handleCancelSchedule = async () => {
    if (!confirm('Cancel scheduled refund?\n\nThe refund will NOT be processed. You can manually process it later.')) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/refunds/cancel-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('🛑 Schedule cancelled. Refund back to pending.');
      processedRef.current = false;
      fetchRefund();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  /* ══════════════════════════════════════════
     ⚙️ Manual status update
  ══════════════════════════════════════════ */
  const handleStatusUpdate = async (newStatus) => {
    if (!confirm(`Mark refund as ${newStatus}?`)) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/refunds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId: id,
          refundStatus: newStatus,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`✅ Marked as ${newStatus}`);
      fetchRefund();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#9585B0', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
        <p style={{ fontWeight: '700' }}>Loading refund...</p>
      </div>
    );
  }

  if (!refund) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>❌</div>
        <h2 style={{ color: '#2D1A4A', margin: '0 0 12px' }}>Refund not found</h2>
        <button onClick={() => router.back()} style={{
          padding: '10px 24px', background: '#7B2FBE', color: 'white',
          border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          ← Go Back
        </button>
      </div>
    );
  }

  const statusCfg   = STATUS_CONFIG[refund.refundStatus] || STATUS_CONFIG.pending;
  const isUPI       = refund.refundType === 'upi_transfer';
  const isBank      = refund.refundType === 'bank_transfer';
  const isRazorpay  = refund.refundType === 'razorpay';
  const isPending   = refund.refundStatus === 'pending';
  const isScheduled = refund.refundStatus === 'scheduled';
  const isCompleted = refund.refundStatus === 'completed';
  const isFailed    = refund.refundStatus === 'failed';

  // Format timer
  const minutes = Math.floor((timeLeft || 0) / 60);
  const seconds = (timeLeft || 0) % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', padding: '4px' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <Link href="/admin/refunds" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#7B2FBE', textDecoration: 'none', fontWeight: '700',
            fontSize: '0.84rem', marginBottom: '12px',
          }}>
            ← Back to Refunds
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#2D1A4A' }}>
            Refund #{refund.id?.slice(-8).toUpperCase()}
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '0.84rem', fontWeight: '600' }}>
            Created {new Date(refund.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px',
          background: statusCfg.bg, color: statusCfg.color,
          borderRadius: '999px',
          fontWeight: '800', fontSize: '0.92rem',
          border: `1.5px solid ${statusCfg.color}30`,
        }}>
          {statusCfg.icon} {statusCfg.label}
        </span>
      </div>

      {/* ════════════════════════════════════════════
          ⏱️ COUNTDOWN BANNER (if scheduled)
      ════════════════════════════════════════════ */}
      {isScheduled && timeLeft !== null && timeLeft > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FFEDD5, #FED7AA)',
          border: '3px solid #F97316',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '24px',
          boxShadow: '0 10px 30px rgba(249,115,22,0.20)',
          animation: 'pulse 2s ease-in-out infinite',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '20px',
          }}>
            <div>
              <p style={{
                margin: '0 0 8px', fontSize: '0.84rem', fontWeight: '900',
                color: '#9A3412', textTransform: 'uppercase', letterSpacing: '1.5px',
              }}>
                ⏱️ Auto-Refund Scheduled
              </p>
              <p style={{
                margin: 0, fontSize: '4rem', fontWeight: '900',
                color: '#EA580C', lineHeight: 1, fontFamily: 'monospace',
                letterSpacing: '2px',
              }}>
                {formattedTime}
              </p>
              <p style={{
                margin: '10px 0 0', fontSize: '0.92rem',
                color: '#7C2D12', fontWeight: '700',
              }}>
                ⚡ Razorpay will auto-refund <strong>₹{refund.amount?.toLocaleString('en-IN')}</strong> in {minutes > 0 ? `${minutes} min ${seconds} sec` : `${seconds} seconds`}
              </p>
            </div>

            <button
              onClick={handleCancelSchedule}
              disabled={updating}
              style={{
                padding: '18px 30px',
                background: 'white',
                color: '#DC2626',
                border: '2px solid #EF4444',
                borderRadius: '14px',
                fontWeight: '800', fontSize: '1.05rem',
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 6px 18px rgba(239,68,68,0.25)',
              }}
            >
              🛑 Cancel Refund
            </button>
          </div>

          {/* Progress bar */}
          <div style={{
            marginTop: '24px',
            height: '10px',
            background: 'rgba(154,52,18,0.15)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${((120 - timeLeft) / 120) * 100}%`,
              background: 'linear-gradient(90deg, #F97316, #EA580C)',
              borderRadius: '999px',
              transition: 'width 1s linear',
              boxShadow: '0 0 10px rgba(249,115,22,0.5)',
            }} />
          </div>

          <p style={{
            margin: '14px 0 0', fontSize: '0.82rem',
            color: '#9A3412', fontWeight: '700', textAlign: 'center',
          }}>
            💡 Click "Cancel Refund" within the timer to stop the auto-refund
          </p>
        </div>
      )}

      {/* Auto-processing indicator */}
      {isScheduled && timeLeft === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
          border: '3px solid #3B82F6',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px', animation: 'spin 1s linear infinite' }}>⚡</div>
          <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1E40AF' }}>
            Auto-Processing Refund...
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#1E3A8A', fontWeight: '600' }}>
            Calling Razorpay API now. Please wait...
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>

        {/* ═════ LEFT COLUMN ═════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Refund Amount Card */}
          <div style={{
            background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
            border: '2px solid #10B981',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <p style={{
              margin: '0 0 6px', fontSize: '0.78rem', fontWeight: '800',
              color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.8px',
            }}>
              Refund Amount
            </p>
            <p style={{
              margin: 0, fontSize: '2.4rem', fontWeight: '900',
              color: '#10B981', lineHeight: 1,
            }}>
              ₹{refund.amount?.toLocaleString('en-IN')}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#047857', fontWeight: '700' }}>
              {statusCfg.desc}
            </p>
          </div>

          {/* Customer Info */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
              👤 Customer Details
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={labelTextStyle}>Name</span>
                <strong style={valueTextStyle}>{refund.user?.name || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={labelTextStyle}>Email</span>
                <a href={`mailto:${refund.user?.email}`} style={{
                  color: '#7B2FBE', textDecoration: 'none', fontWeight: '700', fontSize: '0.86rem',
                }}>
                  {refund.user?.email || '—'}
                </a>
              </div>
              {refund.user?.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={labelTextStyle}>Phone</span>
                  <a href={`tel:${refund.user.phone}`} style={{
                    color: '#7B2FBE', textDecoration: 'none', fontWeight: '700', fontSize: '0.86rem',
                  }}>
                    📞 {refund.user.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Refund Method */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: `2px solid ${isUPI ? '#10B981' : isBank ? '#3B82F6' : '#7B2FBE'}`,
            padding: '20px',
          }}>
            <h3 style={{
              margin: '0 0 14px', fontSize: '1rem', fontWeight: '800',
              color: isUPI ? '#10B981' : isBank ? '#3B82F6' : '#7B2FBE',
            }}>
              {isUPI && '📱 UPI Refund Details'}
              {isBank && '🏦 Bank Transfer Details'}
              {isRazorpay && '⚡ Razorpay Auto Refund'}
            </h3>

            {isUPI && refund.bankDetails?.upiId && (
              <div style={{
                padding: '14px 18px', background: '#ECFDF5',
                border: '1.5px solid #A7F3D0', borderRadius: '10px',
              }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.74rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>
                  UPI ID — Copy to send refund
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <code style={{
                    fontSize: '1.1rem', fontWeight: '800',
                    color: '#10B981', fontFamily: 'monospace', wordBreak: 'break-all',
                  }}>
                    {refund.bankDetails.upiId}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(refund.bankDetails.upiId);
                      toast.success('UPI ID copied!');
                    }}
                    style={{
                      padding: '4px 12px', background: '#10B981', color: 'white',
                      border: 'none', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '700',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            )}

            {isBank && refund.bankDetails && (
              <div style={{ display: 'grid', gap: '10px' }}>
                {refund.bankDetails.accountHolderName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={labelTextStyle}>Account Holder</span>
                    <strong style={valueTextStyle}>{refund.bankDetails.accountHolderName}</strong>
                  </div>
                )}
                {refund.bankDetails.accountNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={labelTextStyle}>Account Number</span>
                    <code style={{ fontWeight: '800', color: '#2D1A4A' }}>{refund.bankDetails.accountNumber}</code>
                  </div>
                )}
                {refund.bankDetails.ifscCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={labelTextStyle}>IFSC Code</span>
                    <code style={{ fontWeight: '800', color: '#2D1A4A' }}>{refund.bankDetails.ifscCode}</code>
                  </div>
                )}
                {refund.bankDetails.bankName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={labelTextStyle}>Bank Name</span>
                    <strong style={valueTextStyle}>{refund.bankDetails.bankName}</strong>
                  </div>
                )}
              </div>
            )}

            {isRazorpay && (
              <div style={{
                padding: '14px 18px', background: '#ECFDF5',
                border: '1.5px solid #A7F3D0', borderRadius: '10px',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.86rem', color: '#065F46', fontWeight: '700' }}>
                  ⚡ Auto-refund via Razorpay
                </p>
                {refund.razorpayRefundId && (
                  <code style={{ fontSize: '0.78rem', color: '#10B981', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {refund.razorpayRefundId}
                  </code>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          {refund.reason && (
            <div style={{
              background: 'white', borderRadius: '14px',
              border: '1.5px solid #EDD9FF', padding: '20px',
            }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
                📝 Reason
              </h3>
              <p style={{
                margin: 0, padding: '12px 14px',
                background: '#FBF7FF', borderRadius: '10px',
                color: '#6B4E8A', fontSize: '0.88rem', fontWeight: '600',
              }}>
                {refund.reason}
              </p>
            </div>
          )}

          {/* Order Info */}
          {refund.order && (
            <div style={{
              background: 'white', borderRadius: '14px',
              border: '1.5px solid #EDD9FF', padding: '20px',
            }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
                📦 Order Info
              </h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={labelTextStyle}>Order ID</span>
                  <Link href={`/admin/orders/${refund.orderId}`} style={{
                    color: '#7B2FBE', fontFamily: 'monospace', fontWeight: '800',
                    textDecoration: 'none', fontSize: '0.86rem',
                  }}>
                    #{refund.orderId?.slice(-12).toUpperCase()}
                  </Link>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={labelTextStyle}>Order Total</span>
                  <strong style={{ color: '#FF6B35', fontSize: '0.95rem' }}>
                    ₹{refund.order.totalPrice?.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={labelTextStyle}>Payment Method</span>
                  <strong style={valueTextStyle}>{refund.order.paymentMethod}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═════ RIGHT COLUMN — Actions ═════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Notes */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
          }}>
            <label style={{
              display: 'block', fontSize: '0.74rem', fontWeight: '800',
              color: '#7B2FBE', marginBottom: '6px', textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}>
              📝 Admin Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid #EDD9FF', borderRadius: '10px',
                fontFamily: 'inherit', fontSize: '0.84rem',
                resize: 'vertical', outline: 'none',
                boxSizing: 'border-box', color: '#2D1A4A',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
              ⚡ Admin Actions
            </h3>

            {/* PENDING — Show "Accept Return" button */}
            {isPending && (
              <>
                <div style={{
                  padding: '14px',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  marginBottom: '14px',
                }}>
                  <p style={{ margin: 0, fontSize: '0.86rem', color: '#92400E', fontWeight: '700' }}>
                    💡 Click "Accept Return" to schedule auto-refund in 2 minutes
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#A16207', fontWeight: '600' }}>
                    You can cancel anytime within 2 minutes window
                  </p>
                </div>

                <button
                  onClick={handleAcceptReturn}
                  disabled={updating}
                  style={{
                    width: '100%', padding: '16px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontWeight: '900', fontSize: '1.05rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                    marginBottom: '10px',
                    boxShadow: '0 8px 22px rgba(16,185,129,0.35)',
                  }}
                >
                  {updating ? '⏳ Scheduling...' : '✅ Accept Return & Auto-Refund'}
                </button>

                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  style={{
                    width: '100%', padding: '10px',
                    background: 'white', color: '#10B981',
                    border: '1.5px solid #A7F3D0', borderRadius: '10px',
                    fontWeight: '700', fontSize: '0.86rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                    marginBottom: '8px',
                  }}
                >
                  Or: Mark as Manually Completed
                </button>

                <button
                  onClick={() => handleStatusUpdate('failed')}
                  disabled={updating}
                  style={{
                    width: '100%', padding: '10px',
                    background: 'white', color: '#EF4444',
                    border: '1.5px solid #FCA5A5', borderRadius: '10px',
                    fontWeight: '700', fontSize: '0.86rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ❌ Reject / Mark Failed
                </button>
              </>
            )}

            {/* SCHEDULED — Info */}
            {isScheduled && timeLeft > 0 && (
              <div style={{
                padding: '14px', background: '#FFEDD5',
                border: '1.5px solid #FED7AA', borderRadius: '10px',
                textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#9A3412', fontWeight: '800' }}>
                  ⏱️ Refund is scheduled
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#7C2D12', fontWeight: '600' }}>
                  Use the big "Cancel Refund" button above to stop it
                </p>
              </div>
            )}

            {/* COMPLETED */}
            {isCompleted && (
              <div style={{
                padding: '24px', background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
                border: '2px solid #10B981', borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3.5rem' }}>✅</div>
                <p style={{ margin: '8px 0 0', fontSize: '1.2rem', color: '#065F46', fontWeight: '900' }}>
                  Refund Completed!
                </p>
                {refund.processedAt && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: '#047857', fontWeight: '700' }}>
                    {new Date(refund.processedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
                <p style={{ margin: '12px 0 0', fontSize: '0.78rem', color: '#065F46', fontWeight: '600' }}>
                  Customer received ₹{refund.amount?.toLocaleString('en-IN')}
                </p>
              </div>
            )}

            {/* PROCESSING */}
            {refund.refundStatus === 'processing' && (
              <div style={{
                padding: '24px', background: '#DBEAFE',
                border: '2px solid #3B82F6', borderRadius: '12px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem' }}>⚙️</div>
                <p style={{ margin: '8px 0 0', fontSize: '1.05rem', color: '#1E40AF', fontWeight: '800' }}>
                  Razorpay Processing
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#1E3A8A', fontWeight: '600' }}>
                  Money will reach customer in 2-3 hours
                </p>
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  style={{
                    marginTop: '14px',
                    padding: '10px 24px', background: '#10B981', color: 'white',
                    border: 'none', borderRadius: '10px', fontSize: '0.84rem',
                    fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✅ Confirm Completed
                </button>
              </div>
            )}

            {/* FAILED */}
            {isFailed && (
              <div style={{
                padding: '18px', background: '#FEE2E2',
                border: '1.5px solid #FCA5A5', borderRadius: '10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.5rem' }}>❌</div>
                <p style={{ margin: '8px 0 0', fontSize: '0.96rem', color: '#991B1B', fontWeight: '800' }}>
                  Refund Failed
                </p>
                {refund.notes && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#7F1D1D', fontWeight: '600' }}>
                    {refund.notes}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={handleAcceptReturn}
                    style={{
                      padding: '8px 20px', background: '#3B82F6', color: 'white',
                      border: 'none', borderRadius: '8px', fontSize: '0.82rem',
                      fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    🔄 Retry Auto-Refund
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    style={{
                      padding: '8px 20px', background: '#10B981', color: 'white',
                      border: 'none', borderRadius: '8px', fontSize: '0.82rem',
                      fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    ✅ Mark Completed
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.96rem', fontWeight: '800', color: '#2D1A4A' }}>
              🕒 Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TimelineItem label="Created" date={refund.createdAt} color="#7B2FBE" />
              {refund.scheduledAt && (
                <TimelineItem label="Scheduled" date={refund.scheduledAt} color="#F97316" />
              )}
              {refund.processedAt && (
                <TimelineItem label="Processed" date={refund.processedAt} color="#10B981" />
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 10px 30px rgba(249,115,22,0.20); }
          50% { box-shadow: 0 10px 40px rgba(249,115,22,0.40); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1.4fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const labelTextStyle = {
  fontSize: '0.82rem',
  color: '#9585B0',
  fontWeight: '600',
  margin: 0,
};

const valueTextStyle = {
  fontSize: '0.88rem',
  color: '#2D1A4A',
  fontWeight: '700',
};

function TimelineItem({ label, date, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '10px', height: '10px', borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#9585B0', fontWeight: '600' }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#2D1A4A', fontWeight: '700' }}>
          {new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}