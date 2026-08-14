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
  const [stats,           setStats]           = useState(null);
  const [orders,          setOrders]          = useState([]);
  const [lowStockItems,   setLowStockItems]   = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [threshold,       setThreshold]       = useState(5);
  const [loading,         setLoading]         = useState(true);
  const [showAllLow,      setShowAllLow]      = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders?limit=5').then(r => r.json()),
      fetch('/api/admin/dashboard').then(r => r.json()),
    ]).then(([ordersData, dashboardData]) => {
      setOrders(ordersData.orders || []);
      setStats({
        orders:              ordersData.pagination?.total || 0,
        totalProductUnits:   dashboardData.stats?.totalProductUnits || 0,
        totalUniqueProducts: dashboardData.stats?.totalUniqueProducts || 0,
        categories:          dashboardData.stats?.categories || 0,
        revenue:             dashboardData.stats?.revenue || 0,
        lowStockCount:       dashboardData.stats?.lowStockCount || 0,
        outOfStockCount:     dashboardData.stats?.outOfStockCount || 0,
      });
      setLowStockItems(dashboardData.lowStockItems || []);
      setOutOfStockItems(dashboardData.outOfStockItems || []);
      setThreshold(dashboardData.threshold || 5);
      setLoading(false);
    }).catch((err) => {
      console.error('Dashboard load error:', err);
      setLoading(false);
    });
  }, []);

  const statCards = [
    {
      icon: '🛍️', label: 'Total Orders',
      value: stats?.orders ?? '—',
      color: '#f97316', link: '/admin/orders',
    },
    {
      icon: '📦', label: 'Total Products',
      value: stats?.totalProductUnits ?? '—',
      subtitle: stats?.totalUniqueProducts
        ? `${stats.totalUniqueProducts} unique products`
        : '',
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

  const displayLowStock = showAllLow ? lowStockItems : lowStockItems.slice(0, 6);

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
              {card.subtitle && !loading && (
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginTop: '4px',
                  fontWeight: '600',
                }}>
                  {card.subtitle}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════
          ⚠️ INVENTORY ALERTS SECTION
          ═══════════════════════════════════════ */}
      {!loading && (stats?.lowStockCount > 0 || stats?.outOfStockCount > 0) && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              ⚠️ Inventory Alerts
            </h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {stats?.outOfStockCount > 0 && (
                <span style={{
                  padding: '5px 14px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: '1.5px solid #fca5a5',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '800',
                }}>
                  ❌ {stats.outOfStockCount} Out of Stock
                </span>
              )}
              {stats?.lowStockCount > 0 && (
                <span style={{
                  padding: '5px 14px',
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1.5px solid #fde68a',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: '800',
                }}>
                  ⚠️ {stats.lowStockCount} Low Stock (≤{threshold})
                </span>
              )}
            </div>
          </div>

          {/* Out of Stock — Show first if any */}
          {outOfStockItems.length > 0 && (
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #fef2f2, #fef2f2)',
              border: '2px solid #fca5a5',
              borderRadius: '14px',
              marginBottom: lowStockItems.length > 0 ? '16px' : 0,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  ❌ Out of Stock ({outOfStockItems.length})
                </h3>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '10px',
              }}>
                {outOfStockItems.slice(0, 8).map((item, idx) => (
                  <StockItemCard key={`out-${idx}`} item={item} isOutOfStock />
                ))}
              </div>
            </div>
          )}

          {/* Low Stock */}
          {lowStockItems.length > 0 && (
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              border: '2px solid #fde68a',
              borderRadius: '14px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  ⚠️ Low Stock (≤ {threshold} units)
                </h3>
                {lowStockItems.length > 6 && (
                  <button
                    onClick={() => setShowAllLow(!showAllLow)}
                    style={{
                      background: 'white',
                      border: '1.5px solid #f59e0b',
                      borderRadius: '999px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#92400e',
                      cursor: 'pointer',
                    }}
                  >
                    {showAllLow ? '← Show less' : `Show all ${lowStockItems.length} →`}
                  </button>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '10px',
              }}>
                {displayLowStock.map((item, idx) => (
                  <StockItemCard key={`low-${idx}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

        {/* Desktop Table */}
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
                  <td colSpan={6} className={styles.emptyCell}>Loading…</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>No orders yet</td>
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
                        <span className={styles.dot} style={{ background: sc.dot }} />
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

        {/* Mobile Cards */}
        <div className={styles.mobileOrders}>
          {loading ? (
            <div className={styles.emptyCell}>Loading…</div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyCell}>No orders yet</div>
          ) : orders.map((order) => {
            const sc = STATUS_CFG[order.orderStatus] || STATUS_CFG.Refunded;
            return (
              <div key={order.id} className={styles.mobileOrderCard}>
                <div className={styles.mobileOrderTop}>
                  <span className={styles.mobileOrderId}>
                    #{order.id?.slice(-8)?.toUpperCase()}
                  </span>
                  <span
                    className={styles.badge}
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    <span className={styles.dot} style={{ background: sc.dot }} />
                    {order.orderStatus}
                  </span>
                </div>
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

/* ═══════════════════════════════════════
   STOCK ITEM CARD COMPONENT
═══════════════════════════════════════ */
function StockItemCard({ item, isOutOfStock = false }) {
  const displayPrice = item.discountPrice || item.price;

  return (
    <Link
      href={`/admin/products/${item.id}`}
      style={{
        display: 'flex',
        gap: '10px',
        padding: '10px',
        background: 'white',
        border: `1.5px solid ${isOutOfStock ? '#fca5a5' : '#fde68a'}`,
        borderRadius: '10px',
        textDecoration: 'none',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = isOutOfStock
          ? '0 6px 16px rgba(220,38,38,0.15)'
          : '0 6px 16px rgba(245,158,11,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image */}
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: '8px',
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        border: '1px solid #e5e7eb',
      }}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span style={{ fontSize: '1.5rem' }}>📦</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: '12.5px',
          fontWeight: '800',
          color: '#1f2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}>
          {item.name}
        </p>

        {/* Variant info */}
        {item.isVariant && item.variantName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginTop: '3px',
          }}>
            {item.variantHex && (
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: item.variantHex,
                border: '1px solid #ddd',
                flexShrink: 0,
              }} />
            )}
            <span style={{
              fontSize: '10.5px',
              fontWeight: '700',
              color: '#6b7280',
            }}>
              {item.variantName}
            </span>
          </div>
        )}

        <p style={{
          margin: '3px 0 0',
          fontSize: '10.5px',
          color: '#9ca3af',
          fontWeight: '600',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          🗂️ {item.category}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          marginTop: '5px',
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '800',
            color: '#059669',
          }}>
            ₹{displayPrice?.toLocaleString('en-IN')}
          </span>

          <span style={{
            padding: '2px 8px',
            background: isOutOfStock ? '#dc2626' : '#f59e0b',
            color: 'white',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: '800',
          }}>
            {isOutOfStock ? '❌ 0 left' : `⚠️ ${item.stock} left`}
          </span>
        </div>
      </div>
    </Link>
  );
}