// src/app/admin/exchanges/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:          { label: 'Pending',         color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
  approved:         { label: 'Approved',        color: '#3B82F6', bg: '#DBEAFE', icon: '✅' },
  picked_up:        { label: 'Picked Up',       color: '#8B5CF6', bg: '#EDE9FE', icon: '📦' },
  received:         { label: 'Received',        color: '#6366F1', bg: '#E0E7FF', icon: '📬' },
  verified:         { label: 'Verified',        color: '#10B981', bg: '#D1FAE5', icon: '🔍' },
  awaiting_payment: { label: 'Awaiting Pay',    color: '#F97316', bg: '#FFEDD5', icon: '💳' },
  ready_to_ship:    { label: 'Ready to Ship',   color: '#10B981', bg: '#D1FAE5', icon: '🎁' },
  shipped:          { label: 'Shipped',         color: '#06B6D4', bg: '#CFFAFE', icon: '🚚' },
  completed:        { label: 'Completed',       color: '#10B981', bg: '#D1FAE5', icon: '🎉' },
  rejected:         { label: 'Rejected',        color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
};

export default function AdminExchangesPage() {
  const [exchanges, setExchanges] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [stats,     setStats]     = useState({});

  useEffect(() => { fetchExchanges(); }, [filter]);

  const fetchExchanges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter !== 'all') params.append('status', filter);

      const res  = await fetch(`/api/exchanges?${params}`);
      const data = await res.json();
      const list = data.exchanges || [];
      setExchanges(list);

      setStats({
        total:      list.length,
        pending:    list.filter(e => e.status === 'pending').length,
        approved:   list.filter(e => e.status === 'approved').length,
        inProgress: list.filter(e => ['picked_up','received','verified','awaiting_payment','ready_to_ship','shipped'].includes(e.status)).length,
        completed:  list.filter(e => e.status === 'completed').length,
        rejected:   list.filter(e => e.status === 'rejected').length,
      });
    } catch {
      toast.error('Failed to load exchanges');
    } finally {
      setLoading(false);
    }
  };

  const filtered = exchanges.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.id?.toLowerCase().includes(q)         ||
      e.orderId?.toLowerCase().includes(q)    ||
      e.user?.name?.toLowerCase().includes(q) ||
      e.user?.email?.toLowerCase().includes(q)||
      e.oldProductName?.toLowerCase().includes(q) ||
      e.newProductName?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="ex-loading">
        <div className="ex-loading-icon">⏳</div>
        <p>Loading exchanges...</p>
      </div>
    );
  }

  return (
    <div className="ex-page">
      {/* HEADER */}
      <div className="ex-header">
        <div>
          <h1 className="ex-title">Exchanges 🔄</h1>
          <p className="ex-subtitle">Manage all product exchange requests</p>
        </div>
      </div>

      {/* STATS */}
      <div className="ex-stats">
        {[
          { label: 'Total',       value: stats.total      || 0, color: '#7C3AED', bg: '#F3E8FF', icon: '📊' },
          { label: 'Pending',     value: stats.pending    || 0, color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
          { label: 'Approved',    value: stats.approved   || 0, color: '#3B82F6', bg: '#DBEAFE', icon: '✅' },
          { label: 'In Progress', value: stats.inProgress || 0, color: '#8B5CF6', bg: '#EDE9FE', icon: '⏳' },
          { label: 'Completed',   value: stats.completed  || 0, color: '#10B981', bg: '#D1FAE5', icon: '🎉' },
          { label: 'Rejected',    value: stats.rejected   || 0, color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
        ].map(s => (
          <div key={s.label} className="ex-stat-card" style={{ borderColor: `${s.color}25` }}>
            <div className="ex-stat-icon" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div className="ex-stat-info">
              <span className="ex-stat-label">{s.label}</span>
              <span className="ex-stat-value" style={{ color: s.color }}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="ex-filters">
        <div className="ex-search-box">
          <span className="ex-search-icon">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, customer, or product..."
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="ex-filter-select">
          <option value="all">All Statuses</option>
          <option value="pending">🟡 Pending</option>
          <option value="approved">✅ Approved</option>
          <option value="picked_up">📦 Picked Up</option>
          <option value="received">📬 Received</option>
          <option value="verified">🔍 Verified</option>
          <option value="awaiting_payment">💳 Awaiting Payment</option>
          <option value="ready_to_ship">🎁 Ready to Ship</option>
          <option value="shipped">🚚 Shipped</option>
          <option value="completed">🎉 Completed</option>
          <option value="rejected">❌ Rejected</option>
        </select>
      </div>

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="ex-empty">
          <div className="ex-empty-icon">🔄</div>
          <h3>No exchanges found</h3>
          <p>{search ? 'Try a different search term' : 'No exchange requests at the moment'}</p>
        </div>
      )}

      {/* CARDS */}
      <div className="ex-list">
        {filtered.map(ex => {
          const cfg = STATUS_CONFIG[ex.status] || STATUS_CONFIG.pending;
          return (
            <div key={ex.id} className="ex-card" style={{ borderColor: `${cfg.color}30` }}>
              {/* Top bar */}
              <div className="ex-card-top" style={{ background: cfg.bg, borderColor: `${cfg.color}20` }}>
                <div className="ex-card-top-left">
                  <span className="ex-status-pill" style={{ color: cfg.color, borderColor: `${cfg.color}40` }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <code className="ex-id" style={{ color: cfg.color }}>
                    #{ex.id?.slice(-8).toUpperCase()}
                  </code>
                </div>
                <span className="ex-date" style={{ color: cfg.color }}>
                  {new Date(ex.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: '2-digit',
                  })}
                </span>
              </div>

              {/* Body */}
              <div className="ex-card-body">
                {/* Customer */}
                <div className="ex-customer">
                  <div className="ex-customer-info">
                    <p className="ex-customer-name">👤 {ex.user?.name || 'Unknown'}</p>
                    <p className="ex-customer-email">{ex.user?.email}</p>
                  </div>
                  <Link href={`/admin/orders/${ex.orderId}`} className="ex-order-link">
                    Order #{ex.orderId?.slice(-8).toUpperCase()}
                  </Link>
                </div>

                {/* Products */}
                <div className="ex-products">
                  <div className="ex-product ex-product-old">
                    <img src={ex.oldProductImage || 'https://via.placeholder.com/50'} alt="" />
                    <div className="ex-product-info">
                      <p className="ex-product-name">↩️ {ex.oldProductName}</p>
                      <strong className="ex-product-price ex-price-old">
                        ₹{ex.oldPrice?.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  <span className="ex-arrow">→</span>

                  <div className="ex-product ex-product-new">
                    <img src={ex.newProductImage || 'https://via.placeholder.com/50'} alt="" />
                    <div className="ex-product-info">
                      <p className="ex-product-name">📦 {ex.newProductName}</p>
                      <strong className="ex-product-price ex-price-new">
                        ₹{ex.newPrice?.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="ex-tags">
                  {ex.priceDifference !== 0 && (
                    <span className={`ex-tag ${ex.priceDifference > 0 ? 'ex-tag-pay' : 'ex-tag-refund'}`}>
                      {ex.priceDifference > 0 ? '💰' : '💸'}
                      {ex.priceDifference > 0
                        ? ` Customer pays +₹${ex.priceDifference}`
                        : ` Refund −₹${Math.abs(ex.priceDifference)}`}
                    </span>
                  )}
                  <span className="ex-reason">📝 {ex.reason}</span>
                </div>

                {/* CTA */}
                <Link href={`/admin/exchanges/${ex.id}`} className="ex-view-btn">
                  👁️ View & Manage →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .ex-page {
          font-family: 'Nunito', sans-serif;
          padding: 4px;
          max-width: 100%;
        }

        /* LOADING */
        .ex-loading {
          text-align: center;
          padding: 80px 20px;
          color: #9585B0;
          font-family: 'Nunito', sans-serif;
        }
        .ex-loading-icon { font-size: 2.5rem; margin-bottom: 12px; }
        .ex-loading p { font-weight: 700; margin: 0; }

        /* HEADER */
        .ex-header { margin-bottom: 24px; }
        .ex-title {
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0 0 4px;
          color: #2D1A4A;
        }
        .ex-subtitle {
          color: #9585B0;
          margin: 0;
          font-size: 0.86rem;
          font-weight: 600;
        }

        /* STATS GRID */
        .ex-stats {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .ex-stat-card {
          background: white;
          border: 1.5px solid;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .ex-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .ex-stat-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .ex-stat-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #9585B0;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          white-space: nowrap;
        }
        .ex-stat-value {
          font-size: 1.4rem;
          font-weight: 900;
          line-height: 1.2;
          margin-top: 2px;
        }

        /* FILTERS */
        .ex-filters {
          background: white;
          border: 1.5px solid #EDD9FF;
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 10px;
        }
        .ex-search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .ex-search-icon {
          position: absolute;
          left: 14px;
          font-size: 0.95rem;
          pointer-events: none;
        }
        .ex-search-box input {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border: 1.5px solid #EDD9FF;
          border-radius: 10px;
          font-size: 0.88rem;
          font-family: inherit;
          outline: none;
          color: #2D1A4A;
          box-sizing: border-box;
        }
        .ex-search-box input:focus { border-color: #7C3AED; }

        .ex-filter-select {
          padding: 10px 14px;
          border: 1.5px solid #EDD9FF;
          border-radius: 10px;
          font-size: 0.88rem;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          background: white;
          color: #2D1A4A;
          font-weight: 700;
        }

        /* EMPTY */
        .ex-empty {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          border: 2px dashed #EDD9FF;
        }
        .ex-empty-icon { font-size: 3rem; margin-bottom: 12px; }
        .ex-empty h3 { color: #2D1A4A; margin: 0 0 8px; font-size: 1.1rem; }
        .ex-empty p { color: #9585B0; margin: 0; font-weight: 600; font-size: 0.88rem; }

        /* LIST */
        .ex-list {
          display: grid;
          gap: 14px;
        }

        /* CARD */
        .ex-card {
          background: white;
          border-radius: 14px;
          border: 1.5px solid;
          overflow: hidden;
        }

        /* CARD TOP */
        .ex-card-top {
          padding: 8px 14px;
          border-bottom: 1px solid;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ex-card-top-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ex-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          background: white;
          border-radius: 999px;
          font-size: 0.74rem;
          font-weight: 800;
          border: 1.5px solid;
        }
        .ex-id {
          font-size: 0.76rem;
          font-weight: 800;
          font-family: monospace;
        }
        .ex-date {
          font-size: 0.74rem;
          font-weight: 700;
        }

        /* CARD BODY */
        .ex-card-body {
          padding: 14px;
        }

        /* CUSTOMER */
        .ex-customer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          padding: 10px 12px;
          background: #FBF7FF;
          border-radius: 10px;
          margin-bottom: 12px;
        }
        .ex-customer-info { min-width: 0; }
        .ex-customer-name {
          margin: 0;
          font-size: 0.86rem;
          font-weight: 800;
          color: #2D1A4A;
        }
        .ex-customer-email {
          margin: 2px 0 0;
          font-size: 0.74rem;
          color: #9585B0;
          font-weight: 600;
        }
        .ex-order-link {
          font-size: 0.76rem;
          color: #7C3AED;
          font-weight: 700;
          text-decoration: none;
          font-family: monospace;
          padding: 4px 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #E9D5FF;
        }

        /* PRODUCTS */
        .ex-products {
          display: grid;
          grid-template-columns: 1fr 24px 1fr;
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
        }
        .ex-product {
          padding: 10px;
          border: 1.5px solid;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .ex-product-old { background: #FEF2F2; border-color: #FCA5A5; }
        .ex-product-new { background: #ECFDF5; border-color: #A7F3D0; }
        .ex-product img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .ex-product-info { min-width: 0; flex: 1; }
        .ex-product-name {
          margin: 0;
          font-size: 0.78rem;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ex-product-old .ex-product-name { color: #7F1D1D; }
        .ex-product-new .ex-product-name { color: #065F46; }
        .ex-product-price { font-size: 0.84rem; }
        .ex-price-old { color: #DC2626; }
        .ex-price-new { color: #10B981; }
        .ex-arrow {
          font-size: 1.3rem;
          color: #7C3AED;
          font-weight: 900;
          text-align: center;
        }

        /* TAGS */
        .ex-tags {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 12px;
        }
        .ex-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 800;
          border: 1px solid;
        }
        .ex-tag-pay    { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }
        .ex-tag-refund { background: #F0F9FF; color: #1E40AF; border-color: #BFDBFE; }
        .ex-reason {
          flex: 1;
          min-width: 120px;
          font-size: 0.8rem;
          color: #6B4E8A;
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* CTA */
        .ex-view-btn {
          display: block;
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #FF6B9D, #7C3AED);
          color: white;
          border-radius: 10px;
          font-size: 0.86rem;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
          box-sizing: border-box;
          transition: opacity 0.2s;
        }
        .ex-view-btn:hover { opacity: 0.92; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .ex-stats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 720px) {
          .ex-filters { grid-template-columns: 1fr; }
          .ex-filter-select { width: 100%; }
        }
        @media (max-width: 600px) {
          .ex-stats { grid-template-columns: repeat(2, 1fr); }
          .ex-products {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .ex-arrow {
            transform: rotate(90deg);
            font-size: 1.1rem;
          }
          .ex-customer {
            flex-direction: column;
            align-items: flex-start;
          }
          .ex-order-link { width: 100%; text-align: center; box-sizing: border-box; }
        }
        @media (max-width: 400px) {
          .ex-stats { grid-template-columns: 1fr; }
          .ex-title { font-size: 1.3rem; }
          .ex-stat-value { font-size: 1.2rem; }
        }
      `}</style>
    </div>
  );
}