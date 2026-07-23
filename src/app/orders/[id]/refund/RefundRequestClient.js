'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RefundRequestClient({ id }) {
  const router = useRouter();

  const [order, setOrder]                 = useState(null);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [refundMethod, setRefundMethod]   = useState('');
  const [upiId, setUpiId]                 = useState('');
  const [bankDetails, setBankDetails]     = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  const [reason, setReason]               = useState('Refund requested by customer');
  const [customReason, setCustomReason]   = useState('');

  const REASONS = [
    { label: 'Refund requested by customer', emoji: '💰' },
    { label: 'Product not as expected',      emoji: '😕' },
    { label: 'Quality issue',                emoji: '⚠️' },
    { label: 'Wrong product delivered',      emoji: '📦' },
    { label: 'Damaged product',              emoji: '💔' },
    { label: 'No longer need it',            emoji: '🤔' },
    { label: 'Other',                        emoji: '✏️' },
  ];

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res  = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  /* ── Validation ── */
  const isValid =
    !!refundMethod &&
    !!(reason !== 'Other' ? reason : customReason.trim()) &&
    (refundMethod === 'upi'
      ? upiId.trim().length > 3
      : bankDetails.accountHolderName.trim() &&
        bankDetails.accountNumber.trim().length >= 9 &&
        bankDetails.ifscCode.trim().length === 11);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const finalReason = reason === 'Other' ? customReason : reason;

      const res = await fetch(`/api/orders/${id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: finalReason,
          refundMethod,
          ...(refundMethod === 'upi' ? { upiId } : { bankDetails }),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      toast.success('✅ Refund request submitted!', { duration: 4000 });

      if (data.refundInfo?.autoRefunded) {
        setTimeout(() => {
          toast.success(`⚡ Auto-refund initiated! ${data.refundInfo.estimatedTime}`, {
            duration: 5000,
          });
        }, 600);
      } else {
        setTimeout(() => {
          toast(`💰 Refund will be processed within ${data.refundInfo?.estimatedTime || '5–7 business days'}`, {
            duration: 5000,
            icon: '🏦',
          });
        }, 600);
      }

      setTimeout(() => router.push(`/orders/${id}`), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
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
          border: '4px solid #F3E8FF', borderTop: '4px solid #7B2FBE',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#9585B0', fontFamily: 'Nunito, sans-serif', fontWeight: '600' }}>
          Loading order...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Not found ── */
  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
        <h2 style={{ color: '#2D1A4A' }}>Order not found</h2>
        <Link href="/profile?tab=orders" style={{
          display: 'inline-block', marginTop: '16px', padding: '12px 28px',
          background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
          color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: '800',
        }}>
          ← Back to Orders
        </Link>
      </div>
    );
  }

  /* ── Eligibility ── */
  const isDelivered      = order.isDelivered || order.orderStatus === 'Delivered';
  const alreadyRequested = !!order.returnRequest;
  const isCancelled      = order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';

  if (!isDelivered) {
    return (
      <NotEligible
        icon="⏳"
        title="Order Not Delivered Yet"
        message="Refund can only be requested after delivery."
        orderId={id}
      />
    );
  }

  if (alreadyRequested) {
    return (
      <NotEligible
        icon="ℹ️"
        title="Refund Already Requested"
        message="You have already submitted a refund request for this order. Check status below."
        orderId={id}
      />
    );
  }

  if (isCancelled) {
    return (
      <NotEligible
        icon="❌"
        title="Order Cancelled"
        message="This order is already cancelled and cannot be refunded again."
        orderId={id}
      />
    );
  }

  /* ── Auto vs Manual indicator ── */
  const isRazorpayPaid = order.paymentMethod === 'Razorpay' && order.isPaid;

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '0.92rem',
    fontFamily: 'Nunito, sans-serif',
    outline: 'none',
    color: '#1F2937',
    background: 'white',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: '800',
    color: '#7B2FBE',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  };

  return (
    <div style={{
      maxWidth: '900px', margin: '0 auto',
      padding: 'clamp(24px,4vw,40px) 20px',
      fontFamily: 'Nunito, sans-serif',
    }}>

      {/* ── Back link ── */}
      <Link href={`/orders/${id}`} style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        color: '#7B2FBE', textDecoration: 'none', fontWeight: '700',
        fontSize: '0.88rem', marginBottom: '20px',
      }}>
        ← Back to Order
      </Link>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
        borderRadius: '24px', padding: 'clamp(24px,3vw,36px)',
        marginBottom: '24px',
        border: '1.5px solid #EDD9FF',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>💰</div>
        <h1 style={{
          fontSize: 'clamp(1.5rem,2.5vw,2rem)',
          fontWeight: '800', color: '#2D1A4A', margin: '0 0 6px',
        }}>
          Request Refund
        </h1>
        <p style={{ color: '#6B4E8A', margin: 0, fontSize: '0.92rem', fontWeight: '600' }}>
          Order #{order.id?.slice(-12).toUpperCase()}
        </p>
      </div>

      {/* ── Refund Amount Card ── */}
      <div style={{
        background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
        border: '2px solid #10B981',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <p style={{
            margin: '0 0 4px', fontSize: '0.78rem', fontWeight: '800',
            color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.8px',
          }}>
            Refund Amount
          </p>
          <p style={{
            margin: 0, fontSize: '2.2rem', fontWeight: '900',
            color: '#10B981', lineHeight: 1,
          }}>
            ₹{order.totalPrice?.toLocaleString('en-IN')}
          </p>
        </div>
        <div style={{ fontSize: '3rem' }}>💰</div>
      </div>

      {/* ── Auto-refund banner (Razorpay) ── */}
      {isRazorpayPaid && (
        <div style={{
          background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
          border: '2px solid #10B981',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <span style={{ fontSize: '2rem' }}>⚡</span>
          <div>
            <strong style={{ color: '#065F46', display: 'block', fontSize: '0.96rem' }}>
              Instant Auto-Refund
            </strong>
            <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#047857', fontWeight: '600' }}>
              Since you paid via Razorpay, refund will be initiated instantly to your original payment method (2–3 hours).
            </p>
          </div>
        </div>
      )}

      {/* ── Order Items ── */}
      <div style={{
        background: 'white', borderRadius: '20px', padding: '20px',
        marginBottom: '20px',
        border: '1.5px solid #F3E8FF',
        boxShadow: '0 4px 20px rgba(123,47,190,0.06)',
      }}>
        <h3 style={{
          margin: '0 0 16px', fontSize: '1rem', fontWeight: '800',
          color: '#2D1A4A',
        }}>
          🛍️ Items in this order ({order.orderItems?.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {order.orderItems?.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px', background: '#FAFAFA',
              borderRadius: '12px', border: '1px solid #F3E8FF',
            }}>
              <img
                src={item.image || 'https://via.placeholder.com/50'}
                alt={item.name}
                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.88rem', fontWeight: '700', color: '#2D1A4A',
                  margin: '0 0 2px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.name}
                </p>
                <p style={{ fontSize: '0.76rem', color: '#9585B0', margin: 0, fontWeight: '600' }}>
                  Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                </p>
              </div>
              <strong style={{ color: '#FF6B35', fontSize: '0.92rem' }}>
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reason Selection ── */}
      <div style={{
        background: 'white', borderRadius: '20px', padding: '24px',
        marginBottom: '20px',
        border: '1.5px solid #F3E8FF',
        boxShadow: '0 4px 20px rgba(123,47,190,0.06)',
      }}>
        <h3 style={{
          margin: '0 0 16px', fontSize: '1rem', fontWeight: '800',
          color: '#2D1A4A',
        }}>
          📝 Reason for Refund <span style={{ color: '#EF4444' }}>*</span>
        </h3>

        <div style={{ display: 'grid', gap: '8px' }}>
          {REASONS.map(({ label, emoji }) => {
            const selected = reason === label;
            return (
              <label key={label} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 16px',
                background: selected ? '#F5F3FF' : 'white',
                border: `1.5px solid ${selected ? '#7B2FBE' : '#E5E7EB'}`,
                borderRadius: '12px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                <input
                  type="radio" name="reason" value={label}
                  checked={selected} onChange={e => setReason(e.target.value)}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  border: `2px solid ${selected ? '#7B2FBE' : '#D1D5DB'}`,
                  background: selected ? '#7B2FBE' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}>
                  {selected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'white' }} />}
                </div>
                <span style={{ fontSize: '1.1rem' }}>{emoji}</span>
                <span style={{
                  fontSize: '0.92rem',
                  fontWeight: selected ? '800' : '600',
                  color: selected ? '#7B2FBE' : '#374151',
                }}>
                  {label}
                </span>
              </label>
            );
          })}
        </div>

        {reason === 'Other' && (
          <textarea
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            placeholder="Please describe your reason..."
            rows={3}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E5E7EB', borderRadius: '12px',
              fontFamily: 'Nunito, sans-serif', fontSize: '0.9rem',
              resize: 'vertical', outline: 'none', marginTop: '12px',
              boxSizing: 'border-box', color: '#1F2937',
            }}
          />
        )}
      </div>

      {/* ── Refund Method ── */}
      <div style={{
        background: 'white', borderRadius: '20px', padding: '24px',
        marginBottom: '20px',
        border: '1.5px solid #F3E8FF',
        boxShadow: '0 4px 20px rgba(123,47,190,0.06)',
      }}>
        <h3 style={{
          margin: '0 0 16px', fontSize: '1rem', fontWeight: '800',
          color: '#2D1A4A',
        }}>
          💳 Choose Refund Method <span style={{ color: '#EF4444' }}>*</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {/* UPI option */}
          <div
            onClick={() => setRefundMethod('upi')}
            style={{
              padding: '20px', textAlign: 'center',
              background: refundMethod === 'upi' ? '#F0FDF4' : 'white',
              border: `2px solid ${refundMethod === 'upi' ? '#10B981' : '#E5E7EB'}`,
              borderRadius: '14px', cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>📱</div>
            <p style={{
              margin: '0 0 6px', fontSize: '0.96rem', fontWeight: '800',
              color: refundMethod === 'upi' ? '#059669' : '#374151',
            }}>
              UPI ID
            </p>
            <span style={{
              display: 'inline-block', fontSize: '0.68rem', fontWeight: '800',
              background: '#D1FAE5', color: '#065F46',
              padding: '3px 10px', borderRadius: '999px', border: '1px solid #A7F3D0',
            }}>
              ⚡ Faster — 1–2 days
            </span>
            {refundMethod === 'upi' && (
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '24px', height: '24px', borderRadius: '50%',
                background: '#10B981', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: '900',
              }}>
                ✓
              </div>
            )}
          </div>

          {/* Bank option */}
          <div
            onClick={() => setRefundMethod('bank')}
            style={{
              padding: '20px', textAlign: 'center',
              background: refundMethod === 'bank' ? '#EFF6FF' : 'white',
              border: `2px solid ${refundMethod === 'bank' ? '#3B82F6' : '#E5E7EB'}`,
              borderRadius: '14px', cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
            }}
          >
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>🏦</div>
            <p style={{
              margin: '0 0 6px', fontSize: '0.96rem', fontWeight: '800',
              color: refundMethod === 'bank' ? '#1D4ED8' : '#374151',
            }}>
              Bank Account
            </p>
            <span style={{
              display: 'inline-block', fontSize: '0.68rem', fontWeight: '700',
              background: '#DBEAFE', color: '#1E40AF',
              padding: '3px 10px', borderRadius: '999px',
            }}>
              5–7 business days
            </span>
            {refundMethod === 'bank' && (
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                width: '24px', height: '24px', borderRadius: '50%',
                background: '#3B82F6', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: '900',
              }}>
                ✓
              </div>
            )}
          </div>
        </div>

        {/* UPI Form */}
        {refundMethod === 'upi' && (
          <div style={{
            padding: '20px', background: '#F0FDF4',
            border: '1.5px solid #BBF7D0', borderRadius: '14px',
          }}>
            <label style={labelStyle}>
              UPI ID <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              placeholder="yourname@upi (e.g. john@oksbi)"
              style={inputStyle}
            />
            <p style={{ fontSize: '0.76rem', color: '#065F46', margin: '8px 0 0', fontWeight: '600' }}>
              💡 Make sure UPI ID is correct. Refund cannot be reversed once initiated.
            </p>
          </div>
        )}

        {/* Bank Form */}
        {refundMethod === 'bank' && (
          <div style={{
            padding: '20px', background: '#EFF6FF',
            border: '1.5px solid #BFDBFE', borderRadius: '14px',
          }}>
            <div style={{ display: 'grid', gap: '14px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
      </div>

      {/* ── Action buttons ── */}
      <div style={{
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        position: 'sticky', bottom: '12px', zIndex: 10,
      }}>
        <Link href={`/orders/${id}`} style={{
          flex: '1 1 140px', padding: '14px',
          background: 'white', color: '#6B7280',
          border: '1.5px solid #E5E7EB', borderRadius: '12px',
          fontWeight: '700', fontSize: '0.95rem',
          textAlign: 'center', textDecoration: 'none',
        }}>
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          style={{
            flex: '2 1 220px', padding: '14px',
            background: isValid && !submitting
              ? 'linear-gradient(135deg, #7B2FBE, #9333EA)'
              : '#E5E7EB',
            color: isValid && !submitting ? 'white' : '#9CA3AF',
            border: 'none', borderRadius: '12px',
            fontWeight: '800', fontSize: '1rem',
            fontFamily: 'Nunito, sans-serif',
            cursor: isValid && !submitting ? 'pointer' : 'not-allowed',
            boxShadow: isValid && !submitting
              ? '0 8px 22px rgba(123,47,190,0.30)'
              : 'none',
          }}
        >
          {submitting ? '⏳ Submitting...' : '💰 Submit Refund Request'}
        </button>
      </div>

      <p style={{
        textAlign: 'center', marginTop: '16px',
        fontSize: '0.78rem', color: '#9585B0', fontWeight: '600',
      }}>
        🔒 Your bank/UPI details are securely encrypted and never shared.
      </p>
    </div>
  );
}

/* ── Reusable: Not Eligible message ── */
function NotEligible({ icon, title, message, orderId }) {
  return (
    <div style={{
      maxWidth: '600px', margin: '0 auto',
      padding: '60px 20px', textAlign: 'center',
      fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>{icon}</div>
      <h2 style={{ color: '#2D1A4A', fontSize: '1.5rem', margin: '0 0 12px' }}>{title}</h2>
      <p style={{ color: '#6B4E8A', margin: '0 0 24px', fontSize: '0.94rem' }}>{message}</p>
      <Link href={`/orders/${orderId}`} style={{
        display: 'inline-block', padding: '14px 32px',
        background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
        color: 'white', borderRadius: '12px', textDecoration: 'none',
        fontWeight: '800', fontSize: '0.95rem',
      }}>
        ← Back to Order
      </Link>
    </div>
  );
}