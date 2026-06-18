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
  Pending:           '#f59e0b',
  Confirmed:         '#3b82f6',
  Processing:        '#8b5cf6',
  Shipped:           '#06b6d4',
  Delivered:         '#10b981',
  Cancelled:         '#ef4444',
  Refunded:          '#6b7280',
  Return_Requested:  '#f97316',
};

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export default function AdminOrderDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [order, setOrder] = useState(null);
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try {
      const res  = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setOrder(data.order);
      setNewStatus(data.order?.orderStatus || '');
      setTrackingNumber(data.order?.trackingNumber || '');

      // Also fetch refund if exists
      if (data.order?.refundId) {
        const refundRes = await fetch(`/api/refunds?limit=200`);
        const refundData = await refundRes.json();
        const found = (refundData.refunds || []).find(r => r.orderId === id);
        if (found) {
          setRefund(found);
          setAdminNotes(found.notes || '');
        }
      } else {
        // Try to find any refund for this order
        const refundRes = await fetch(`/api/refunds?limit=200`);
        const refundData = await refundRes.json();
        const found = (refundData.refunds || []).find(r => r.orderId === id);
        if (found) {
          setRefund(found);
          setAdminNotes(found.notes || '');
        }
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: newStatus,
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

  /* ── Accept Return ── */
  const handleAcceptReturn = async () => {
    if (!confirm('Accept this return request? You will need to arrange pickup.')) return;

    setProcessingRefund(true);
    try {
      // Update order status to indicate return accepted
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: 'Return_Requested',
          notes: 'Return accepted by admin. Pickup will be arranged.',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('✅ Return accepted! Customer notified.');
      fetchOrder();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingRefund(false);
    }
  };

  /* ── Initiate Refund (manual completion) ── */
  const handleProcessRefund = async (status) => {
    if (!refund) {
      toast.error('No refund record found');
      return;
    }

    const action = status === 'completed' ? 'mark as completed' : status === 'processing' ? 'mark as processing' : 'mark as failed';
    if (!confirm(`Are you sure you want to ${action} this refund?`)) return;

    setProcessingRefund(true);
    try {
      const res = await fetch('/api/refunds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId: refund.id,
          refundStatus: status,
          notes: adminNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update order status to Refunded if refund completed
      if (status === 'completed') {
        await fetch(`/api/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderStatus: 'Refunded' }),
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

  /* ── Reject Return ── */
  const handleRejectReturn = async () => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason?.trim()) return;

    setProcessingRefund(true);
    try {
      // Update order back to Delivered + clear return request
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: 'Delivered',
          returnRequest: null,
          returnStatus: 'rejected',
          notes: `Return rejected: ${reason}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Also mark refund as failed if exists
      if (refund) {
        await fetch('/api/refunds', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refundId: refund.id,
            refundStatus: 'failed',
            notes: `Return rejected: ${reason}`,
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #fce4ec', borderTop: '4px solid #ff6b9d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#888' }}>Loading order details...</p>
    </div>
  );

  if (!order) return (
    <div className={styles.notFound}>
      <span>📦</span>
      <h2>Order not found</h2>
      <button className="btn btn-outline" onClick={() => router.back()}>← Go Back</button>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'Cancelled' || order.orderStatus === 'Refunded';
  const isReturnRequested = order.orderStatus === 'Return_Requested' || !!order.returnRequest;
  const hasRefund = !!refund;
  const returnReq = order.returnRequest;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Order #{order.id?.slice(-8)?.toUpperCase()}</h1>
          <p>
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            padding: '6px 16px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '14px',
            background: `${STATUS_COLOR[order.orderStatus] || '#888'}20`,
            color: STATUS_COLOR[order.orderStatus] || '#888',
          }}>
            {order.orderStatus?.replace('_', ' ')}
          </span>
          <button className="btn btn-outline" onClick={() => router.back()}>
            ← Back to Orders
          </button>
        </div>
      </div>

      {/* ✅ NEW: RETURN REQUEST BANNER (Top Priority!) */}
      {isReturnRequested && returnReq && (
        <div style={{
          background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
          border: '2px solid #F97316',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(249,115,22,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', color: 'white', flexShrink: 0,
            }}>
              🔄
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px', color: '#9A3412', fontSize: '1.15rem', fontWeight: '800' }}>
                Return Request Received
              </h3>
              <p style={{ margin: 0, color: '#7C2D12', fontSize: '0.9rem', fontWeight: '600' }}>
                Customer wants to return this order. Review details below and take action.
              </p>
            </div>
            <span style={{
              padding: '6px 14px',
              background: 'white',
              color: '#F97316',
              border: '2px solid #FDBA74',
              borderRadius: '999px',
              fontSize: '0.78rem', fontWeight: '800',
            }}>
              ⏳ Pending Action
            </span>
          </div>

          {/* Return Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}>
            {/* Reason */}
            <div style={{ padding: '12px 14px', background: 'white', borderRadius: '10px', border: '1.5px solid #FED7AA' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#9A3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📝 Return Reason
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#7C2D12', fontWeight: '700' }}>
                {returnReq.reason}
              </p>
            </div>

            {/* Refund Method */}
            <div style={{
              padding: '12px 14px',
              background: 'white',
              borderRadius: '10px',
              border: `1.5px solid ${returnReq.refundMethod === 'upi' ? '#A7F3D0' : '#BFDBFE'}`,
            }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: returnReq.refundMethod === 'upi' ? '#065F46' : '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {returnReq.refundMethod === 'upi' ? '📱 UPI Refund' : '🏦 Bank Refund'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: returnReq.refundMethod === 'upi' ? '#10B981' : '#3B82F6', fontWeight: '700', fontFamily: 'monospace' }}>
                {returnReq.refundMethod === 'upi'
                  ? returnReq.upiId
                  : `${returnReq.accountNumberMasked} · ${returnReq.ifscCode}`}
              </p>
            </div>

            {/* Refund Amount */}
            <div style={{ padding: '12px 14px', background: 'white', borderRadius: '10px', border: '1.5px solid #A7F3D0' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💰 Refund Amount
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '1.1rem', color: '#10B981', fontWeight: '900' }}>
                ₹{order.totalPrice?.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Status */}
            <div style={{ padding: '12px 14px', background: 'white', borderRadius: '10px', border: '1.5px solid #FED7AA' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#9A3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🟡 Current Status
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#F97316', fontWeight: '800' }}>
                {refund?.refundStatus || returnReq.status || 'Under Review'}
              </p>
            </div>
          </div>

          {/* Bank Details (if bank refund) */}
          {returnReq.refundMethod === 'bank' && (
            <div style={{
              padding: '14px',
              background: 'white',
              borderRadius: '10px',
              marginBottom: '16px',
              border: '1.5px solid #BFDBFE',
            }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: '800', color: '#1E40AF' }}>
                🏦 Bank Account Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#6B7280' }}>Account Holder</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.86rem', fontWeight: '700', color: '#2D1A4A' }}>
                    {returnReq.accountHolderName}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#6B7280' }}>IFSC Code</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.86rem', fontWeight: '700', color: '#2D1A4A', fontFamily: 'monospace' }}>
                    {returnReq.ifscCode}
                  </p>
                </div>
                {returnReq.bankName && (
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#6B7280' }}>Bank Name</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.86rem', fontWeight: '700', color: '#2D1A4A' }}>
                      {returnReq.bankName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* UPI Details */}
          {returnReq.refundMethod === 'upi' && (
            <div style={{
              padding: '14px',
              background: 'white',
              borderRadius: '10px',
              marginBottom: '16px',
              border: '1.5px solid #A7F3D0',
              display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '1.5rem' }}>📱</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '800', color: '#065F46', textTransform: 'uppercase' }}>
                  Send Refund to UPI ID
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '1.1rem', fontWeight: '800', color: '#10B981', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {returnReq.upiId}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(returnReq.upiId);
                  toast.success('UPI ID copied!');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                📋 Copy
              </button>
            </div>
          )}

          {/* Auto-refund info if Razorpay */}
          {hasRefund && refund.refundType === 'razorpay' && (
            <div style={{
              padding: '12px 14px',
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              borderRadius: '10px',
              marginBottom: '16px',
            }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#065F46', fontWeight: '800' }}>
                ⚡ Razorpay Auto-Refund Already Initiated
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#047857', fontWeight: '600' }}>
                Refund ID: <code>{refund.razorpayRefundId}</code> · Status: {refund.refundStatus}
              </p>
            </div>
          )}

          {/* ⚡ ACTION BUTTONS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1.5px solid #FED7AA',
          }}>
            {/* Step 1: Accept Return (if not yet refunded) */}
            {refund?.refundStatus === 'pending' && (
              <button
                onClick={() => handleProcessRefund('processing')}
                disabled={processingRefund}
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                {processingRefund ? '⏳ Processing...' : '⚙️ Mark as Processing'}
              </button>
            )}

            {/* Step 2: Mark as Completed */}
            {refund && refund.refundStatus !== 'completed' && refund.refundStatus !== 'failed' && (
              <button
                onClick={() => handleProcessRefund('completed')}
                disabled={processingRefund}
                style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                {processingRefund ? '⏳ Processing...' : '✅ Mark Refund Completed'}
              </button>
            )}

            {/* Reject Return */}
            {refund?.refundStatus !== 'completed' && (
              <button
                onClick={handleRejectReturn}
                disabled={processingRefund}
                style={{
                  padding: '12px 16px',
                  background: 'white',
                  color: '#EF4444',
                  border: '2px solid #FCA5A5',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                ❌ Reject Return
              </button>
            )}

            {/* View in Refunds Page */}
            {refund && (
              <Link
                href={`/admin/refunds/${refund.id}`}
                style={{
                  padding: '12px 16px',
                  background: 'white',
                  color: '#7B2FBE',
                  border: '2px solid #DDD6FE',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontFamily: 'Nunito, sans-serif',
                }}
              >
                👁️ View Full Refund Details
              </Link>
            )}
          </div>

          {/* Status indicator if completed */}
          {refund?.refundStatus === 'completed' && (
            <div style={{
              marginTop: '16px',
              padding: '14px',
              background: '#ECFDF5',
              border: '2px solid #10B981',
              borderRadius: '10px',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#065F46' }}>
                ✅ Refund Completed Successfully
              </p>
              {refund.processedAt && (
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#047857', fontWeight: '600' }}>
                  Processed on {new Date(refund.processedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
          )}

          {/* Admin Notes */}
          <div style={{ marginTop: '16px' }}>
            <label style={{
              display: 'block', fontSize: '0.74rem', fontWeight: '800',
              color: '#9A3412', marginBottom: '6px', textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}>
              📝 Admin Notes (Optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Add notes about this refund (e.g., transaction reference, courier name, etc.)"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid #FED7AA',
                borderRadius: '8px',
                fontFamily: 'Nunito, sans-serif',
                fontSize: '0.86rem',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#7C2D12',
                background: 'white',
              }}
            />
          </div>
        </div>
      )}

      {/* ORDER PROGRESS TRACKER */}
      {!isCancelled && !isReturnRequested && (
        <div className={styles.tracker}>
          <h3>Order Progress</h3>
          <div className={styles.steps}>
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className={styles.stepWrap}>
                <div
                  className={styles.stepCircle}
                  style={{
                    background: i <= currentStep ? STATUS_COLOR[order.orderStatus] : '#e5e7eb',
                    color: i <= currentStep ? 'white' : '#999',
                  }}
                >
                  {i < currentStep ? '✓' : ['📋', '✅', '⚙️', '🚚', '🎉'][i]}
                </div>
                <span
                  className={styles.stepLabel}
                  style={{ color: i <= currentStep ? STATUS_COLOR[order.orderStatus] : '#999' }}
                >
                  {step}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={styles.stepLine}
                    style={{ background: i < currentStep ? STATUS_COLOR[order.orderStatus] : '#e5e7eb' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '24px' }}>❌</span>
          <div>
            <strong>Order {order.orderStatus}</strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
              This order has been {order.orderStatus.toLowerCase()}.
            </p>
          </div>
        </div>
      )}

      <div className={styles.grid}>

        {/* ===== LEFT COLUMN ===== */}
        <div className={styles.mainCol}>

          {/* Order Items */}
          <div className={styles.card}>
            <h3>🛍️ Order Items ({order.orderItems?.length})</h3>
            {order.orderItems?.map((item, i) => (
              <div key={i} className={styles.item}>
                <img src={item.image || 'https://via.placeholder.com/60'} alt={item.name} className={styles.itemImg} />
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemSub}>
                    Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className={styles.itemTotal}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Customer Details */}
          <div className={styles.card}>
            <h3>👤 Customer Details</h3>
            <div className={styles.detailGrid}>
              <div>
                <label>Name</label>
                <p>{order.user?.name || '—'}</p>
              </div>
              <div>
                <label>Email</label>
                <p>
                  <a href={`mailto:${order.user?.email}`} style={{ color: '#7c3aed', textDecoration: 'none' }}>
                    {order.user?.email || '—'}
                  </a>
                </p>
              </div>
              <div>
                <label>Phone</label>
                <p>
                  {order.shippingAddress?.phone ? (
                    <a href={`tel:${order.shippingAddress.phone}`} style={{ color: '#7c3aed', textDecoration: 'none' }}>
                      📞 {order.shippingAddress.phone}
                    </a>
                  ) : '—'}
                </p>
              </div>
              <div>
                <label>Payment Status</label>
                <p style={{ color: order.isPaid ? '#10b981' : '#f59e0b', fontWeight: '700' }}>
                  {order.isPaid
                    ? `✅ Paid on ${new Date(order.paidAt).toLocaleDateString('en-IN')}`
                    : '⏳ Pending'}
                </p>
              </div>
              <div>
                <label>Payment Method</label>
                <p>{order.paymentMethod || 'Razorpay'}</p>
              </div>
              {order.paymentResult?.razorpayPaymentId && (
                <div>
                  <label>Transaction ID</label>
                  <p style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {order.paymentResult.razorpayPaymentId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className={styles.card}>
            <h3>📍 Shipping Address {isReturnRequested && '(Pickup From Here)'}</h3>
            {order.shippingAddress ? (
              <div className={styles.address}>
                <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>
                  {order.shippingAddress.name}
                </p>
                <p>📞 {order.shippingAddress.phone}</p>
                <p>🏠 {order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                </p>
              </div>
            ) : (
              <p style={{ color: '#888' }}>No address on record</p>
            )}
          </div>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className={styles.sideCol}>

          {/* Price Summary */}
          <div className={styles.card}>
            <h3>💰 Price Summary</h3>
            <div className={styles.priceRows}>
              <div className={styles.priceRow}>
                <span>Items ({order.orderItems?.reduce((a, i) => a + i.quantity, 0)})</span>
                <span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Shipping</span>
                <span style={{ color: order.shippingPrice === 0 ? '#10b981' : 'inherit' }}>
                  {order.shippingPrice === 0 ? '🎉 FREE' : `₹${order.shippingPrice}`}
                </span>
              </div>
              <div className={styles.priceRow}>
                <span>Tax (5%)</span>
                <span>₹{order.taxPrice?.toLocaleString('en-IN')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className={`${styles.priceRow} ${styles.discountRow}`}>
                  <span>Coupon ({order.couponCode})</span>
                  <span>− ₹{order.discountAmount?.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className={styles.totalRow}>
              <span>Total</span>
              <strong style={{ color: '#ff6b9d', fontSize: '1.2rem' }}>
                ₹{order.totalPrice?.toLocaleString('en-IN')}
              </strong>
            </div>
            {order.refundAmount > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: order.refundStatus === 'completed' ? '#D1FAE5' : '#FEF3C7',
                borderRadius: '10px',
                border: `1.5px solid ${order.refundStatus === 'completed' ? '#10B981' : '#F59E0B'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.85rem', color: order.refundStatus === 'completed' ? '#065F46' : '#92400E', fontWeight: '700' }}>
                  💰 Refund Amount
                </span>
                <strong style={{ fontSize: '1rem', color: order.refundStatus === 'completed' ? '#10B981' : '#F59E0B' }}>
                  ₹{order.refundAmount?.toLocaleString('en-IN')}
                </strong>
              </div>
            )}
          </div>

          {/* Update Order */}
          {!isReturnRequested && (
            <div className={styles.card}>
              <h3>🔄 Update Order</h3>
              <div className="form-group">
                <label>Order Status</label>
                <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Tracking Number (optional)</label>
                <input
                  className="form-control"
                  value={trackingNumber}
                  onChange={e => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DTDC123456789"
                />
                <small style={{ color: '#888', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Customer will receive email with tracking info
                </small>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleUpdate} disabled={updating}>
                {updating ? '⏳ Updating...' : '💾 Update & Notify Customer'}
              </button>
              <p style={{ fontSize: '11px', color: '#888', textAlign: 'center', marginTop: '8px' }}>
                📧 Customer will be notified by email
              </p>
            </div>
          )}

          {/* Quick Links */}
          {refund && (
            <div className={styles.card} style={{ background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)' }}>
              <h3 style={{ color: '#7B2FBE' }}>🔗 Quick Links</h3>
              <Link
                href={`/admin/refunds/${refund.id}`}
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  background: 'white',
                  color: '#7B2FBE',
                  border: '1.5px solid #DDD6FE',
                  borderRadius: '10px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontWeight: '800',
                  fontSize: '0.86rem',
                  marginBottom: '8px',
                }}
              >
                💰 View Refund #{refund.id?.slice(-8).toUpperCase()}
              </Link>
              <Link
                href="/admin/refunds"
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  background: 'white',
                  color: '#7B2FBE',
                  border: '1.5px solid #DDD6FE',
                  borderRadius: '10px',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontWeight: '800',
                  fontSize: '0.86rem',
                }}
              >
                📊 All Refunds Dashboard
              </Link>
            </div>
          )}

          {/* Tracking Info */}
          {order.trackingNumber && (
            <div className={styles.card} style={{ background: '#e0f2fe', border: '1px solid #7dd3fc' }}>
              <h3 style={{ color: '#0369a1' }}>📦 Tracking Info</h3>
              <p style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0369a1', fontSize: '15px' }}>
                {order.trackingNumber}
              </p>
            </div>
          )}

          {/* Delivered */}
          {order.isDelivered && !isReturnRequested && (
            <div className={styles.card} style={{ background: '#d1fae5', border: '1px solid #6ee7b7' }}>
              <h3 style={{ color: '#065f46' }}>🎉 Delivered</h3>
              <p style={{ color: '#047857', fontSize: '13px' }}>
                Delivered on {order.deliveredAt
                  ? new Date(order.deliveredAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}