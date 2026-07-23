// src/app/admin/exchanges/[id]/page.js
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:          { label: 'Pending Approval', color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
  approved:         { label: 'Approved',         color: '#3B82F6', bg: '#DBEAFE', icon: '✅' },
  picked_up:        { label: 'Picked Up',        color: '#8B5CF6', bg: '#EDE9FE', icon: '📦' },
  received:         { label: 'Received',         color: '#6366F1', bg: '#E0E7FF', icon: '📬' },
  verified:         { label: 'Verified',         color: '#10B981', bg: '#D1FAE5', icon: '🔍' },
  awaiting_payment: { label: 'Awaiting Payment', color: '#F97316', bg: '#FFEDD5', icon: '💳' },
  ready_to_ship:    { label: 'Ready to Ship',    color: '#10B981', bg: '#D1FAE5', icon: '🎁' },
  shipped:          { label: 'Shipped',          color: '#06B6D4', bg: '#CFFAFE', icon: '🚚' },
  completed:        { label: 'Completed',        color: '#10B981', bg: '#D1FAE5', icon: '🎉' },
  rejected:         { label: 'Rejected',         color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
};

const WORKFLOW_STEPS = [
  { key: 'pending',   label: 'Requested', icon: '📝' },
  { key: 'approved',  label: 'Approved',  icon: '✅' },
  { key: 'picked_up', label: 'Picked Up', icon: '📦' },
  { key: 'received',  label: 'Received',  icon: '📬' },
  { key: 'verified',  label: 'Verified',  icon: '🔍' },
  { key: 'shipped',   label: 'Shipped',   icon: '🚚' },
  { key: 'completed', label: 'Completed', icon: '🎉' },
];

export default function AdminExchangeDetail({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [exchange,         setExchange]         = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [updating,         setUpdating]         = useState(false);
  const [adminNotes,       setAdminNotes]       = useState('');
  const [rejectionReason,  setRejectionReason]  = useState('');
  const [pickupTracking,   setPickupTracking]   = useState('');
  const [shipmentTracking, setShipmentTracking] = useState('');
  const [showRejectModal,  setShowRejectModal]  = useState(false);
  const [showVerifyModal,  setShowVerifyModal]  = useState(false);
  const [showShipModal,    setShowShipModal]    = useState(false);

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
    } catch {
      toast.error('Failed to load exchange');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

  const handlePickedUp = async () => {
    if (!pickupTracking.trim()) return toast.error('Please enter pickup tracking number');
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'picked_up', pickupTracking, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('📦 Marked as picked up!');
      fetchExchange();
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

  const handleReceived = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'received', adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('📬 Marked as received!');
      fetchExchange();
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

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
      toast.success(approved ? '🔍 Verified! Ready to ship.' : '❌ Exchange rejected.');
      setShowVerifyModal(false);
      fetchExchange();
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

  const handleShip = async () => {
    if (!shipmentTracking.trim()) return toast.error('Please enter tracking number');
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
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this exchange as completed?')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('🎉 Exchange completed!');
      fetchExchange();
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return toast.error('Please enter rejection reason');
    setUpdating(true);
    try {
      const res = await fetch(`/api/exchanges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('❌ Exchange rejected');
      setShowRejectModal(false);
      fetchExchange();
    } catch (err) { toast.error(err.message); }
    finally { setUpdating(false); }
  };

  if (loading) {
    return (
      <div className="exd-loading">
        <div className="exd-loading-icon">⏳</div>
        <p>Loading exchange...</p>
      </div>
    );
  }

  if (!exchange) {
    return (
      <div className="exd-notfound">
        <div className="exd-notfound-icon">❌</div>
        <h2>Exchange not found</h2>
        <Link href="/admin/exchanges" className="exd-back-link">
          ← Back to Exchanges
        </Link>
      </div>
    );
  }

  const cfg              = STATUS_CONFIG[exchange.status] || STATUS_CONFIG.pending;
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.key === exchange.status);
  const isPending         = exchange.status === 'pending';
  const isApproved        = exchange.status === 'approved';
  const isPickedUp        = exchange.status === 'picked_up';
  const isReceived        = exchange.status === 'received';
  const isAwaitingPayment = exchange.status === 'awaiting_payment';
  const isReadyToShip     = exchange.status === 'ready_to_ship';
  const isShipped         = exchange.status === 'shipped';
  const isCompleted       = exchange.status === 'completed';
  const isRejected        = exchange.status === 'rejected';

  return (
    <div className="exd-page">

      {/* HEADER */}
      <div className="exd-header">
        <div className="exd-header-left">
          <Link href="/admin/exchanges" className="exd-back-link">
            ← Back to Exchanges
          </Link>
          <h1 className="exd-title">
            Exchange #{exchange.id?.slice(-8).toUpperCase()}
          </h1>
          <p className="exd-subtitle">
            Created {new Date(exchange.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <span className="exd-status-pill" style={{
          background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}30`,
        }}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* WORKFLOW */}
      {!isRejected && (
        <div className="exd-card">
          <h3 className="exd-card-title">🛠️ Workflow Progress</h3>
          <div className="exd-workflow">
            {WORKFLOW_STEPS.map((step, i) => {
              const isDone    = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.key} className="exd-step">
                  <div className="exd-step-circle" style={{
                    background: isDone
                      ? 'linear-gradient(135deg,#10B981,#059669)'
                      : isCurrent
                        ? `linear-gradient(135deg,${cfg.color},${cfg.color}CC)`
                        : '#E5E7EB',
                    color: (isDone || isCurrent) ? 'white' : '#9CA3AF',
                    boxShadow: isCurrent ? `0 0 0 5px ${cfg.color}22` : 'none',
                  }}>
                    {isDone ? '✓' : step.icon}
                  </div>
                  <p className="exd-step-label" style={{
                    color: isCurrent ? cfg.color : isDone ? '#10B981' : '#9CA3AF',
                    fontWeight: isCurrent ? 800 : isDone ? 700 : 600,
                  }}>
                    {step.label}
                  </p>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className="exd-step-line" style={{
                      background: isDone ? '#10B981' : '#E5E7EB',
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="exd-grid">

        {/* LEFT */}
        <div className="exd-col">

          {/* Product Exchange */}
          <div className="exd-card">
            <h3 className="exd-card-title">🔄 Product Exchange</h3>

            <div className="exd-products-grid">
              <div className="exd-product exd-product-old">
                <span className="exd-product-badge exd-badge-old">↩️ Returning</span>
                <img src={exchange.oldProductImage || 'https://via.placeholder.com/80'} alt="" />
                <p className="exd-product-name">{exchange.oldProductName}</p>
                <strong className="exd-product-price exd-price-old">
                  ₹{exchange.oldPrice?.toLocaleString('en-IN')}
                </strong>
                <p className="exd-product-meta">Qty: {exchange.oldQuantity}</p>
              </div>

              <div className="exd-arrow">→</div>

              <div className="exd-product exd-product-new">
                <span className="exd-product-badge exd-badge-new">📦 Replace With</span>
                <img src={exchange.newProductImage || 'https://via.placeholder.com/80'} alt="" />
                <p className="exd-product-name">{exchange.newProductName}</p>
                <strong className="exd-product-price exd-price-new">
                  ₹{exchange.newPrice?.toLocaleString('en-IN')}
                </strong>
                {exchange.newProduct?.stock !== undefined && (
                  <p className="exd-product-meta">{exchange.newProduct.stock} in stock</p>
                )}
              </div>
            </div>

            {exchange.priceDifference !== 0 && (
              <div className={`exd-price-diff ${exchange.priceDifference > 0 ? 'exd-pay' : 'exd-refund'}`}>
                <div className="exd-price-diff-left">
                  <span className="exd-price-diff-icon">
                    {exchange.priceDifference > 0 ? '💰' : '💸'}
                  </span>
                  <div>
                    <p className="exd-price-diff-label">Price Difference</p>
                    <p className="exd-price-diff-sub">
                      {exchange.priceDifference > 0 ? 'Customer must pay extra' : 'Refunded to customer'}
                    </p>
                  </div>
                </div>
                <strong className="exd-price-diff-amount">
                  {exchange.priceDifference > 0
                    ? `+ ₹${exchange.priceDifference.toLocaleString('en-IN')}`
                    : `− ₹${Math.abs(exchange.priceDifference).toLocaleString('en-IN')}`}
                </strong>
              </div>
            )}

            {exchange.priceDifference > 0 && (
              <div className={`exd-pay-status ${exchange.paymentStatus === 'paid' ? 'exd-paid' : 'exd-unpaid'}`}>
                <span className="exd-pay-status-text">
                  💳 Payment: {exchange.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                </span>
                {exchange.paymentLinkUrl && exchange.paymentStatus !== 'paid' && (
                  <a href={exchange.paymentLinkUrl} target="_blank" rel="noopener noreferrer" className="exd-pay-link">
                    🔗 View Payment Link
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Customer & Reason */}
          <div className="exd-card">
            <h3 className="exd-card-title">👤 Customer & Reason</h3>
            <div className="exd-info-rows">
              <div className="exd-info-row">
                <span className="exd-info-label">Name</span>
                <strong className="exd-info-value">{exchange.user?.name || '—'}</strong>
              </div>
              <div className="exd-info-row">
                <span className="exd-info-label">Email</span>
                <a href={`mailto:${exchange.user?.email}`} className="exd-info-link">
                  {exchange.user?.email || '—'}
                </a>
              </div>
              {exchange.user?.phone && (
                <div className="exd-info-row">
                  <span className="exd-info-label">Phone</span>
                  <a href={`tel:${exchange.user.phone}`} className="exd-info-link">
                    📞 {exchange.user.phone}
                  </a>
                </div>
              )}
            </div>

            <div className="exd-reason-box">
              <p className="exd-reason-label">📝 Reason</p>
              <p className="exd-reason-text">{exchange.reason}</p>
              {exchange.description && (
                <p className="exd-reason-desc">"{exchange.description}"</p>
              )}
            </div>
          </div>

          {/* Address */}
          {exchange.order?.shippingAddress && (
            <div className="exd-card">
              <h3 className="exd-card-title">📍 Pickup & Delivery Address</h3>
              <div className="exd-address">
                <p className="exd-address-name">{exchange.order.shippingAddress.name}</p>
                <p className="exd-address-line">📞 {exchange.order.shippingAddress.phone}</p>
                <p className="exd-address-line">🏠 {exchange.order.shippingAddress.address}</p>
                <p className="exd-address-line">
                  {exchange.order.shippingAddress.city}, {exchange.order.shippingAddress.state} — {exchange.order.shippingAddress.pincode}
                </p>
              </div>
            </div>
          )}

          {/* Tracking */}
          {(exchange.pickupTracking || exchange.shipmentTracking) && (
            <div className="exd-card">
              <h3 className="exd-card-title">📦 Tracking</h3>
              <div className="exd-tracking-list">
                {exchange.pickupTracking && (
                  <div className="exd-tracking exd-tracking-pickup">
                    <p className="exd-tracking-label">📦 Pickup Tracking</p>
                    <p className="exd-tracking-number">{exchange.pickupTracking}</p>
                  </div>
                )}
                {exchange.shipmentTracking && (
                  <div className="exd-tracking exd-tracking-shipment">
                    <p className="exd-tracking-label">🚚 New Product Tracking</p>
                    <p className="exd-tracking-number">{exchange.shipmentTracking}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection */}
          {isRejected && exchange.rejectionReason && (
            <div className="exd-rejection">
              <h4>❌ Rejection Reason</h4>
              <p>{exchange.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="exd-col">

          {/* Admin Notes */}
          <div className="exd-card">
            <label className="exd-field-label">📝 Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Internal notes about this exchange..."
              rows={3}
              className="exd-textarea"
            />
          </div>

          {/* Actions */}
          <div className="exd-card exd-actions">
            <h3 className="exd-card-title">⚡ Actions</h3>

            {isPending && (
              <div className="exd-btn-group">
                <button onClick={handleApprove} disabled={updating} className="exd-btn exd-btn-success">
                  {updating ? '⏳ Approving...' : '✅ Approve Exchange'}
                </button>
                <button onClick={() => setShowRejectModal(true)} disabled={updating} className="exd-btn exd-btn-danger-outline">
                  ❌ Reject
                </button>
              </div>
            )}

            {isApproved && (
              <>
                <p className="exd-info-text">📦 Customer notified. Arrange pickup and enter tracking number.</p>
                <input
                  type="text"
                  value={pickupTracking}
                  onChange={e => setPickupTracking(e.target.value)}
                  placeholder="Pickup tracking number"
                  className="exd-input"
                />
                <button onClick={handlePickedUp} disabled={updating} className="exd-btn exd-btn-purple">
                  {updating ? '⏳ Updating...' : '📦 Mark as Picked Up'}
                </button>
              </>
            )}

            {isPickedUp && (
              <>
                <p className="exd-info-text">📬 Mark as received when product arrives at warehouse.</p>
                <button onClick={handleReceived} disabled={updating} className="exd-btn exd-btn-indigo">
                  {updating ? '⏳ Updating...' : '📬 Mark as Received'}
                </button>
              </>
            )}

            {isReceived && (
              <>
                <p className="exd-info-text">🔍 Inspect the returned product. Approve or reject based on condition.</p>
                <button onClick={() => setShowVerifyModal(true)} disabled={updating} className="exd-btn exd-btn-success">
                  🔍 Verify Product
                </button>
              </>
            )}

            {isAwaitingPayment && (
              <>
                <p className="exd-info-text">💳 Waiting for customer to pay price difference.</p>
                {exchange.paymentLinkUrl && (
                  <a href={exchange.paymentLinkUrl} target="_blank" rel="noopener noreferrer" className="exd-btn exd-btn-orange">
                    🔗 View Payment Link
                  </a>
                )}
              </>
            )}

            {isReadyToShip && (
              <>
                <p className="exd-info-text">🎁 Pack and ship the new product to customer.</p>
                <button onClick={() => setShowShipModal(true)} disabled={updating} className="exd-btn exd-btn-success">
                  🚚 Ship New Product
                </button>
              </>
            )}

            {isShipped && (
              <>
                <p className="exd-info-text">🚚 Product shipped. Mark as completed once delivered.</p>
                <button onClick={handleComplete} disabled={updating} className="exd-btn exd-btn-success">
                  {updating ? '⏳ Updating...' : '🎉 Mark as Completed'}
                </button>
              </>
            )}

            {isCompleted && (
              <div className="exd-status-box exd-completed-box">
                <div className="exd-status-icon">🎉</div>
                <p className="exd-status-text">Exchange Completed!</p>
                {exchange.completedAt && (
                  <p className="exd-status-date">
                    {new Date(exchange.completedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}

            {isRejected && (
              <div className="exd-status-box exd-rejected-box">
                <div className="exd-status-icon">❌</div>
                <p className="exd-status-text">Exchange Rejected</p>
                {exchange.rejectedAt && (
                  <p className="exd-status-date">
                    {new Date(exchange.rejectedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="exd-card">
            <h3 className="exd-card-title">🕒 Timeline</h3>
            <div className="exd-timeline">
              <TimelineItem label="Created"  date={exchange.createdAt}  color="#F59E0B" />
              {exchange.approvedAt  && <TimelineItem label="Approved"   date={exchange.approvedAt}  color="#3B82F6" />}
              {exchange.pickedUpAt  && <TimelineItem label="Picked Up"  date={exchange.pickedUpAt}  color="#8B5CF6" />}
              {exchange.receivedAt  && <TimelineItem label="Received"   date={exchange.receivedAt}  color="#6366F1" />}
              {exchange.verifiedAt  && <TimelineItem label="Verified"   date={exchange.verifiedAt}  color="#10B981" />}
              {exchange.shippedAt   && <TimelineItem label="Shipped"    date={exchange.shippedAt}   color="#06B6D4" />}
              {exchange.completedAt && <TimelineItem label="Completed"  date={exchange.completedAt} color="#10B981" />}
              {exchange.rejectedAt  && <TimelineItem label="Rejected"   date={exchange.rejectedAt}  color="#EF4444" />}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showRejectModal && (
        <Modal onClose={() => setShowRejectModal(false)} title="❌ Reject Exchange">
          <p className="exd-modal-text">Please provide a reason for rejecting this exchange. The customer will be notified.</p>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={4}
            className="exd-input"
            autoFocus
          />
          <div className="exd-modal-actions">
            <button onClick={() => setShowRejectModal(false)} className="exd-btn exd-btn-cancel">Cancel</button>
            <button onClick={handleReject} disabled={updating || !rejectionReason.trim()} className="exd-btn exd-btn-danger">
              {updating ? '⏳' : '❌ Reject'}
            </button>
          </div>
        </Modal>
      )}

      {showVerifyModal && (
        <Modal onClose={() => setShowVerifyModal(false)} title="🔍 Verify Returned Product">
          <p className="exd-modal-text">Did the returned product pass inspection?</p>
          <button onClick={() => handleVerify(true)} disabled={updating} className="exd-btn exd-btn-success">
            ✅ Approve — Product in Good Condition
          </button>
          <p className="exd-modal-divider">OR</p>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection (e.g., damaged, used, missing parts)..."
            rows={3}
            className="exd-input"
          />
          <button onClick={() => handleVerify(false)} disabled={updating || !rejectionReason.trim()} className="exd-btn exd-btn-danger-outline">
            ❌ Reject — Product Damaged/Used
          </button>
          <button onClick={() => setShowVerifyModal(false)} className="exd-btn exd-btn-cancel" style={{ marginTop: 10 }}>
            Cancel
          </button>
        </Modal>
      )}

      {showShipModal && (
        <Modal onClose={() => setShowShipModal(false)} title="🚚 Ship New Product">
          <p className="exd-modal-text">Enter the tracking number for the new product shipment.</p>
          <input
            type="text"
            value={shipmentTracking}
            onChange={e => setShipmentTracking(e.target.value)}
            placeholder="e.g. DTDC123456789"
            className="exd-input"
            autoFocus
          />
          <div className="exd-modal-actions">
            <button onClick={() => setShowShipModal(false)} className="exd-btn exd-btn-cancel">Cancel</button>
            <button onClick={handleShip} disabled={updating || !shipmentTracking.trim()} className="exd-btn exd-btn-success">
              {updating ? '⏳' : '🚚 Ship Now'}
            </button>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .exd-page {
          font-family: 'Nunito', sans-serif;
          padding: 4px;
        }

        /* LOADING / NOT FOUND */
        .exd-loading, .exd-notfound {
          text-align: center;
          padding: 80px 20px;
          font-family: 'Nunito', sans-serif;
          color: #9585B0;
        }
        .exd-loading-icon, .exd-notfound-icon { font-size: 2.5rem; margin-bottom: 12px; }
        .exd-loading p { font-weight: 700; margin: 0; }
        .exd-notfound h2 { color: #2D1A4A; margin: 0 0 12px; }
        .exd-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #7C3AED;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.84rem;
        }
        .exd-notfound .exd-back-link {
          padding: 10px 24px;
          background: #7C3AED;
          color: white;
          border-radius: 10px;
          margin-top: 12px;
        }

        /* HEADER */
        .exd-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .exd-header-left { min-width: 0; flex: 1; }
        .exd-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 10px 0 4px;
          color: #2D1A4A;
        }
        .exd-subtitle {
          color: #9585B0;
          margin: 0;
          font-size: 0.84rem;
          font-weight: 600;
        }
        .exd-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.9rem;
          border: 1.5px solid;
          white-space: nowrap;
        }

        /* CARD */
        .exd-card {
          background: white;
          border-radius: 14px;
          border: 1.5px solid #EDD9FF;
          padding: 18px;
          margin-bottom: 16px;
        }
        .exd-card-title {
          margin: 0 0 14px;
          font-size: 1rem;
          font-weight: 800;
          color: #2D1A4A;
        }

        /* WORKFLOW */
        .exd-workflow {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          overflow-x: auto;
          gap: 4px;
          padding-bottom: 4px;
        }
        .exd-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 80px;
          position: relative;
        }
        .exd-step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1rem;
          z-index: 2;
        }
        .exd-step-label {
          margin: 0;
          font-size: 0.74rem;
          text-align: center;
        }
        .exd-step-line {
          position: absolute;
          top: 20px;
          left: calc(50% + 22px);
          right: calc(-50% + 22px);
          height: 2px;
          z-index: 1;
        }

        /* GRID */
        .exd-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 16px;
        }
        .exd-col {
          display: flex;
          flex-direction: column;
        }

        /* PRODUCTS */
        .exd-products-grid {
          display: grid;
          grid-template-columns: 1fr 30px 1fr;
          gap: 12px;
          align-items: center;
        }
        .exd-product {
          padding: 14px;
          border: 2px solid;
          border-radius: 14px;
          text-align: center;
        }
        .exd-product-old { background: #FEF2F2; border-color: #FCA5A5; }
        .exd-product-new { background: #ECFDF5; border-color: #A7F3D0; }
        .exd-product-badge {
          display: inline-block;
          font-size: 0.66rem;
          font-weight: 800;
          color: white;
          padding: 3px 10px;
          border-radius: 999px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .exd-badge-old { background: #EF4444; }
        .exd-badge-new { background: #10B981; }
        .exd-product img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 10px;
          margin: 0 auto 8px;
          display: block;
        }
        .exd-product-name {
          margin: 0 0 4px;
          font-size: 0.86rem;
          font-weight: 800;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .exd-product-old .exd-product-name { color: #7F1D1D; }
        .exd-product-new .exd-product-name { color: #065F46; }
        .exd-product-price { font-size: 1.1rem; }
        .exd-price-old { color: #DC2626; }
        .exd-price-new { color: #10B981; }
        .exd-product-meta {
          margin: 6px 0 0;
          font-size: 0.74rem;
          font-weight: 600;
        }
        .exd-product-old .exd-product-meta { color: #7F1D1D; }
        .exd-product-new .exd-product-meta { color: #065F46; }
        .exd-arrow {
          font-size: 2rem;
          color: #7C3AED;
          font-weight: 900;
          text-align: center;
        }

        /* PRICE DIFF */
        .exd-price-diff {
          margin-top: 14px;
          padding: 12px 14px;
          border: 1.5px solid;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .exd-pay    { background: #FFFBEB; border-color: #FDE68A; }
        .exd-refund { background: #F0F9FF; border-color: #BFDBFE; }
        .exd-price-diff-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .exd-price-diff-icon { font-size: 1.4rem; }
        .exd-price-diff-label {
          margin: 0;
          font-size: 0.82rem;
          font-weight: 800;
        }
        .exd-pay .exd-price-diff-label    { color: #92400E; }
        .exd-refund .exd-price-diff-label { color: #1E40AF; }
        .exd-price-diff-sub {
          margin: 2px 0 0;
          font-size: 0.74rem;
          font-weight: 600;
        }
        .exd-pay .exd-price-diff-sub    { color: #78350F; }
        .exd-refund .exd-price-diff-sub { color: #1E40AF; }
        .exd-price-diff-amount { font-size: 1.2rem; }
        .exd-pay .exd-price-diff-amount    { color: #F59E0B; }
        .exd-refund .exd-price-diff-amount { color: #3B82F6; }

        /* PAY STATUS */
        .exd-pay-status {
          margin-top: 12px;
          padding: 10px 14px;
          border: 1px solid;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .exd-paid   { background: #ECFDF5; border-color: #A7F3D0; }
        .exd-unpaid { background: #FEF3C7; border-color: #FDE68A; }
        .exd-pay-status-text {
          font-size: 0.84rem;
          font-weight: 800;
        }
        .exd-paid .exd-pay-status-text   { color: #065F46; }
        .exd-unpaid .exd-pay-status-text { color: #92400E; }
        .exd-pay-link {
          padding: 6px 14px;
          background: #F97316;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.76rem;
        }

        /* INFO ROWS */
        .exd-info-rows {
          display: grid;
          gap: 10px;
          margin-bottom: 14px;
        }
        .exd-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .exd-info-label {
          font-size: 0.82rem;
          color: #9585B0;
          font-weight: 600;
        }
        .exd-info-value {
          font-size: 0.88rem;
          color: #2D1A4A;
          font-weight: 700;
        }
        .exd-info-link {
          color: #7C3AED;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.86rem;
        }

        /* REASON */
        .exd-reason-box {
          padding: 12px 14px;
          background: #FBF7FF;
          border-radius: 10px;
        }
        .exd-reason-label {
          margin: 0;
          font-size: 0.74rem;
          font-weight: 800;
          color: #7C3AED;
          text-transform: uppercase;
        }
        .exd-reason-text {
          margin: 4px 0 0;
          font-size: 0.88rem;
          color: #2D1A4A;
          font-weight: 600;
        }
        .exd-reason-desc {
          margin: 8px 0 0;
          font-size: 0.82rem;
          color: #6B4E8A;
          font-weight: 600;
          font-style: italic;
        }

        /* ADDRESS */
        .exd-address {
          padding: 12px 14px;
          background: #FAFAFA;
          border-radius: 10px;
          line-height: 1.7;
        }
        .exd-address-name {
          margin: 0;
          font-weight: 800;
          color: #2D1A4A;
          font-size: 0.94rem;
        }
        .exd-address-line {
          margin: 2px 0;
          font-size: 0.84rem;
          color: #6B4E8A;
          font-weight: 600;
        }

        /* TRACKING */
        .exd-tracking-list { display: flex; flex-direction: column; gap: 10px; }
        .exd-tracking {
          padding: 10px 14px;
          border: 1px solid;
          border-radius: 10px;
        }
        .exd-tracking-pickup    { background: #EDE9FE; border-color: #DDD6FE; }
        .exd-tracking-shipment  { background: #CFFAFE; border-color: #A5F3FC; }
        .exd-tracking-label {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .exd-tracking-pickup   .exd-tracking-label { color: #6D28D9; }
        .exd-tracking-shipment .exd-tracking-label { color: #0E7490; }
        .exd-tracking-number {
          margin: 4px 0 0;
          font-size: 0.92rem;
          font-weight: 800;
          font-family: monospace;
        }
        .exd-tracking-pickup   .exd-tracking-number { color: #5B21B6; }
        .exd-tracking-shipment .exd-tracking-number { color: #155E75; }

        /* REJECTION */
        .exd-rejection {
          background: #FEF2F2;
          border-radius: 14px;
          border: 1.5px solid #FCA5A5;
          padding: 16px 20px;
        }
        .exd-rejection h4 {
          margin: 0 0 6px;
          font-size: 0.96rem;
          font-weight: 800;
          color: #DC2626;
        }
        .exd-rejection p {
          margin: 0;
          font-size: 0.86rem;
          color: #991B1B;
          font-weight: 600;
        }

        /* FORM */
        .exd-field-label {
          display: block;
          font-size: 0.74rem;
          font-weight: 800;
          color: #7C3AED;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        .exd-textarea, .exd-input {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #EDD9FF;
          border-radius: 10px;
          font-family: inherit;
          font-size: 0.88rem;
          outline: none;
          box-sizing: border-box;
          color: #2D1A4A;
          margin-bottom: 10px;
          resize: vertical;
        }
        .exd-textarea:focus, .exd-input:focus { border-color: #7C3AED; }

        /* ACTIONS */
        .exd-actions { position: sticky; top: 16px; }
        .exd-btn-group { display: flex; flex-direction: column; gap: 8px; }
        .exd-info-text {
          margin: 0 0 14px;
          padding: 10px 12px;
          background: #F5F3FF;
          border-radius: 8px;
          font-size: 0.82rem;
          color: #6D28D9;
          font-weight: 600;
        }

        /* BUTTONS */
        .exd-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          font-family: inherit;
          text-align: center;
          text-decoration: none;
          display: block;
          box-sizing: border-box;
          transition: opacity 0.2s;
        }
        .exd-btn:hover:not(:disabled) { opacity: 0.92; }
        .exd-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .exd-btn-success { background: linear-gradient(135deg,#10B981,#059669); color: white; }
        .exd-btn-purple  { background: linear-gradient(135deg,#8B5CF6,#7C3AED); color: white; }
        .exd-btn-indigo  { background: linear-gradient(135deg,#6366F1,#4F46E5); color: white; }
        .exd-btn-orange  { background: linear-gradient(135deg,#F97316,#EA580C); color: white; }
        .exd-btn-danger  { background: linear-gradient(135deg,#EF4444,#DC2626); color: white; }
        .exd-btn-danger-outline {
          background: white;
          color: #EF4444;
          border: 1.5px solid #FCA5A5;
        }
        .exd-btn-cancel {
          flex: 1;
          background: white;
          color: #6B7280;
          border: 1.5px solid #E5E7EB;
        }

        /* STATUS BOX */
        .exd-status-box {
          padding: 20px;
          text-align: center;
          border: 1.5px solid;
          border-radius: 10px;
        }
        .exd-completed-box { background: #ECFDF5; border-color: #A7F3D0; }
        .exd-rejected-box  { background: #FEF2F2; border-color: #FCA5A5; }
        .exd-status-icon { font-size: 2.5rem; }
        .exd-status-text {
          margin: 8px 0 0;
          font-size: 1rem;
          font-weight: 800;
        }
        .exd-completed-box .exd-status-text { color: #065F46; }
        .exd-rejected-box  .exd-status-text { color: #991B1B; }
        .exd-status-date {
          margin: 4px 0 0;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .exd-completed-box .exd-status-date { color: #047857; }
        .exd-rejected-box  .exd-status-date { color: #7F1D1D; }

        /* TIMELINE */
        .exd-timeline { display: flex; flex-direction: column; gap: 10px; }

        /* MODAL */
        .exd-modal-text {
          margin: 0 0 14px;
          font-size: 0.86rem;
          color: #6B4E8A;
        }
        .exd-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        .exd-modal-divider {
          margin: 8px 0;
          font-size: 0.78rem;
          color: #9585B0;
          font-weight: 600;
          text-align: center;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .exd-grid { grid-template-columns: 1fr; }
          .exd-actions { position: static; }
        }
        @media (max-width: 600px) {
          .exd-products-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .exd-arrow {
            transform: rotate(90deg);
            font-size: 1.5rem;
          }
          .exd-header { flex-direction: column; align-items: stretch; }
          .exd-status-pill {
            align-self: flex-start;
          }
          .exd-title { font-size: 1.25rem; }
          .exd-step { min-width: 70px; }
          .exd-step-circle { width: 36px; height: 36px; font-size: 0.9rem; }
          .exd-step-label { font-size: 0.68rem; }
        }
      `}</style>
    </div>
  );
}

/* ── HELPERS ── */
function TimelineItem({ label, date, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: color, flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.78rem', color: '#9585B0', fontWeight: 600 }}>{label}</p>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#2D1A4A', fontWeight: 700 }}>
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
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 16,
        fontFamily: 'Nunito, sans-serif',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: 16,
        width: '100%', maxWidth: 460,
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1.5px solid #F3E8FF',
          display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{
            margin: 0, fontSize: '1.05rem',
            fontWeight: 800, color: '#2D1A4A',
          }}>{title}</h3>
          <button onClick={onClose} style={{
            background: '#F3F4F6', border: 'none', borderRadius: 8,
            width: 32, height: 32, cursor: 'pointer',
            fontSize: '1rem', color: '#6B7280',
          }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}