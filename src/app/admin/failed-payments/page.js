'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

function fmtOrderNum(order) {
  return order.orderNumber
    ? `ABW-${order.orderNumber}`
    : `#${order.id?.slice(-8)?.toUpperCase()}`;
}

/* ══════════════════════════════════════════
   CONFIRM MANUAL PAYMENT MODAL
══════════════════════════════════════════ */
function ConfirmPaymentModal({ order, onClose, onSuccess }) {
  const [paymentMode,    setPaymentMode]    = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes,          setNotes]          = useState('');
  const [loading,        setLoading]        = useState(false);

  const PAYMENT_MODES = [
    { value: 'UPI',           label: '📱 UPI',            desc: 'PhonePe, GPay, Paytm, etc.' },
    { value: 'Cash',          label: '💵 Cash',           desc: 'Cash payment received' },
    { value: 'Bank Transfer', label: '🏦 Bank Transfer',  desc: 'NEFT/IMPS/RTGS' },
    { value: 'Cheque',        label: '📝 Cheque',         desc: 'Cheque received' },
    { value: 'Card',          label: '💳 Card Machine',   desc: 'POS/Card swipe' },
    { value: 'Other',         label: '💰 Other',          desc: 'Other payment method' },
  ];

  const handleConfirm = async () => {
    if (!paymentMode) {
      toast.error('Please select a payment mode');
      return;
    }

    if (!confirm(`Confirm payment of ₹${Math.round(order.totalPrice).toLocaleString('en-IN')} received via ${paymentMode}?\n\nThis will:\n✅ Mark order as PAID\n✅ Change status to Confirmed\n✅ Send confirmation email to customer\n✅ Move to main orders list`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm-manual-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMode,
          transactionRef: transactionRef.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('✅ Payment confirmed! Order moved to main list.', { duration: 4000 });
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm payment');
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
        width: '100%', maxWidth: '540px', maxHeight: '92vh',
        overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '2px solid #ECFDF5',
          background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
          borderRadius: '20px 20px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#065F46' }}>
              ✅ Confirm Manual Payment
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#047857', fontWeight: '700', fontFamily: 'monospace' }}>
              {fmtOrderNum(order)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'white', border: '1.5px solid #A7F3D0',
              width: '34px', height: '34px', borderRadius: '50%',
              cursor: 'pointer', color: '#065F46', fontSize: '1rem', fontWeight: '700',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Amount */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
            border: '1.5px solid #10B981',
            borderRadius: '12px', marginBottom: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>
                💰 Amount Received
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: '900', color: '#059669' }}>
                ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
              </p>
            </div>
            <span style={{ fontSize: '2.2rem' }}>💰</span>
          </div>

          {/* Customer Info */}
          <div style={{
            padding: '12px 14px', background: '#F9FAFB',
            border: '1.5px solid #E5E7EB', borderRadius: '10px',
            marginBottom: '18px',
          }}>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>
              👤 Customer
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '0.92rem', fontWeight: '700', color: '#1F2937' }}>
              {order.user?.name || order.shippingAddress?.name || 'Customer'}
            </p>
            {order.shippingAddress?.phone && (
              <p style={{ margin: '2px 0 0', fontSize: '0.80rem', color: '#6B7280', fontWeight: '600' }}>
                📞 {order.shippingAddress.phone}
              </p>
            )}
          </div>

          {/* Payment Mode */}
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#1F2937', marginBottom: '10px' }}>
            Payment Mode <span style={{ color: '#EF4444' }}>*</span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '16px' }}>
            {PAYMENT_MODES.map(mode => (
              <div
                key={mode.value}
                onClick={() => setPaymentMode(mode.value)}
                style={{
                  padding: '12px', textAlign: 'center',
                  background: paymentMode === mode.value ? '#F0FDF4' : 'white',
                  border: `2px solid ${paymentMode === mode.value ? '#10B981' : '#E5E7EB'}`,
                  borderRadius: '10px', cursor: 'pointer',
                  transition: 'all 0.2s', position: 'relative',
                }}
              >
                <p style={{
                  margin: 0, fontSize: '0.86rem', fontWeight: '800',
                  color: paymentMode === mode.value ? '#059669' : '#374151',
                }}>
                  {mode.label}
                </p>
                <p style={{
                  margin: '3px 0 0', fontSize: '0.68rem',
                  color: '#6B7280', fontWeight: '600',
                }}>
                  {mode.desc}
                </p>
                {paymentMode === mode.value && (
                  <div style={{
                    position: 'absolute', top: '6px', right: '6px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: '#10B981', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.66rem', fontWeight: '900',
                  }}>✓</div>
                )}
              </div>
            ))}
          </div>

          {/* Transaction Reference */}
          <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: '800', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
            📋 Transaction Reference (optional)
          </label>
          <input
            type="text"
            value={transactionRef}
            onChange={e => setTransactionRef(e.target.value)}
            placeholder={
              paymentMode === 'UPI'          ? 'e.g. UPI txn ID: 3245678910' :
              paymentMode === 'Bank Transfer' ? 'e.g. UTR / IMPS ref number' :
              paymentMode === 'Cheque'        ? 'e.g. Cheque number' :
              paymentMode === 'Card'          ? 'e.g. Card last 4 digits' :
              'Payment reference number'
            }
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid #E5E7EB', borderRadius: '10px',
              fontSize: '0.90rem', fontFamily: 'monospace',
              outline: 'none', marginBottom: '14px',
              boxSizing: 'border-box',
            }}
          />

          {/* Notes */}
          <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: '800', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
            📝 Admin Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Customer called at 3:30 PM, paid via GPay on 9876543210"
            rows={3}
            style={{
              width: '100%', padding: '10px 12px',
              border: '1.5px solid #E5E7EB', borderRadius: '10px',
              fontFamily: 'Nunito, sans-serif', fontSize: '0.86rem',
              resize: 'vertical', outline: 'none', marginBottom: '18px',
              boxSizing: 'border-box',
            }}
          />

          {/* Warning */}
          <div style={{
            padding: '12px 14px',
            background: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <p style={{ margin: 0, fontSize: '0.80rem', color: '#92400E', fontWeight: '700', lineHeight: 1.5 }}>
              Only confirm after you have <strong>ACTUALLY received the payment</strong>.
              This will move the order to your main orders list and send a confirmation email to the customer.
            </p>
          </div>

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
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                flex: 1.5, padding: '12px',
                background: loading ? '#A7F3D0' : 'linear-gradient(135deg, #10B981, #059669)',
                color: 'white', border: 'none', borderRadius: '10px',
                fontWeight: '800', cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'Nunito, sans-serif',
                boxShadow: '0 4px 12px rgba(16,185,129,0.30)',
              }}
            >
              {loading ? '⏳ Confirming...' : '✅ Confirm Payment Received'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function FailedPaymentsPage() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState({});
  const [processing,  setProcessing]  = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // ✅ Selected order for payment confirmation

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 15,
        paymentStatus: 'failed',
      });
      const res  = await fetch(`/api/orders?${params}`);
      const data = await res.json();

      // Filter to only unpaid failed orders
      const failedOnly = (data.orders || []).filter(
        o => !o.isPaid && o.paymentStatus === 'failed'
      );

      setOrders(failedOnly);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page]);

  const handleDelete = async (orderId, orderNum) => {
    if (!confirm(`Delete failed payment order ${orderNum}?\n\nThis cannot be undone.`)) return;

    setProcessing(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}?force=true`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      toast.success('✅ Order deleted');
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

 const handleMarkCancelled = async (orderId) => {
  if (!confirm('Mark this order as permanently cancelled?')) return;

  setProcessing(orderId);
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderStatus: 'Cancelled',
        paymentStatus: 'cancelled',   // ← important
        isCancelled: true,
        cancelReason: 'Payment failed — abandoned',
        cancelledAt: new Date(),
      }),
    });

    if (!res.ok) throw new Error('Failed to cancel');
    toast.success('✅ Order marked as cancelled');
    fetchOrders();
  } catch (err) {
    toast.error(err.message);
  } finally {
    setProcessing(null);
  }
};
  return (
    <div style={{ padding: '20px', fontFamily: 'Nunito, sans-serif' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Link
              href="/admin/orders"
              style={{
                padding: '6px 12px',
                background: '#F3F4F6',
                color: '#374151',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
              }}
            >
              ← Orders
            </Link>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', color: '#991B1B' }}>
              🚨 Failed Payments
            </h1>
          </div>
          <p style={{ margin: 0, color: '#9585B0', fontSize: '0.9rem' }}>
            {pagination.total || 0} order{pagination.total !== 1 ? 's' : ''} with failed payment
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
        border: '2px solid #EF4444',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
      }}>
        <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>ℹ️</span>
        <div>
          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#991B1B' }}>
            About Failed Payments
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#7F1D1D', fontWeight: '600', lineHeight: 1.5 }}>
            These are orders where the customer started checkout but the payment failed.
            If they call and pay via UPI/Cash/Bank Transfer, click <strong>"✅ Confirm Payment"</strong> to move the order to your main list.
          </p>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
          <p style={{ color: '#9CA3AF' }}>Loading failed payments...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          background: 'white',
          borderRadius: '16px',
          border: '2px solid #E5E7EB',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
          <h3 style={{ margin: '0 0 8px', color: '#065F46', fontSize: '1.4rem', fontWeight: '900' }}>
            No Failed Payments!
          </h3>
          <p style={{ margin: 0, color: '#6B7280' }}>
            All customer payments are successful. Great job!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map(order => (
            <div
              key={order.id}
              style={{
                background: 'white',
                border: '2px solid #FCA5A5',
                borderLeft: '6px solid #EF4444',
                borderRadius: '14px',
                padding: '18px 20px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '16px',
                alignItems: 'center',
                boxShadow: '0 2px 8px rgba(239,68,68,0.08)',
              }}
            >

              {/* Left — Order info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    style={{
                      fontWeight: '800',
                      color: '#7c3aed',
                      fontFamily: 'monospace',
                      textDecoration: 'none',
                      fontSize: '14px',
                      background: '#f3f0ff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    {fmtOrderNum(order)}
                  </Link>

                  <span style={{
                    padding: '3px 10px',
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid #FCA5A5',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    animation: 'pulseRed 2s ease-in-out infinite',
                  }}>
                    ❌ Payment Failed
                  </span>

                  <span style={{
                    fontSize: '0.72rem',
                    color: '#6B7280',
                    fontWeight: '600',
                  }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.70rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
                      Customer
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.88rem', fontWeight: '700', color: '#0F172A' }}>
                      {order.user?.name || 'Guest'}
                    </p>
                    {order.user?.email && (
                      <a
                        href={`mailto:${order.user.email}`}
                        style={{ fontSize: '0.76rem', color: '#7c3aed', textDecoration: 'none', display: 'block', marginTop: '2px' }}
                      >
                        ✉️ {order.user.email}
                      </a>
                    )}
                    {order.shippingAddress?.phone && (
                      <a
                        href={`tel:${order.shippingAddress.phone}`}
                        style={{ fontSize: '0.76rem', color: '#7c3aed', textDecoration: 'none', display: 'block', marginTop: '2px' }}
                      >
                        📞 {order.shippingAddress.phone}
                      </a>
                    )}
                  </div>

                  <div>
                    <p style={{ margin: 0, fontSize: '0.70rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
                      Amount
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '1.1rem', fontWeight: '900', color: '#DC2626' }}>
                      ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6B7280', fontWeight: '600' }}>
                      {order.orderItems?.length} item{order.orderItems?.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {order.notes && (
                    <div>
                      <p style={{ margin: 0, fontSize: '0.70rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>
                        Failure Reason
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#7F1D1D', fontWeight: '600', lineHeight: 1.4 }}>
                        {order.notes.replace('Payment failed: ', '')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>

                {/* ✅ NEW — Confirm Manual Payment (HIGHLIGHTED) */}
                <button
                  onClick={() => setConfirmModal(order)}
                  disabled={processing === order.id}
                  style={{
                    padding: '11px 16px',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontWeight: '900',
                    cursor: processing === order.id ? 'wait' : 'pointer',
                    opacity: processing === order.id ? 0.6 : 1,
                    fontFamily: 'Nunito, sans-serif',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.30)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  ✅ Confirm Payment
                </button>

                <Link
                  href={`/admin/orders/${order.id}`}
                  style={{
                    padding: '8px 14px',
                    background: '#7C3AED',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.80rem',
                    fontWeight: '800',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  👁️ View Details
                </Link>

                {order.user?.email && (
                  <a
                    href={`mailto:${order.user.email}?subject=Complete your order ${fmtOrderNum(order)}&body=Hi ${order.user?.name || 'Customer'},%0D%0A%0D%0AYour payment for order ${fmtOrderNum(order)} could not be completed.%0D%0A%0D%0APlease visit your order page to retry payment.`}
                    style={{
                      padding: '8px 14px',
                      background: '#0EA5E9',
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '0.80rem',
                      fontWeight: '800',
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    📧 Email Customer
                  </a>
                )}

                <button
                  onClick={() => handleMarkCancelled(order.id)}
                  disabled={processing === order.id}
                  style={{
                    padding: '8px 14px',
                    background: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.80rem',
                    fontWeight: '800',
                    cursor: processing === order.id ? 'wait' : 'pointer',
                    opacity: processing === order.id ? 0.6 : 1,
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  🚫 Mark Cancelled
                </button>

                <button
                  onClick={() => handleDelete(order.id, fmtOrderNum(order))}
                  disabled={processing === order.id}
                  style={{
                    padding: '8px 14px',
                    background: 'white',
                    color: '#DC2626',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: '8px',
                    fontSize: '0.80rem',
                    fontWeight: '800',
                    cursor: processing === order.id ? 'wait' : 'pointer',
                    opacity: processing === order.id ? 0.6 : 1,
                    fontFamily: 'Nunito, sans-serif',
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '10px',
          alignItems: 'center', marginTop: '24px',
        }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{
              padding: '8px 16px',
              background: page === 1 ? '#F3F4F6' : '#7C3AED',
              color: page === 1 ? '#9CA3AF' : 'white',
              border: 'none', borderRadius: '8px',
              fontWeight: '700', cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: '0.86rem', color: '#374151', fontWeight: '700' }}>
            Page {page} of {pagination.pages}
          </span>
          <button
            disabled={page === pagination.pages}
            onClick={() => setPage(p => p + 1)}
            style={{
              padding: '8px 16px',
              background: page === pagination.pages ? '#F3F4F6' : '#7C3AED',
              color: page === pagination.pages ? '#9CA3AF' : 'white',
              border: 'none', borderRadius: '8px',
              fontWeight: '700', cursor: page === pagination.pages ? 'not-allowed' : 'pointer',
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ✅ Confirm Payment Modal */}
      {confirmModal && (
        <ConfirmPaymentModal
          order={confirmModal}
          onClose={() => setConfirmModal(null)}
          onSuccess={() => {
            setConfirmModal(null);
            fetchOrders();
          }}
        />
      )}

      <style>{`
        @keyframes pulseRed {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50%      { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}