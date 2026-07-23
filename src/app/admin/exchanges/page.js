// src/app/admin/exchanges/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:          { label: 'Pending',         color: '#F59E0B', bg: '#FEF3C7' },
  approved:         { label: 'Approved',        color: '#3B82F6', bg: '#DBEAFE' },
  picked_up:        { label: 'Picked Up',       color: '#8B5CF6', bg: '#EDE9FE' },
  received:         { label: 'Received',        color: '#6366F1', bg: '#E0E7FF' },
  verified:         { label: 'Verified',        color: '#10B981', bg: '#D1FAE5' },
  awaiting_payment: { label: 'Awaiting Pay',    color: '#F97316', bg: '#FFEDD5' },
  ready_to_ship:    { label: 'Ready to Ship',   color: '#10B981', bg: '#D1FAE5' },
  shipped:          { label: 'Shipped',         color: '#06B6D4', bg: '#CFFAFE' },
  completed:        { label: 'Completed',       color: '#10B981', bg: '#D1FAE5' },
  rejected:         { label: 'Rejected',        color: '#EF4444', bg: '#FEE2E2' },
};

export default function AdminExchangesPage() {
  const [exchanges, setExchanges] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');
  const [stats,     setStats]     = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/exchanges/${deleteTarget.id}?hard=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      toast.success('🗑️ Exchange deleted successfully');
      setExchanges(prev => prev.filter(e => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
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
        <p>⏳ Loading exchanges...</p>
      </div>
    );
  }

  return (
    <div className="ex-page">
      {/* HEADER */}
      <div className="ex-header">
        <h1>Exchanges 🔄</h1>
        <p>Manage all product exchange requests</p>
      </div>

      {/* STATS */}
      <div className="ex-stats">
        {[
          { label: 'Total',       value: stats.total      || 0, color: '#6b7280' },
          { label: 'Pending',     value: stats.pending    || 0, color: '#F59E0B' },
          { label: 'Approved',    value: stats.approved   || 0, color: '#3B82F6' },
          { label: 'In Progress', value: stats.inProgress || 0, color: '#8B5CF6' },
          { label: 'Completed',   value: stats.completed  || 0, color: '#10B981' },
          { label: 'Rejected',    value: stats.rejected   || 0, color: '#EF4444' },
        ].map(s => (
          <div key={s.label} className="ex-stat" style={{ borderLeftColor: s.color }}>
            <span className="ex-stat-label">{s.label}</span>
            <span className="ex-stat-value" style={{ color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="ex-filters">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by ID, customer, or product..."
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="picked_up">Picked Up</option>
          <option value="received">Received</option>
          <option value="verified">Verified</option>
          <option value="awaiting_payment">Awaiting Payment</option>
          <option value="ready_to_ship">Ready to Ship</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* EMPTY */}
      {filtered.length === 0 ? (
        <div className="ex-empty">
          <p>📭 No exchanges found</p>
        </div>
      ) : (
        <>
          {/* ═══════ DESKTOP TABLE ═══════ */}
          <div className="ex-table-wrap">
            <table className="ex-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Order</th>
                  <th>Old Product</th>
                  <th>New Product</th>
                  <th>Price Diff</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ex => {
                  const cfg = STATUS_CONFIG[ex.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={ex.id}>
                      <td><code>#{ex.id?.slice(-8).toUpperCase()}</code></td>
                      <td>
                        <div className="ex-user">
                          <strong>{ex.user?.name || 'Unknown'}</strong>
                          <small>{ex.user?.email}</small>
                        </div>
                      </td>
                      <td>
                        <Link href={`/admin/orders/${ex.orderId}`} className="ex-link">
                          #{ex.orderId?.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        <div className="ex-prod">
                          <span>{ex.oldProductName}</span>
                          <strong className="ex-old-price">₹{ex.oldPrice}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="ex-prod">
                          <span>{ex.newProductName}</span>
                          <strong className="ex-new-price">₹{ex.newPrice}</strong>
                        </div>
                      </td>
                      <td>
                        {ex.priceDifference === 0 ? (
                          <span className="ex-diff-zero">—</span>
                        ) : ex.priceDifference > 0 ? (
                          <span className="ex-diff-pay">+₹{ex.priceDifference}</span>
                        ) : (
                          <span className="ex-diff-refund">−₹{Math.abs(ex.priceDifference)}</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="ex-status"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <small>
                          {new Date(ex.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: '2-digit',
                          })}
                        </small>
                      </td>
                      <td>
                        <div className="ex-actions">
                          <Link href={`/admin/exchanges/${ex.id}`} className="ex-btn ex-btn-view">
                            View
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(ex)}
                            className="ex-btn ex-btn-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ═══════ MOBILE CARDS ═══════ */}
          <div className="ex-cards">
            {filtered.map(ex => {
              const cfg = STATUS_CONFIG[ex.status] || STATUS_CONFIG.pending;
              return (
                <div key={ex.id} className="ex-card" style={{ borderTopColor: cfg.color }}>
                  {/* Top Row: ID + Status */}
                  <div className="ex-card-top">
                    <code className="ex-card-id">#{ex.id?.slice(-8).toUpperCase()}</code>
                    <span
                      className="ex-status"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {/* Customer Section */}
                  <div className="ex-card-section">
                    <div className="ex-card-label">👤 Customer</div>
                    <div className="ex-card-user">
                      <strong>{ex.user?.name || 'Unknown'}</strong>
                      <small>{ex.user?.email}</small>
                    </div>
                  </div>

                  {/* Order Section */}
                  <div className="ex-card-section">
                    <div className="ex-card-label">📦 Order</div>
                    <Link href={`/admin/orders/${ex.orderId}`} className="ex-link">
                      #{ex.orderId?.slice(-8).toUpperCase()}
                    </Link>
                  </div>

                  {/* Products Section */}
                  <div className="ex-card-products">
                    <div className="ex-card-prod ex-card-prod-old">
                      <div className="ex-prod-label">🔴 Old Product</div>
                      <div className="ex-prod-name">{ex.oldProductName}</div>
                      <strong className="ex-old-price">₹{ex.oldPrice}</strong>
                    </div>

                    <div className="ex-arrow">→</div>

                    <div className="ex-card-prod ex-card-prod-new">
                      <div className="ex-prod-label">🟢 New Product</div>
                      <div className="ex-prod-name">{ex.newProductName}</div>
                      <strong className="ex-new-price">₹{ex.newPrice}</strong>
                    </div>
                  </div>

                  {/* Price Diff + Date */}
                  <div className="ex-card-meta">
                    <div>
                      <div className="ex-card-label">💰 Price Diff</div>
                      <div className="ex-meta-value">
                        {ex.priceDifference === 0 ? (
                          <span className="ex-diff-zero">—</span>
                        ) : ex.priceDifference > 0 ? (
                          <span className="ex-diff-pay">+₹{ex.priceDifference}</span>
                        ) : (
                          <span className="ex-diff-refund">−₹{Math.abs(ex.priceDifference)}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="ex-card-label">📅 Date</div>
                      <div className="ex-meta-value ex-card-date">
                        {new Date(ex.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ex-card-actions">
                    <Link href={`/admin/exchanges/${ex.id}`} className="ex-btn ex-btn-view">
                      👁️ View Details
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(ex)}
                      className="ex-btn ex-btn-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div
          className="ex-modal-overlay"
          onClick={e => e.target === e.currentTarget && !deleting && setDeleteTarget(null)}
        >
          <div className="ex-modal">
            <div className="ex-modal-header">
              <h3>Delete Exchange</h3>
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                disabled={deleting}
              >
                ✕
              </button>
            </div>
            <div className="ex-modal-body">
              <p>
                Permanently delete exchange{' '}
                <strong>#{deleteTarget.id?.slice(-8).toUpperCase()}</strong>?
              </p>
              <p className="ex-warn">⚠️ This action cannot be undone.</p>
            </div>
            <div className="ex-modal-actions">
              <button
                onClick={() => setDeleteTarget(null)}
                className="ex-btn ex-btn-cancel"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="ex-btn ex-btn-delete"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ═══════ BASE PAGE ═══════ */
        .ex-page {
          font-family: 'Nunito', sans-serif;
          padding: clamp(8px, 2vw, 16px);
          max-width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        /* ═══════ LOADING / EMPTY ═══════ */
        .ex-loading, .ex-empty {
          text-align: center;
          padding: 60px 20px;
          color: #666;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          font-size: 0.9rem;
        }

        /* ═══════ HEADER ═══════ */
        .ex-header { margin-bottom: 20px; }
        .ex-header h1 {
          font-size: clamp(1.3rem, 4vw, 1.6rem);
          margin: 0 0 4px;
          color: #1f2937;
          font-weight: 800;
        }
        .ex-header p {
          margin: 0;
          color: #6b7280;
          font-size: 0.85rem;
        }

        /* ═══════ STATS ═══════ */
        .ex-stats {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        .ex-stat {
          background: white;
          border: 1px solid #e5e7eb;
          border-left: 4px solid #6b7280;
          border-radius: 8px;
          padding: 14px 12px;
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .ex-stat:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .ex-stat-label {
          font-size: 0.7rem;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.4px;
        }
        .ex-stat-value {
          font-size: clamp(1.4rem, 4vw, 1.7rem);
          font-weight: 800;
          margin-top: 6px;
          line-height: 1;
        }

        /* ═══════ FILTERS ═══════ */
        .ex-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }
        .ex-filters input {
          flex: 1;
          min-width: 0;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.9rem;
          outline: none;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .ex-filters select {
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.9rem;
          background: white;
          cursor: pointer;
          font-family: inherit;
          min-width: 180px;
        }
        .ex-filters input:focus,
        .ex-filters select:focus { border-color: #7c3aed; }

        /* ═══════ DESKTOP TABLE ═══════ */
        .ex-table-wrap {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow-x: auto;
          display: block;
        }
        .ex-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }
        .ex-table thead {
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }
        .ex-table th {
          text-align: left;
          padding: 12px;
          font-weight: 700;
          color: #374151;
          font-size: 0.75rem;
          text-transform: uppercase;
          white-space: nowrap;
          letter-spacing: 0.3px;
        }
        .ex-table td {
          padding: 12px;
          border-bottom: 1px solid #f3f4f6;
          color: #1f2937;
          vertical-align: middle;
        }
        .ex-table tbody tr:hover { background: #f9fafb; }
        .ex-table tbody tr:last-child td { border-bottom: none; }

        .ex-table code {
          font-family: monospace;
          font-size: 0.78rem;
          color: #7c3aed;
          font-weight: 700;
        }

        .ex-user {
          display: flex;
          flex-direction: column;
          min-width: 0;
          max-width: 200px;
        }
        .ex-user strong {
          font-size: 0.85rem;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ex-user small {
          font-size: 0.72rem;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ex-link {
          color: #7c3aed;
          text-decoration: none;
          font-family: monospace;
          font-size: 0.82rem;
          font-weight: 700;
        }
        .ex-link:hover { text-decoration: underline; }

        .ex-prod {
          display: flex;
          flex-direction: column;
          max-width: 180px;
          gap: 3px;
        }
        .ex-prod span {
          font-size: 0.82rem;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ex-old-price { color: #dc2626; font-size: 0.85rem; font-weight: 700; }
        .ex-new-price { color: #059669; font-size: 0.85rem; font-weight: 700; }

        .ex-diff-zero   { color: #9ca3af; font-weight: 600; }
        .ex-diff-pay    { color: #d97706; font-weight: 700; }
        .ex-diff-refund { color: #2563eb; font-weight: 700; }

        .ex-status {
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          display: inline-block;
        }

        /* ═══════ BUTTONS ═══════ */
        .ex-actions {
          display: flex;
          gap: 6px;
        }
        .ex-btn {
          padding: 7px 14px;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          transition: all 0.15s;
        }
        .ex-btn-view {
          background: #7c3aed;
          color: white;
        }
        .ex-btn-view:hover { background: #6d28d9; }
        .ex-btn-delete {
          background: #ef4444;
          color: white;
        }
        .ex-btn-delete:hover { background: #dc2626; }
        .ex-btn-cancel {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        .ex-btn-cancel:hover { background: #f3f4f6; }
        .ex-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ═══════ MOBILE CARDS (hidden by default) ═══════ */
        .ex-cards {
          display: none;
          flex-direction: column;
          gap: 14px;
        }
        .ex-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-top: 4px solid #7c3aed;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .ex-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px dashed #e5e7eb;
        }
        .ex-card-id {
          font-family: monospace;
          font-size: 0.88rem;
          color: #7c3aed;
          font-weight: 700;
        }
        .ex-card-section {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .ex-card-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ex-card-user {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .ex-card-user strong {
          font-size: 0.92rem;
          color: #1f2937;
          font-weight: 700;
        }
        .ex-card-user small {
          font-size: 0.76rem;
          color: #6b7280;
          word-break: break-all;
        }
        .ex-card-products {
          display: flex;
          align-items: stretch;
          gap: 8px;
          background: #f9fafb;
          padding: 12px;
          border-radius: 10px;
        }
        .ex-card-prod {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 10px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .ex-card-prod-old { border-left: 3px solid #dc2626; }
        .ex-card-prod-new { border-left: 3px solid #059669; }
        .ex-prod-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .ex-prod-name {
          font-size: 0.84rem;
          color: #1f2937;
          font-weight: 600;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.35;
          min-height: 2.3em;
        }
        .ex-arrow {
          color: #7c3aed;
          font-size: 1.4rem;
          font-weight: 800;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
        .ex-card-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          padding: 12px;
          background: #fafafa;
          border-radius: 8px;
        }
        .ex-card-meta > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ex-meta-value {
          font-size: 0.9rem;
          font-weight: 700;
        }
        .ex-card-date {
          color: #374151;
        }
        .ex-card-actions {
          display: flex;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px dashed #e5e7eb;
        }
        .ex-card-actions .ex-btn {
          flex: 1;
          padding: 11px 12px;
          font-size: 0.85rem;
        }

        /* ═══════ MODAL ═══════ */
        .ex-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .ex-modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          font-family: 'Nunito', sans-serif;
        }
        .ex-modal-header {
          padding: 14px 18px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ex-modal-header h3 {
          margin: 0;
          font-size: 1rem;
          color: #1f2937;
          font-weight: 700;
        }
        .ex-modal-header button {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #6b7280;
        }
        .ex-modal-body {
          padding: 18px;
          font-size: 0.9rem;
          color: #374151;
        }
        .ex-modal-body p { margin: 0 0 8px; }
        .ex-warn { color: #ef4444; font-weight: 600; }
        .ex-modal-actions {
          padding: 0 18px 18px;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .ex-modal-actions .ex-btn { padding: 9px 18px; }

        /* ═══════ RESPONSIVE BREAKPOINTS ═══════ */

        /* Large tablet & below */
        @media (max-width: 1200px) {
          .ex-stats { grid-template-columns: repeat(3, 1fr); }
        }

        /* Tablet: SWITCH to card layout */
        @media (max-width: 900px) {
          .ex-table-wrap { display: none; }
          .ex-cards { display: flex; }
        }

        /* Small tablet */
        @media (max-width: 700px) {
          .ex-stats {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
        }

        /* Mobile */
        @media (max-width: 600px) {
          .ex-filters {
            flex-direction: column;
            gap: 10px;
          }
          .ex-filters select { min-width: 100%; }
          .ex-stat { padding: 12px 10px; }
        }

        /* Small mobile */
        @media (max-width: 420px) {
          .ex-card-meta {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .ex-card-products {
            flex-direction: column;
            align-items: stretch;
          }
          .ex-arrow {
            justify-content: center;
            transform: rotate(90deg);
            padding: 4px 0;
          }
          .ex-card-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}