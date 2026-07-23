'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from '../products/page.module.css';
import orderStyles from './page.module.css';

const STATUS_OPTIONS = [
  'Pending','Confirmed','Processing',
  'Shipped','Delivered','Cancelled','Refunded',
];

const STATUS_COLOR = {
  Pending:    '#f59e0b',
  Confirmed:  '#3b82f6',
  Processing: '#8b5cf6',
  Shipped:    '#06b6d4',
  Delivered:  '#10b981',
  Cancelled:  '#ef4444',
  Refunded:   '#6b7280',
};

// ✅ Format order number helper
function fmtOrderNum(order) {
  return order.orderNumber
    ? `ABW-${order.orderNumber}`
    : `#${order.id?.slice(-8)?.toUpperCase()}`;
}

// ✅ Payment status badge helper
function PaymentBadge({ order }) {
  if (order.isPaid) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px',
        background: '#D1FAE5', color: '#065F46',
        border: '1px solid #A7F3D0',
        borderRadius: '999px',
        fontSize: '0.70rem', fontWeight: '800',
        whiteSpace: 'nowrap',
      }}>
        ✅ Paid
      </span>
    );
  }

  if (order.paymentStatus === 'failed') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px',
        background: '#FEE2E2', color: '#991B1B',
        border: '1px solid #FCA5A5',
        borderRadius: '999px',
        fontSize: '0.70rem', fontWeight: '800',
        whiteSpace: 'nowrap',
        animation: 'pulseRed 2s ease-in-out infinite',
      }}>
        ❌ Failed
      </span>
    );
  }

  if (order.paymentStatus === 'cancelled') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px',
        background: '#FEE2E2', color: '#991B1B',
        border: '1px solid #FCA5A5',
        borderRadius: '999px',
        fontSize: '0.70rem', fontWeight: '800',
        whiteSpace: 'nowrap',
      }}>
        🚫 Cancelled
      </span>
    );
  }

  if (order.paymentMethod === 'COD') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px',
        background: '#FEF3C7', color: '#92400E',
        border: '1px solid #FDE68A',
        borderRadius: '999px',
        fontSize: '0.70rem', fontWeight: '800',
        whiteSpace: 'nowrap',
      }}>
        💵 COD
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px',
      background: '#FEF3C7', color: '#92400E',
      border: '1px solid #FDE68A',
      borderRadius: '999px',
      fontSize: '0.70rem', fontWeight: '800',
      whiteSpace: 'nowrap',
    }}>
      ⏳ Pending
    </span>
  );
}

export default function AdminOrders() {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState(''); // ✅ NEW
  const [page,         setPage]         = useState(1);
  const [pagination,   setPagination]   = useState({});
  const [statusCounts, setStatusCounts] = useState({});
  const [failedCount,  setFailedCount]  = useState(0); // ✅ NEW

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 15,
        ...(filterStatus  && { status: filterStatus }),
        ...(filterPayment && { paymentStatus: filterPayment }),
      });
      const res  = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setPagination(data.pagination || {});

      if (!filterStatus && !filterPayment) {
        const counts = {};
        let failed = 0;
        (data.orders || []).forEach(o => {
          counts[o.orderStatus] = (counts[o.orderStatus] || 0) + 1;
          if (o.paymentStatus === 'failed' && !o.isPaid) failed++;
        });
        setStatusCounts(counts);
        setFailedCount(failed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, filterStatus, filterPayment]);

  const handleStatusChange = async (orderId, newStatus) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ orderStatus: newStatus }),
    });
    if (res.ok) { toast.success('✅ Status updated'); fetchOrders(); }
    else toast.error('Failed to update');
  };

  const statusCardsCfg = [
    { label: 'Pending',    color: '#f59e0b', emoji: '⏳' },
    { label: 'Confirmed',  color: '#3b82f6', emoji: '✅' },
    { label: 'Processing', color: '#8b5cf6', emoji: '⚙️' },
    { label: 'Shipped',    color: '#06b6d4', emoji: '🚚' },
    { label: 'Delivered',  color: '#10b981', emoji: '🎉' },
    { label: 'Cancelled',  color: '#ef4444', emoji: '❌' },
  ];

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Orders 🛍️</h1>
          <p>{pagination.total || 0} total orders</p>
        </div>
      </div>

      {/* ✅ PAYMENT FAILED ALERT BANNER */}
      {failedCount > 0 && !filterPayment && (
        <div style={{
          background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
          border: '2px solid #EF4444',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          boxShadow: '0 4px 14px rgba(239,68,68,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>
              🚨
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#991B1B' }}>
                {failedCount} Payment{failedCount > 1 ? 's' : ''} Failed
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#7F1D1D', fontWeight: '600' }}>
                Customer payments couldn't complete. Follow up may be needed.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setFilterPayment('failed'); setPage(1); }}
            style={{
              padding: '10px 20px',
              background: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '0.86rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            👁️ View Failed Payments →
          </button>
        </div>
      )}

      {/* ── STATUS CARDS ── */}
      <div className={orderStyles.statusCards}>
        {statusCardsCfg.map(s => (
          <button
            key={s.label}
            className={`${orderStyles.statusCard} ${
              filterStatus === s.label ? orderStyles.statusCardActive : ''
            }`}
            onClick={() => {
              setFilterStatus(filterStatus === s.label ? '' : s.label);
              setPage(1);
            }}
            style={{ '--s-color': s.color }}
          >
            <span className={orderStyles.statusCardEmoji}>{s.emoji}</span>
            <span className={orderStyles.statusCardLabel}>{s.label}</span>
            <span
              className={orderStyles.statusCardCount}
              style={{ background: `${s.color}20`, color: s.color }}
            >
              {statusCounts[s.label] || 0}
            </span>
          </button>
        ))}

        {/* ✅ Payment Failed Card */}
        <button
          className={`${orderStyles.statusCard} ${
            filterPayment === 'failed' ? orderStyles.statusCardActive : ''
          }`}
          onClick={() => {
            setFilterPayment(filterPayment === 'failed' ? '' : 'failed');
            setFilterStatus('');
            setPage(1);
          }}
          style={{ '--s-color': '#EF4444' }}
        >
          <span className={orderStyles.statusCardEmoji}>🚨</span>
          <span className={orderStyles.statusCardLabel}>Payment Failed</span>
          <span
            className={orderStyles.statusCardCount}
            style={{ background: '#FEE2E2', color: '#DC2626' }}
          >
            {failedCount}
          </span>
        </button>
      </div>

      {/* ── FILTERS ── */}
      <div className={styles.filters} style={{ gap: '10px', flexWrap: 'wrap' }}>
        <select
          className="form-control"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="form-control"
          value={filterPayment}
          onChange={e => { setFilterPayment(e.target.value); setPage(1); }}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Payments</option>
          <option value="pending">⏳ Pending</option>
          <option value="success">✅ Success</option>
          <option value="failed">❌ Failed</option>
          <option value="cancelled">🚫 Cancelled</option>
          <option value="not_applicable">💵 COD</option>
        </select>

        {(filterStatus || filterPayment) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterPayment(''); setPage(1); }}
            style={{
              background: '#fee2e2', color: '#dc2626',
              border: 'none', padding: '8px 14px',
              borderRadius: '8px', fontWeight: '600',
              cursor: 'pointer', fontSize: '13px',
            }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className={styles.center}>⏳ Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.center}>
                  <div style={{ padding: '32px', color: '#999' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📦</div>
                    <p>No orders found</p>
                  </div>
                </td>
              </tr>
            ) : orders.map(order => {
              const isFailedPayment = order.paymentStatus === 'failed' && !order.isPaid;

              return (
                <tr
                  key={order.id}
                  style={isFailedPayment ? {
                    background: 'linear-gradient(90deg, #FEF2F2, transparent)',
                    borderLeft: '3px solid #EF4444',
                  } : {}}
                >

                  {/* ✅ Order Number */}
                  <td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      style={{
                        fontWeight: '800',
                        color: '#7c3aed',
                        fontFamily: 'monospace',
                        textDecoration: 'none',
                        fontSize: '13px',
                        background: '#f3f0ff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtOrderNum(order)}
                    </Link>
                    {isFailedPayment && (
                      <div style={{
                        marginTop: '4px',
                        fontSize: '0.68rem',
                        color: '#DC2626',
                        fontWeight: '800',
                      }}>
                        ⚠️ Payment failed
                      </div>
                    )}
                  </td>

                  {/* Customer */}
                  <td>
                    <div className={orderStyles.customerCell}>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>
                        {order.user?.name || 'Customer'}
                      </div>
                      <div className={orderStyles.customerEmail}>
                        {order.user?.email}
                      </div>
                    </div>
                  </td>

                  {/* Items */}
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      <span style={{ fontWeight: '700' }}>
                        {order.orderItems?.length}
                      </span>
                      <span style={{ color: '#888' }}> items</span>
                    </div>
                  </td>

                  {/* Total */}
                  <td>
                    <strong style={{ color: '#ff6b9d', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
                    </strong>
                  </td>

                  {/* ✅ Payment Badge */}
                  <td>
                    <PaymentBadge order={order} />
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={orderStyles.statusBadge}
                      style={{
                        background: `${STATUS_COLOR[order.orderStatus] || '#888'}20`,
                        color: STATUS_COLOR[order.orderStatus] || '#888',
                      }}
                    >
                      {order.orderStatus}
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select
                        value={order.orderStatus}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        className={orderStyles.statusSelect}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{
                          background: '#ede9fe', color: '#7c3aed',
                          padding: '5px 8px', borderRadius: '6px',
                          fontSize: '11px', fontWeight: '700',
                          textDecoration: 'none', whiteSpace: 'nowrap',
                        }}
                      >
                        👁️
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className={orderStyles.mobileOrderCards}>
        {loading ? (
          <div className={styles.center}>⏳ Loading...</div>
        ) : orders.length === 0 ? (
          <div className={styles.center}>No orders found</div>
        ) : orders.map(order => {
          const isFailedPayment = order.paymentStatus === 'failed' && !order.isPaid;

          return (
            <div
              key={order.id}
              className={orderStyles.mobileOrderCard}
              style={isFailedPayment ? {
                borderLeft: '4px solid #EF4444',
                background: 'linear-gradient(135deg, #FEF2F2, white)',
              } : {}}
            >

              {/* Payment Failed Banner */}
              {isFailedPayment && (
                <div style={{
                  padding: '8px 12px',
                  background: '#FEE2E2',
                  color: '#991B1B',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  🚨 Payment Failed — Follow up needed
                </div>
              )}

              {/* Top: Order Number + Status */}
              <div className={orderStyles.mobileOrderTop}>
                <span
                  className={orderStyles.mobileOrderId}
                  style={{
                    fontFamily: 'monospace',
                    background: '#f3f0ff',
                    color: '#7c3aed',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontWeight: '800',
                    fontSize: '13px',
                  }}
                >
                  {fmtOrderNum(order)}
                </span>
                <span
                  className={orderStyles.statusBadge}
                  style={{
                    background: `${STATUS_COLOR[order.orderStatus] || '#888'}20`,
                    color: STATUS_COLOR[order.orderStatus] || '#888',
                  }}
                >
                  {order.orderStatus}
                </span>
              </div>

              {/* Mid: Customer + Amount */}
              <div className={orderStyles.mobileOrderMid}>
                <div>
                  <div className={orderStyles.mobileOrderCustomer}>
                    {order.user?.name || 'Customer'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {order.orderItems?.length} item(s)
                  </div>
                </div>
                <div className={orderStyles.mobileOrderAmount}>
                  ₹{Math.round(order.totalPrice)?.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Bottom: Date + Payment + Actions */}
              <div className={orderStyles.mobileOrderBottom}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className={orderStyles.mobileOrderDate}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <PaymentBadge order={order} />
                </div>
                <div className={orderStyles.mobileOrderActions}>
                  <select
                    value={order.orderStatus}
                    onChange={e => handleStatusChange(order.id, e.target.value)}
                    className={orderStyles.statusSelect}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    style={{
                      background: '#ede9fe', color: '#7c3aed',
                      padding: '6px 10px', borderRadius: '6px',
                      fontSize: '12px', fontWeight: '700',
                      textDecoration: 'none',
                    }}
                  >
                    👁️ View
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PAGINATION ── */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className={styles.pageBtn}
          >
            ← Prev
          </button>
          <span>Page {page} of {pagination.pages}</span>
          <button
            disabled={page === pagination.pages}
            onClick={() => setPage(p => p + 1)}
            className={styles.pageBtn}
          >
            Next →
          </button>
        </div>
      )}

      {/* ✅ Pulse animation for failed payment badge */}
      <style>{`
        @keyframes pulseRed {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50%      { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}