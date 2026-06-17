'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      color: '#F59E0B', bg: '#FEF3C7', icon: '🟡', desc: 'Waiting for action' },
  processing:   { label: 'Processing',   color: '#3B82F6', bg: '#DBEAFE', icon: '⚙️', desc: 'Refund being processed' },
  completed:    { label: 'Completed',    color: '#10B981', bg: '#D1FAE5', icon: '✅', desc: 'Refund successfully sent' },
  failed:       { label: 'Failed',       color: '#EF4444', bg: '#FEE2E2', icon: '❌', desc: 'Refund failed' },
  not_required: { label: 'Not Required', color: '#6B7280', bg: '#F3F4F6', icon: 'ℹ️', desc: 'No refund needed' },
};

export default function AdminRefundDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [refund, setRefund]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes]       = useState('');

  useEffect(() => { fetchRefund(); }, [id]);

  const fetchRefund = async () => {
    try {
      // Fetch all refunds and find the one we need (since we have list endpoint only)
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
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!confirm(`Are you sure you want to mark this refund as ${newStatus}?`)) return;

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

      toast.success(`✅ Refund marked as ${newStatus}`);
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

  const statusCfg     = STATUS_CONFIG[refund.refundStatus] || STATUS_CONFIG.pending;
  const isUPI         = refund.refundType === 'upi_transfer';
  const isBank        = refund.refundType === 'bank_transfer';
  const isRazorpay    = refund.refundType === 'razorpay';
  const needsAction   = refund.refundStatus === 'pending' || refund.refundStatus === 'processing';

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
            Created on {new Date(refund.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
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
                  color: '#7B2FBE', textDecoration: 'none',
                  fontWeight: '700', fontSize: '0.86rem',
                }}>
                  {refund.user?.email || '—'}
                </a>
              </div>
              {refund.user?.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={labelTextStyle}>Phone</span>
                  <a href={`tel:${refund.user.phone}`} style={{
                    color: '#7B2FBE', textDecoration: 'none',
                    fontWeight: '700', fontSize: '0.86rem',
                  }}>
                    📞 {refund.user.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Refund Method Details */}
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
              {!isUPI && !isBank && !isRazorpay && 'ℹ️ Refund Info'}
            </h3>

            {/* UPI */}
            {isUPI && refund.bankDetails?.upiId && (
              <>
                <div style={{
                  padding: '14px 18px',
                  background: '#ECFDF5',
                  border: '1.5px solid #A7F3D0',
                  borderRadius: '10px',
                  marginBottom: '12px',
                }}>
                  <p style={{ margin: '0 0 6px', fontSize: '0.74rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>
                    UPI ID — Copy to send refund
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <code style={{
                      fontSize: '1.1rem', fontWeight: '800',
                      color: '#10B981', fontFamily: 'monospace',
                      wordBreak: 'break-all',
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
              </>
            )}

            {/* Bank */}
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <code style={{ fontWeight: '800', color: '#2D1A4A' }}>{refund.bankDetails.accountNumber}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(refund.bankDetails.accountNumber);
                          toast.success('Account number copied!');
                        }}
                        style={{
                          padding: '3px 10px', background: '#3B82F6', color: 'white',
                          border: 'none', borderRadius: '5px', fontSize: '0.72rem', fontWeight: '700',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        📋
                      </button>
                    </div>
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

            {/* Razorpay */}
            {isRazorpay && (
              <div style={{
                padding: '14px 18px',
                background: '#ECFDF5',
                border: '1.5px solid #A7F3D0',
                borderRadius: '10px',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.86rem', color: '#065F46', fontWeight: '700' }}>
                  ⚡ Auto-refunded via Razorpay API
                </p>
                {refund.razorpayRefundId && (
                  <>
                    <p style={labelTextStyle}>Razorpay Refund ID:</p>
                    <code style={{ fontSize: '0.78rem', color: '#10B981', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {refund.razorpayRefundId}
                    </code>
                  </>
                )}
                {refund.razorpayPaymentId && (
                  <>
                    <p style={{ ...labelTextStyle, marginTop: '8px' }}>Payment ID:</p>
                    <code style={{ fontSize: '0.78rem', color: '#10B981', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {refund.razorpayPaymentId}
                    </code>
                  </>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={labelTextStyle}>Delivered</span>
                  <strong style={{ color: refund.order.isDelivered ? '#10B981' : '#F59E0B' }}>
                    {refund.order.isDelivered ? '✅ Yes' : '⏳ No'}
                  </strong>
                </div>
                {refund.order.shippingAddress && (
                  <div style={{
                    marginTop: '10px', padding: '12px',
                    background: '#FAFAFA', borderRadius: '10px',
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.74rem', fontWeight: '800', color: '#9585B0', textTransform: 'uppercase' }}>
                      📍 Shipping Address
                    </p>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#2D1A4A', fontWeight: '600', lineHeight: 1.6 }}>
                      <strong>{refund.order.shippingAddress.name}</strong><br />
                      📞 {refund.order.shippingAddress.phone}<br />
                      {refund.order.shippingAddress.address},<br />
                      {refund.order.shippingAddress.city}, {refund.order.shippingAddress.state} — {refund.order.shippingAddress.pincode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═════ RIGHT COLUMN — Actions ═════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Admin Actions */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
            position: 'sticky', top: '16px',
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
              ⚡ Admin Actions
            </h3>

            {/* Notes textarea */}
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
              placeholder="Add internal notes (e.g. transaction reference, contact details)..."
              rows={4}
              style={{
                width: '100%', padding: '10px 12px',
                border: '1.5px solid #EDD9FF', borderRadius: '10px',
                fontFamily: 'inherit', fontSize: '0.84rem',
                resize: 'vertical', outline: 'none',
                boxSizing: 'border-box', color: '#2D1A4A',
                marginBottom: '14px',
              }}
            />

            {/* Action buttons */}
            {needsAction && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {refund.refundStatus === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('processing')}
                    disabled={updating}
                    style={{
                      width: '100%', padding: '12px',
                      background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                      color: 'white', border: 'none', borderRadius: '10px',
                      fontWeight: '800', fontSize: '0.9rem',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {updating ? '⏳ Updating...' : '⚙️ Mark as Processing'}
                  </button>
                )}

                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updating}
                  style={{
                    width: '100%', padding: '12px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    fontWeight: '800', fontSize: '0.9rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {updating ? '⏳ Updating...' : '✅ Mark as Completed'}
                </button>

                <button
                  onClick={() => handleStatusUpdate('failed')}
                  disabled={updating}
                  style={{
                    width: '100%', padding: '12px',
                    background: 'white', color: '#EF4444',
                    border: '1.5px solid #FCA5A5', borderRadius: '10px',
                    fontWeight: '800', fontSize: '0.9rem',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ❌ Mark as Failed
                </button>
              </div>
            )}

            {refund.refundStatus === 'completed' && (
              <div style={{
                padding: '14px 16px',
                background: '#ECFDF5', border: '1.5px solid #A7F3D0',
                borderRadius: '10px', textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#065F46', fontWeight: '800' }}>
                  ✅ Refund Completed
                </p>
                {refund.processedAt && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#047857', fontWeight: '600' }}>
                    {new Date(refund.processedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}

            {refund.refundStatus === 'failed' && (
              <div style={{
                padding: '14px 16px',
                background: '#FEE2E2', border: '1.5px solid #FCA5A5',
                borderRadius: '10px', textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#991B1B', fontWeight: '800' }}>
                  ❌ Refund Failed
                </p>
                <button
                  onClick={() => handleStatusUpdate('processing')}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px', background: '#3B82F6', color: 'white',
                    border: 'none', borderRadius: '8px', fontSize: '0.78rem',
                    fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  🔄 Retry
                </button>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.96rem', fontWeight: '800', color: '#2D1A4A' }}>
              🕒 Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TimelineItem
                label="Created"
                date={refund.createdAt}
                color="#7B2FBE"
              />
              {refund.processedAt && (
                <TimelineItem
                  label="Processed"
                  date={refund.processedAt}
                  color="#10B981"
                />
              )}
              {refund.updatedAt && refund.updatedAt !== refund.createdAt && (
                <TimelineItem
                  label="Last Updated"
                  date={refund.updatedAt}
                  color="#3B82F6"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1.4fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Helpers ── */
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