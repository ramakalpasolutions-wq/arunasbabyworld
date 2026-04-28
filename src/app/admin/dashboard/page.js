'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders?limit=5').then(r => r.json()),
      fetch('/api/products?limit=1').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([ordersData, productsData, catsData]) => {
      setOrders(ordersData.orders || []);
      setStats({
        orders: ordersData.pagination?.total || 0,
        products: productsData.pagination?.total || 0,
        categories: catsData.categories?.length || 0,
        revenue: (ordersData.orders || []).reduce((a, o) => a + (o.totalPrice || 0), 0),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = [
    { icon: '🛍️', label: 'Total Orders', value: stats?.orders || 0, color: '#ff6b9d', link: '/admin/orders' },
    { icon: '📦', label: 'Total Products', value: stats?.products || 0, color: '#7c3aed', link: '/admin/products' },
    { icon: '🗂️', label: 'Categories', value: stats?.categories || 0, color: '#0ea5e9', link: '/admin/categories' },
    { icon: '💰', label: 'Revenue (₹)', value: stats?.revenue?.toLocaleString('en-IN') || '0', color: '#10b981', link: '/admin/orders' },
  ];

  const quickActions = [
    { icon: '➕', label: 'Add Product', href: '/admin/products/new', color: '#ff6b9d' },
    { icon: '🗂️', label: 'Add Category', href: '/admin/categories', color: '#7c3aed' },
    { icon: '🖼️', label: 'Add Banner', href: '/admin/banners', color: '#0ea5e9' },
    { icon: '🎟️', label: 'Add Coupon', href: '/admin/coupons', color: '#10b981' },
  ];

  const STATUS_COLOR = {
    Pending: '#f59e0b',
    Confirmed: '#3b82f6',
    Processing: '#8b5cf6',
    Shipped: '#06b6d4',
    Delivered: '#10b981',
    Cancelled: '#ef4444',
    Refunded: '#6b7280',
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1>Dashboard 📊</h1>
          <p>Welcome back, Admin! Here's what's happening.</p>
        </div>
        <div className={styles.dateInfo}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.link}
            className={styles.statCard}
            style={{ '--card-color': card.color }}
          >
            <div className={styles.statIcon}>{card.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>
                {loading ? '...' : card.value}
              </div>
              <div className={styles.statLabel}>{card.label}</div>
            </div>
            <div className={styles.statArrow}>→</div>
          </Link>
        ))}
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div className={styles.section}>
        <h2>Quick Actions</h2>
        <div className={styles.quickActions}>
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={styles.quickAction}
              style={{ '--action-color': action.color }}
            >
              <span className={styles.qaIcon}>{action.icon}</span>
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ===== RECENT ORDERS ===== */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Orders</h2>
          <Link href="/admin/orders" className={styles.viewAll}>
            View All →
          </Link>
        </div>
        <div className={styles.ordersTable}>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.loading}>
                    ⏳ Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.loading}>
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  // ✅ Use order.id not order._id
                  <tr key={order.id}>
                    <td className={styles.orderId}>
                      #{order.id?.slice(-8)?.toUpperCase()}
                    </td>
                    <td>{order.user?.name || 'Customer'}</td>
                    <td>₹{order.totalPrice?.toLocaleString('en-IN')}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{
                          background: `${STATUS_COLOR[order.orderStatus] || '#888'}20`,
                          color: STATUS_COLOR[order.orderStatus] || '#888',
                        }}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      {/* ✅ Use order.id not order._id */}
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className={styles.viewBtn}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}