// src/app/admin/orders/page.js
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

export default function AdminOrders() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState('');
  const [page,          setPage]          = useState(1);
  const [pagination,    setPagination]    = useState({});
  const [statusCounts,  setStatusCounts]  = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: 15,
        ...(filterStatus && { status: filterStatus }),
      });
      const res  = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setPagination(data.pagination || {});
      if (!filterStatus) {
        const counts = {};
        (data.orders || []).forEach(o => {
          counts[o.orderStatus] = (counts[o.orderStatus] || 0) + 1;
        });
        setStatusCounts(counts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, filterStatus]);

  const handleStatusChange = async (orderId, newStatus) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderStatus: newStatus }),
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
      </div>

      {/* ── FILTER ── */}
      <div className={styles.filters}>
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
        {filterStatus && (
          <button
            onClick={() => { setFilterStatus(''); setPage(1); }}
            style={{
              background: '#fee2e2', color: '#dc2626',
              border: 'none', padding: '8px 14px',
              borderRadius: '8px', fontWeight: '600',
              cursor: 'pointer', fontSize: '13px',
            }}
          >
            ✕ Clear
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
            ) : orders.map(order => (
              <tr key={order.id}>
                <td>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    style={{
                      fontWeight: '700', color: '#7c3aed',
                      fontFamily: 'monospace', textDecoration: 'none',
                    }}
                  >
                    #{order.id?.slice(-8)?.toUpperCase()}
                  </Link>
                </td>
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
                <td>
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ fontWeight: '700' }}>
                      {order.orderItems?.length}
                    </span>
                    <span style={{ color: '#888' }}> items</span>
                  </div>
                </td>
                <td>
                  <strong style={{ color: '#ff6b9d', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    ₹{order.totalPrice?.toLocaleString('en-IN')}
                  </strong>
                </td>
                <td>
                  <span className={order.isPaid ? orderStyles.paid : orderStyles.unpaid}>
                    {order.isPaid ? '✅ Paid' : '⏳ Pending'}
                  </span>
                </td>
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
                <td style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </td>
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
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className={orderStyles.mobileOrderCards}>
        {loading ? (
          <div className={styles.center}>⏳ Loading...</div>
        ) : orders.length === 0 ? (
          <div className={styles.center}>No orders found</div>
        ) : orders.map(order => (
          <div key={order.id} className={orderStyles.mobileOrderCard}>
            {/* Top: ID + Status */}
            <div className={orderStyles.mobileOrderTop}>
              <span className={orderStyles.mobileOrderId}>
                #{order.id?.slice(-8)?.toUpperCase()}
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
                ₹{order.totalPrice?.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Bottom: Date + Payment + Actions */}
            <div className={orderStyles.mobileOrderBottom}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className={orderStyles.mobileOrderDate}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                <span className={order.isPaid ? orderStyles.paid : orderStyles.unpaid}>
                  {order.isPaid ? '✅ Paid' : '⏳ Pending'}
                </span>
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
        ))}
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
    </div>
  );
}