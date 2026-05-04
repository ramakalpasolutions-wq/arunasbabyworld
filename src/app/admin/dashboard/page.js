// src/app/admin/dashboard/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const STATUS_CFG = {
  Pending:    { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  Confirmed:  { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  Processing: { bg: '#f5f3ff', text: '#6d28d9', dot: '#8b5cf6' },
  Shipped:    { bg: '#ecfeff', text: '#0e7490', dot: '#06b6d4' },
  Delivered:  { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  Cancelled:  { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
  Refunded:   { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af' },
};

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders?limit=5').then(r => r.json()),
      fetch('/api/products?limit=1').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([ordersData, productsData, catsData]) => {
      setOrders(ordersData.orders || []);
      setStats({
        orders:     ordersData.pagination?.total || 0,
        products:   productsData.pagination?.total || 0,
        categories: catsData.categories?.length   || 0,
        revenue:    (ordersData.orders || []).reduce(
          (a, o) => a + (o.totalPrice || 0), 0
        ),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = [
    {
      icon: '🛍️', label: 'Total Orders',
      value: stats?.orders ?? '—',
      color: '#f97316', link: '/admin/orders',
    },
    {
      icon: '📦', label: 'Total Products',
      value: stats?.products ?? '—',
      color: '#8b5cf6', link: '/admin/products',
    },
    {
      icon: '🗂️', label: 'Categories',
      value: stats?.categories ?? '—',
      color: '#0ea5e9', link: '/admin/categories',
    },
    {
      icon: '💰', label: 'Revenue',
      value: stats ? '₹' + stats.revenue.toLocaleString('en-IN') : '—',
      color: '#10b981', link: '/admin/orders',
    },
  ];

  const quickActions = [
    { icon: '➕', label: 'Add Product',  href: '/admin/products/new', color: '#f97316' },
    { icon: '🗂️', label: 'Add Category', href: '/admin/categories',   color: '#8b5cf6' },
    { icon: '🖼️', label: 'Add Banner',   href: '/admin/banners',      color: '#0ea5e9' },
    { icon: '🎟️', label: 'Add Coupon',   href: '/admin/coupons',      color: '#10b981' },
  ];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' :
    hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className={styles.dashboard}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <p className={styles.greeting}>{greeting} 👋</p>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <div className={styles.dateChip}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric',
          })}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.link}
            className={styles.statCard}
            style={{ '--cc': card.color }}
          >
            <div className={styles.cardAccent} />
            <div
              className={styles.cardIconWrap}
              style={{ background: card.color + '18' }}
            >
              <span className={styles.cardIcon}>{card.icon}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardValue}>
                {loading
                  ? <span className={styles.shimmer} />
                  : card.value}
              </div>
              <div className={styles.cardLabel}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickActions}>
          {quickActions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={styles.quickAction}
              style={{ '--ac': a.color }}
            >
              <span className={styles.qaIcon}>{a.icon}</span>
              <span className={styles.qaLabel}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── RECENT ORDERS ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Orders</h2>
          <Link href="/admin/orders" className={styles.viewAll}>
            View All →
          </Link>
        </div>

        {/* ── Desktop Table ── */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {['Order ID','Customer','Amount','Status','Date','Action'].map(h => (
                  <th key={h} className={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    Loading…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    No orders yet
                  </td>
                </tr>
              ) : orders.map((order) => {
                const sc = STATUS_CFG[order.orderStatus] || STATUS_CFG.Refunded;
                return (
                  <tr key={order.id} className={styles.tr}>
                    <td className={styles.tdId}>
                      #{order.id?.slice(-8)?.toUpperCase()}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.customerCell}>
                        <div className={styles.avatar}>
                          {(order.user?.name || 'C')[0].toUpperCase()}
                        </div>
                        {order.user?.name || 'Customer'}
                      </div>
                    </td>
                    <td className={styles.tdAmt}>
                      ₹{order.totalPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className={styles.td}>
                      <span
                        className={styles.badge}
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        <span
                          className={styles.dot}
                          style={{ background: sc.dot }}
                        />
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className={styles.td}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className={styles.viewBtn}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Cards (shown on ≤768px) ── */}
        <div className={styles.mobileOrders}>
          {loading ? (
            <div className={styles.emptyCell}>Loading…</div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyCell}>No orders yet</div>
          ) : orders.map((order) => {
            const sc = STATUS_CFG[order.orderStatus] || STATUS_CFG.Refunded;
            return (
              <div key={order.id} className={styles.mobileOrderCard}>
                {/* Top row: ID + Status */}
                <div className={styles.mobileOrderTop}>
                  <span className={styles.mobileOrderId}>
                    #{order.id?.slice(-8)?.toUpperCase()}
                  </span>
                  <span
                    className={styles.badge}
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    <span
                      className={styles.dot}
                      style={{ background: sc.dot }}
                    />
                    {order.orderStatus}
                  </span>
                </div>

                {/* Mid row: Customer + Amount */}
                <div className={styles.mobileOrderMid}>
                  <div className={styles.customerCell}>
                    <div className={styles.avatar}>
                      {(order.user?.name || 'C')[0].toUpperCase()}
                    </div>
                    {order.user?.name || 'Customer'}
                  </div>
                  <span className={styles.mobileOrderAmt}>
                    ₹{order.totalPrice?.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Bottom row: Date + View button */}
                <div className={styles.mobileOrderBottom}>
                  <span className={styles.mobileOrderDate}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </span>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className={styles.viewBtn}
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}