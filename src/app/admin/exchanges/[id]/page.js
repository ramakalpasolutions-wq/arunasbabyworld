'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:           { label: 'Pending Approval',  color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
  approved:          { label: 'Approved',          color: '#3B82F6', bg: '#DBEAFE', icon: '✅' },
  picked_up:         { label: 'Picked Up',         color: '#8B5CF6', bg: '#EDE9FE', icon: '📦' },
  received:          { label: 'Received',          color: '#6366F1', bg: '#E0E7FF', icon: '📬' },
  verified:          { label: 'Verified',          color: '#10B981', bg: '#D1FAE5', icon: '🔍' },
  awaiting_payment:  { label: 'Awaiting Payment',  color: '#F97316', bg: '#FFEDD5', icon: '💳' },
  ready_to_ship:     { label: 'Ready to Ship',     color: '#10B981', bg: '#D1FAE5', icon: '🎁' },
  shipped:           { label: 'Shipped',           color: '#06B6D4', bg: '#CFFAFE', icon: '🚚' },
  completed:         { label: 'Completed',         color: '#10B981', bg: '#D1FAE5', icon: '🎉' },
  rejected:          { label: 'Rejected',          color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
};

const WORKFLOW_STEPS = [
  { key: 'pending',       label: 'Requested',      icon: '📝' },
  { key: 'approved',      label: 'Approved',       icon: '✅' },
  { key: 'picked_up',     label: 'Picked Up',      icon: '📦' },
  { key: 'received',      label: 'Received',       icon: '📬' },
  { key: 'verified',      label: 'Verified',       icon: '🔍' },
  { key: 'shipped',       label: 'Shipped',        icon: '🚚' },
  { key: 'completed',     label: 'Completed',      icon: '🎉' },
];

export default function AdminExchangeDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [exchange, setExchange]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(false);
  const [adminNotes, setAdminNotes]           = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [pickupTracking, setPickupTracking]   = useState('');
  const [shipmentTracking, setShipmentTracking] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showShipModal, setShowShipModal]     = useState(false);

  useEffect(() => { fetchExchange(); }, [id]);

  const fetchExchange = async () => {
    try {
      const res  = await fetch(`/api/exchanges/${id}`);
      const data = await res.json();
      if (data.exchange) {
        setExchange(data.exchange);
        setAdminNotes(data.exchange.adminNotes || '');
        setPickupTracking(data.exchange.pickupTracking || '');
        setShipmentTracking(data.exchange.shipmentTracking || '');
      }
    } catch (err) {
      toast.error('Failed to load exchange');
    } finally {
      setLoading(false);
    }
  };

  /* ── Approve ── */
  const handleApprove = async () => {
    if (!confirm('Approve this exchange request?')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('✅ Exchange approved! Customer notified.');
      fetchExchange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  /* ── Mark as picked up ── */
  const handlePickedUp = async () => {
    if (!pickupTracking.trim()) {
      toast.error('Please enter pickup tracking number');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'picked_up',
          pickupTracking,
          adminNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('📦 Marked as picked up!');
      fetchExchange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  /* ── Mark as received ── */
  const handleReceived = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'received',
          adminNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('📬 Marked as received!');
      fetchExchange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  /* ── Verify (approve/reject after inspection) ── */
  const handleVerify = async (approved) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          adminNotes,
          rejectionReason: !approved ? rejectionReason : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(approved
        ? '🔍 Verified! Ready to ship.'
        : '❌ Exchange rejected.');
      setShowVerifyModal(false);
      fetchExchange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  /* ── Ship new product ── */
  const handleShip = async () => {
    if (!shipmentTracking.trim()) {
      toast.error('Please enter tracking number');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber: shipmentTracking }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('🚚 New product shipped! Customer notified.');
      setShowShipModal(false);
      fetchExchange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  /* ── Mark as completed ── */
  const handleComplete = async () => {
    if (!confirm('Mark this exchange as completed?')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          adminNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('🎉 Exchange completed!');
      fetchExchange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  /* ── Reject ── */
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter rejection reason');
      return;
    }
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason,
          adminNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('❌ Exchange rejected');
      setShowRejectModal(false);
      fetchExchange();
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
        <p style={{ fontWeight: '700' }}>Loading exchange...</p>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>❌</div>
        <h2 style={{ color: '#2D1A4A' }}>Exchange not found</h2>
        <Link href="/admin/exchanges" style={{
          display: 'inline-block', marginTop: '12px',
          padding: '10px 24px', background: '#7B2FBE',
          color: 'white', borderRadius: '10px',
          textDecoration: 'none', fontWeight: '700',
        }}>
          ← Back to Exchanges
        </Link>
      </div>
    );
  }

  const statusCfg        = STATUS_CONFIG[exchange.status] || STATUS_CONFIG.pending;
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.key === exchange.status);
  const isPending        = exchange.status === 'pending';
  const isApproved       = exchange.status === 'approved';
  const isPickedUp       = exchange.status === 'picked_up';
  const isReceived       = exchange.status === 'received';
  const isAwaitingPayment = exchange.status === 'awaiting_payment';
  const isReadyToShip    = exchange.status === 'ready_to_ship';
  const isShipped        = exchange.status === 'shipped';
  const isCompleted      = exchange.status === 'completed';
  const isRejected       = exchange.status === 'rejected';

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', padding: '4px' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <Link href="/admin/exchanges" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#7B2FBE', textDecoration: 'none', fontWeight: '700',
            fontSize: '0.84rem', marginBottom: '10px',
          }}>
            ← Back to Exchanges
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0 0 4px', color: '#2D1A4A' }}>
            Exchange #{exchange.id?.slice(-8).toUpperCase()}
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '0.84rem', fontWeight: '600' }}>
            Created {new Date(exchange.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px',
          background: statusCfg.bg, color: statusCfg.color,
          borderRadius: '999px', fontWeight: '800', fontSize: '0.92rem',
          border: `1.5px solid ${statusCfg.color}30`,
        }}>
          {statusCfg.icon} {statusCfg.label}
        </span>
      </div>

      {/* ── Workflow Progress ── */}
      {!isRejected && (
        <div style={{
          background: 'white', borderRadius: '14px',
          border: '1.5px solid #EDD9FF',
          padding: '20px', marginBottom: '20px',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
            🛠️ Workflow Progress
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            overflowX: 'auto',
            gap: '4px',
          }}>
            {WORKFLOW_STEPS.map((step, i) => {
              const isDone    = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.key} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '6px',
                  flex: 1, minWidth: '80px',
                  position: 'relative',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: isDone
                      ? 'linear-gradient(135deg, #10B981, #059669)'
                      : isCurrent
                        ? `linear-gradient(135deg, ${statusCfg.color}, ${statusCfg.color}CC)`
                        : '#E5E7EB',
                    color: isDone || isCurrent ? 'white' : '#9CA3AF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '900', fontSize: '0.96rem',
                    boxShadow: isCurrent ? `0 0 0 5px ${statusCfg.color}22` : 'none',
                  }}>
                    {isDone ? '✓' : step.icon}
                  </div>
                  <p style={{
                    margin: 0, fontSize: '0.74rem',
                    fontWeight: isCurrent ? '800' : isDone ? '700' : '600',
                    color: isCurrent ? statusCfg.color : isDone ? '#10B981' : '#9CA3AF',
                    textAlign: 'center',
                  }}>
                    {step.label}
                  </p>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '20px', left: '60%', right: '-40%',
                      height: '2px',
                      background: isDone ? '#10B981' : '#E5E7EB',
                      zIndex: -1,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>

        {/* ═════ LEFT COLUMN ═════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Product Comparison */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
              🔄 Product Exchange
            </h3>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr auto 1fr',
              gap: '14px', alignItems: 'center',
            }}>
              {/* OLD */}
              <div style={{
                padding: '14px', background: '#FEF2F2',
                border: '2px solid #FCA5A5', borderRadius: '14px',
                textAlign: 'center',
              }}>
                <span style={{
                  display: 'inline-block', fontSize: '0.66rem', fontWeight: '800',
                  background: '#EF4444', color: 'white',
                  padding: '3px 10px', borderRadius: '999px', marginBottom: '10px',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                }}>
                  ↩️ Returning
                </span>
                <img
                  src={exchange.oldProductImage || 'https://via.placeholder.com/80'}
                  alt={exchange.oldProductName}
                  style={{
                    width: '80px', height: '80px',
                    objectFit: 'cover', borderRadius: '10px',
                    margin: '0 auto 8px', display: 'block',
                  }}
                />
                <p style={{
                  margin: '0 0 4px', fontSize: '0.86rem',
                  fontWeight: '800', color: '#7F1D1D',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {exchange.oldProductName}
                </p>
                <strong style={{ color: '#DC2626', fontSize: '1.1rem' }}>
                  ₹{exchange.oldPrice?.toLocaleString('en-IN')}
                </strong>
                <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#7F1D1D', fontWeight: '600' }}>
                  Qty: {exchange.oldQuantity}
                </p>
              </div>

              <div style={{ fontSize: '2.5rem', color: '#7B2FBE', fontWeight: '900' }}>→</div>

              {/* NEW */}
              <div style={{
                padding: '14px', background: '#ECFDF5',
                border: '2px solid #A7F3D0', borderRadius: '14px',
                textAlign: 'center',
              }}>
                <span style={{
                  display: 'inline-block', fontSize: '0.66rem', fontWeight: '800',
                  background: '#10B981', color: 'white',
                  padding: '3px 10px', borderRadius: '999px', marginBottom: '10px',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                }}>
                  📦 Replace With
                </span>
                <img
                  src={exchange.newProductImage || 'https://via.placeholder.com/80'}
                  alt={exchange.newProductName}
                  style={{
                    width: '80px', height: '80px',
                    objectFit: 'cover', borderRadius: '10px',
                    margin: '0 auto 8px', display: 'block',
                  }}
                />
                <p style={{
                  margin: '0 0 4px', fontSize: '0.86rem',
                  fontWeight: '800', color: '#065F46',
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {exchange.newProductName}
                </p>
                <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>
                  ₹{exchange.newPrice?.toLocaleString('en-IN')}
                </strong>
                {exchange.newProduct?.stock !== undefined && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#065F46', fontWeight: '600' }}>
                    {exchange.newProduct.stock} in stock
                  </p>
                )}
              </div>
            </div>

            {/* Price difference */}
            {exchange.priceDifference !== 0 && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: exchange.priceDifference > 0 ? '#FFFBEB' : '#F0F9FF',
                border: `1.5px solid ${exchange.priceDifference > 0 ? '#FDE68A' : '#BFDBFE'}`,
                borderRadius: '10px',
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
                        ? 'Customer must pay extra'
                        : 'Refunded to customer'}
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

            {/* Payment status */}
            {exchange.priceDifference > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: exchange.paymentStatus === 'paid' ? '#ECFDF5' : '#FEF3C7',
                border: `1px solid ${exchange.paymentStatus === 'paid' ? '#A7F3D0' : '#FDE68A'}`,
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '8px',
              }}>
                <span style={{
                  fontSize: '0.84rem', fontWeight: '800',
                  color: exchange.paymentStatus === 'paid' ? '#065F46' : '#92400E',
                }}>
                  💳 Payment: {exchange.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                </span>
                {exchange.paymentLinkUrl && exchange.paymentStatus !== 'paid' && (
                  <a href={exchange.paymentLinkUrl} target="_blank" rel="noopener noreferrer" style={{
                    padding: '6px 14px',
                    background: '#F97316', color: 'white',
                    borderRadius: '8px', textDecoration: 'none',
                    fontWeight: '700', fontSize: '0.76rem',
                  }}>
                    🔗 View Payment Link
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Customer & Reason */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
              👤 Customer & Reason
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={labelTextStyle}>Name</span>
                <strong style={valueTextStyle}>{exchange.user?.name || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={labelTextStyle}>Email</span>
                <a href={`mailto:${exchange.user?.email}`} style={{
                  color: '#7B2FBE', textDecoration: 'none', fontWeight: '700', fontSize: '0.86rem',
                }}>
                  {exchange.user?.email || '—'}
                </a>
              </div>
              {exchange.user?.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={labelTextStyle}>Phone</span>
                  <a href={`tel:${exchange.user.phone}`} style={{
                    color: '#7B2FBE', textDecoration: 'none', fontWeight: '700', fontSize: '0.86rem',
                  }}>
                    📞 {exchange.user.phone}
                  </a>
                </div>
              )}
            </div>

            <div style={{
              marginTop: '14px', padding: '12px 14px',
              background: '#FBF7FF', borderRadius: '10px',
            }}>
              <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: '800', color: '#7B2FBE', textTransform: 'uppercase' }}>
                📝 Reason
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#2D1A4A', fontWeight: '600' }}>
                {exchange.reason}
              </p>
              {exchange.description && (
                <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#6B4E8A', fontWeight: '600', fontStyle: 'italic' }}>
                  "{exchange.description}"
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {exchange.order?.shippingAddress && (
            <div style={{
              background: 'white', borderRadius: '14px',
              border: '1.5px solid #EDD9FF', padding: '20px',
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
                📍 Pickup & Delivery Address
              </h3>
              <div style={{
                padding: '12px 14px',
                background: '#FAFAFA', borderRadius: '10px',
                lineHeight: 1.7,
              }}>
                <p style={{ margin: 0, fontWeight: '800', color: '#2D1A4A', fontSize: '0.94rem' }}>
                  {exchange.order.shippingAddress.name}
                </p>
                <p style={{ margin: '2px 0', fontSize: '0.84rem', color: '#6B4E8A', fontWeight: '600' }}>
                  📞 {exchange.order.shippingAddress.phone}
                </p>
                <p style={{ margin: '2px 0', fontSize: '0.84rem', color: '#6B4E8A', fontWeight: '600' }}>
                  🏠 {exchange.order.shippingAddress.address}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#6B4E8A', fontWeight: '600' }}>
                  {exchange.order.shippingAddress.city}, {exchange.order.shippingAddress.state} — {exchange.order.shippingAddress.pincode}
                </p>
              </div>
            </div>
          )}

          {/* Tracking Numbers */}
          {(exchange.pickupTracking || exchange.shipmentTracking) && (
            <div style={{
              background: 'white', borderRadius: '14px',
              border: '1.5px solid #EDD9FF', padding: '20px',
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
                📦 Tracking
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {exchange.pickupTracking && (
                  <div style={{
                    padding: '10px 14px', background: '#EDE9FE',
                    border: '1px solid #DDD6FE', borderRadius: '10px',
                  }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: '800', color: '#6D28D9', textTransform: 'uppercase' }}>
                      📦 Pickup Tracking
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.92rem', fontWeight: '800', color: '#5B21B6', fontFamily: 'monospace' }}>
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
                    <p style={{ margin: '4px 0 0', fontSize: '0.92rem', fontWeight: '800', color: '#155E75', fontFamily: 'monospace' }}>
                      {exchange.shipmentTracking}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {isRejected && exchange.rejectionReason && (
            <div style={{
              background: '#FEF2F2', borderRadius: '14px',
              border: '1.5px solid #FCA5A5', padding: '16px 20px',
            }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.96rem', fontWeight: '800', color: '#DC2626' }}>
                ❌ Rejection Reason
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#991B1B', fontWeight: '600' }}>
                {exchange.rejectionReason}
              </p>
            </div>
          )}
        </div>

        {/* ═════ RIGHT COLUMN — Actions ═════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Admin Notes */}
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
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Internal notes about this exchange..."
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

          {/* Action Buttons — Based on status */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
            position: 'sticky', top: '16px',
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: '800', color: '#2D1A4A' }}>
              ⚡ Actions
            </h3>

            {/* PENDING */}
            {isPending && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={handleApprove} disabled={updating} style={primaryBtn('#10B981', '#059669')}>
                  {updating ? '⏳ Approving...' : '✅ Approve Exchange'}
                </button>
                <button onClick={() => setShowRejectModal(true)} disabled={updating} style={secondaryBtn('#EF4444', '#FCA5A5')}>
                  ❌ Reject
                </button>
              </div>
            )}

            {/* APPROVED → Mark Picked Up */}
            {isApproved && (
              <>
                <p style={infoText}>📦 Customer notified. Arrange pickup and enter tracking number.</p>
                <input
                  type="text"
                  value={pickupTracking}
                  onChange={e => setPickupTracking(e.target.value)}
                  placeholder="Pickup tracking number"
                  style={inputStyle}
                />
                <button onClick={handlePickedUp} disabled={updating} style={primaryBtn('#8B5CF6', '#7C3AED')}>
                  {updating ? '⏳ Updating...' : '📦 Mark as Picked Up'}
                </button>
              </>
            )}

            {/* PICKED UP → Mark Received */}
            {isPickedUp && (
              <>
                <p style={infoText}>📬 Mark as received when product arrives at warehouse.</p>
                <button onClick={handleReceived} disabled={updating} style={primaryBtn('#6366F1', '#4F46E5')}>
                  {updating ? '⏳ Updating...' : '📬 Mark as Received'}
                </button>
              </>
            )}

            {/* RECEIVED → Verify */}
            {isReceived && (
              <>
                <p style={infoText}>🔍 Inspect the returned product. Approve or reject based on condition.</p>
                <button onClick={() => setShowVerifyModal(true)} disabled={updating} style={primaryBtn('#10B981', '#059669')}>
                  🔍 Verify Product
                </button>
              </>
            )}

            {/* AWAITING PAYMENT */}
            {isAwaitingPayment && (
              <>
                <p style={infoText}>💳 Waiting for customer to pay price difference.</p>
                {exchange.paymentLinkUrl && (
                  <a href={exchange.paymentLinkUrl} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', width: '100%', padding: '12px',
                    background: 'linear-gradient(135deg, #F97316, #EA580C)',
                    color: 'white', borderRadius: '10px',
                    textDecoration: 'none', textAlign: 'center',
                    fontWeight: '800', fontSize: '0.9rem', boxSizing: 'border-box',
                  }}>
                    🔗 View Payment Link
                  </a>
                )}
              </>
            )}

            {/* READY TO SHIP */}
            {isReadyToShip && (
              <>
                <p style={infoText}>🎁 Pack and ship the new product to customer.</p>
                <button onClick={() => setShowShipModal(true)} disabled={updating} style={primaryBtn('#10B981', '#059669')}>
                  🚚 Ship New Product
                </button>
              </>
            )}

            {/* SHIPPED → Complete */}
            {isShipped && (
              <>
                <p style={infoText}>🚚 Product shipped. Mark as completed once delivered.</p>
                <button onClick={handleComplete} disabled={updating} style={primaryBtn('#10B981', '#059669')}>
                  {updating ? '⏳ Updating...' : '🎉 Mark as Completed'}
                </button>
              </>
            )}

            {/* COMPLETED */}
            {isCompleted && (
              <div style={{
                padding: '20px', textAlign: 'center',
                background: '#ECFDF5', border: '1.5px solid #A7F3D0',
                borderRadius: '10px',
              }}>
                <div style={{ fontSize: '2.5rem' }}>🎉</div>
                <p style={{ margin: '8px 0 0', fontSize: '1rem', fontWeight: '800', color: '#065F46' }}>
                  Exchange Completed!
                </p>
                {exchange.completedAt && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#047857', fontWeight: '600' }}>
                    {new Date(exchange.completedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}

            {/* REJECTED */}
            {isRejected && (
              <div style={{
                padding: '20px', textAlign: 'center',
                background: '#FEF2F2', border: '1.5px solid #FCA5A5',
                borderRadius: '10px',
              }}>
                <div style={{ fontSize: '2.5rem' }}>❌</div>
                <p style={{ margin: '8px 0 0', fontSize: '1rem', fontWeight: '800', color: '#991B1B' }}>
                  Exchange Rejected
                </p>
                {exchange.rejectedAt && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#7F1D1D', fontWeight: '600' }}>
                    {new Date(exchange.rejectedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #EDD9FF', padding: '20px',
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '0.96rem', fontWeight: '800', color: '#2D1A4A' }}>
              🕒 Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <TimelineItem label="Created"   date={exchange.createdAt}   color="#F59E0B" />
              {exchange.approvedAt   && <TimelineItem label="Approved"    date={exchange.approvedAt}   color="#3B82F6" />}
              {exchange.pickedUpAt   && <TimelineItem label="Picked Up"   date={exchange.pickedUpAt}   color="#8B5CF6" />}
              {exchange.receivedAt   && <TimelineItem label="Received"    date={exchange.receivedAt}   color="#6366F1" />}
              {exchange.verifiedAt   && <TimelineItem label="Verified"    date={exchange.verifiedAt}   color="#10B981" />}
              {exchange.shippedAt    && <TimelineItem label="Shipped"     date={exchange.shippedAt}    color="#06B6D4" />}
              {exchange.completedAt  && <TimelineItem label="Completed"   date={exchange.completedAt}  color="#10B981" />}
              {exchange.rejectedAt   && <TimelineItem label="Rejected"    date={exchange.rejectedAt}   color="#EF4444" />}
            </div>
          </div>
        </div>
      </div>

      {/* ── REJECT MODAL ── */}
      {showRejectModal && (
        <Modal onClose={() => setShowRejectModal(false)} title="❌ Reject Exchange">
          <p style={{ margin: '0 0 14px', fontSize: '0.86rem', color: '#6B4E8A' }}>
            Please provide a reason for rejecting this exchange. The customer will be notified.
          </p>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={4}
            style={inputStyle}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button onClick={() => setShowRejectModal(false)} style={cancelBtn}>Cancel</button>
            <button onClick={handleReject} disabled={updating || !rejectionReason.trim()} style={primaryBtn('#EF4444', '#DC2626')}>
              {updating ? '⏳' : '❌ Reject'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── VERIFY MODAL ── */}
      {showVerifyModal && (
        <Modal onClose={() => setShowVerifyModal(false)} title="🔍 Verify Returned Product">
          <p style={{ margin: '0 0 14px', fontSize: '0.86rem', color: '#6B4E8A' }}>
            Did the returned product pass inspection?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => handleVerify(true)} disabled={updating} style={primaryBtn('#10B981', '#059669')}>
              ✅ Approve — Product in Good Condition
            </button>
            <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: '#9585B0', fontWeight: '600', textAlign: 'center' }}>
              OR
            </p>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (e.g., damaged, used, missing parts)..."
              rows={3}
              style={inputStyle}
            />
            <button onClick={() => handleVerify(false)} disabled={updating || !rejectionReason.trim()} style={secondaryBtn('#EF4444', '#FCA5A5')}>
              ❌ Reject — Product Damaged/Used
            </button>
          </div>
          <button onClick={() => setShowVerifyModal(false)} style={{ ...cancelBtn, marginTop: '12px' }}>
            Cancel
          </button>
        </Modal>
      )}

      {/* ── SHIP MODAL ── */}
      {showShipModal && (
        <Modal onClose={() => setShowShipModal(false)} title="🚚 Ship New Product">
          <p style={{ margin: '0 0 14px', fontSize: '0.86rem', color: '#6B4E8A' }}>
            Enter the tracking number for the new product shipment.
          </p>
          <input
            type="text"
            value={shipmentTracking}
            onChange={e => setShipmentTracking(e.target.value)}
            placeholder="e.g. DTDC123456789"
            style={inputStyle}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <button onClick={() => setShowShipModal(false)} style={cancelBtn}>Cancel</button>
            <button onClick={handleShip} disabled={updating || !shipmentTracking.trim()} style={primaryBtn('#10B981', '#059669')}>
              {updating ? '⏳' : '🚚 Ship Now'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1.4fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1fr auto 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Helpers ── */
const labelTextStyle = { fontSize: '0.82rem', color: '#9585B0', fontWeight: '600', margin: 0 };
const valueTextStyle = { fontSize: '0.88rem', color: '#2D1A4A', fontWeight: '700' };

const infoText = {
  margin: '0 0 14px',
  padding: '10px 12px',
  background: '#F5F3FF',
  borderRadius: '8px',
  fontSize: '0.82rem',
  color: '#6D28D9',
  fontWeight: '600',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #EDD9FF',
  borderRadius: '10px',
  fontFamily: 'inherit',
  fontSize: '0.88rem',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#2D1A4A',
  marginBottom: '10px',
  resize: 'vertical',
};

const primaryBtn = (color1, color2) => ({
  width: '100%', padding: '12px',
  background: `linear-gradient(135deg, ${color1}, ${color2})`,
  color: 'white', border: 'none', borderRadius: '10px',
  fontWeight: '800', fontSize: '0.9rem',
  cursor: 'pointer', fontFamily: 'inherit',
});

const secondaryBtn = (color, border) => ({
  width: '100%', padding: '12px',
  background: 'white', color,
  border: `1.5px solid ${border}`, borderRadius: '10px',
  fontWeight: '800', fontSize: '0.9rem',
  cursor: 'pointer', fontFamily: 'inherit',
});

const cancelBtn = {
  flex: 1, padding: '12px',
  background: 'white', color: '#6B7280',
  border: '1.5px solid #E5E7EB', borderRadius: '10px',
  fontWeight: '700', fontSize: '0.88rem',
  cursor: 'pointer', fontFamily: 'inherit',
};

function TimelineItem({ label, date, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#9585B0', fontWeight: '600' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#2D1A4A', fontWeight: '700' }}>
          {new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div style={{
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
        borderRadius: '16px',
        width: '100%', maxWidth: '460px',
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1.5px solid #F3E8FF',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#2D1A4A' }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            background: '#F3F4F6', border: 'none', borderRadius: '8px',
            width: '32px', height: '32px', cursor: 'pointer',
            fontSize: '1rem', color: '#6B7280',
          }}>
            ✕
          </button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}