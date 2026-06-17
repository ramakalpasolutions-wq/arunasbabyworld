'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:           { label: 'Pending',          color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
  approved:          { label: 'Approved',         color: '#3B82F6', bg: '#DBEAFE', icon: '✅' },
  picked_up:         { label: 'Picked Up',        color: '#8B5CF6', bg: '#EDE9FE', icon: '📦' },
  received:          { label: 'Received',         color: '#6366F1', bg: '#E0E7FF', icon: '📬' },
  verified:          { label: 'Verified',         color: '#10B981', bg: '#D1FAE5', icon: '🔍' },
  awaiting_payment:  { label: 'Awaiting Pay',     color: '#F97316', bg: '#FFEDD5', icon: '💳' },
  ready_to_ship:     { label: 'Ready to Ship',    color: '#10B981', bg: '#D1FAE5', icon: '🎁' },
  shipped:           { label: 'Shipped',          color: '#06B6D4', bg: '#CFFAFE', icon: '🚚' },
  completed:         { label: 'Completed',        color: '#10B981', bg: '#D1FAE5', icon: '🎉' },
  rejected:          { label: 'Rejected',         color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
};

export default function AdminExchangesPage() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [stats, setStats]         = useState({});

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

      // Calculate stats
      setStats({
        total:     list.length,
        pending:   list.filter(e => e.status === 'pending').length,
        approved:  list.filter(e => e.status === 'approved').length,
        inProgress: list.filter(e => ['picked_up', 'received', 'verified', 'awaiting_payment', 'ready_to_ship', 'shipped'].includes(e.status)).length,
        completed: list.filter(e => e.status === 'completed').length,
        rejected:  list.filter(e => e.status === 'rejected').length,
      });
    } catch (err) {
      toast.error('Failed to load exchanges');
    } finally {
      setLoading(false);
    }
  };

  const filtered = exchanges.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.id?.toLowerCase().includes(q)        ||
      e.orderId?.toLowerCase().includes(q)   ||
      e.user?.name?.toLowerCase().includes(q) ||
      e.user?.email?.toLowerCase().includes(q) ||
      e.oldProductName?.toLowerCase().includes(q) ||
      e.newProductName?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#9585B0', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
        <p style={{ fontWeight: '700' }}>Loading exchanges...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', padding: '4px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 4px', color: '#2D1A4A' }}>
          Exchanges 🔄
        </h1>
        <p style={{ color: '#9585B0', margin: 0, fontSize: '0.86rem', fontWeight: '600' }}>
          Manage all product exchange requests
        </p>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px', marginBottom: '24px',
      }}>
        {[
          { label: 'Total',       value: stats.total      || 0, color: '#7B2FBE', bg: '#F3E8FF', icon: '📊' },
          { label: 'Pending',     value: stats.pending    || 0, color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
          { label: 'Approved',    value: stats.approved   || 0, color: '#3B82F6', bg: '#DBEAFE', icon: '✅' },
          { label: 'In Progress', value: stats.inProgress || 0, color: '#8B5CF6', bg: '#EDE9FE', icon: '⏳' },
          { label: 'Completed',   value: stats.completed  || 0, color: '#10B981', bg: '#D1FAE5', icon: '🎉' },
          { label: 'Rejected',    value: stats.rejected   || 0, color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'white',
            border: `1.5px solid ${s.color}30`,
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: s.bg, color: s.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#9585B0', margin: 0, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                {s.label}
              </p>
              <p style={{ fontSize: '1.4rem', fontWeight: '900', color: s.color, margin: '2px 0 0', lineHeight: 1 }}>
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter ── */}
      <div style={{
        background: 'white',
        border: '1.5px solid #EDD9FF',
        borderRadius: '14px',
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex', gap: '12px', flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by ID, customer, or product..."
          style={{
            flex: '1 1 220px',
            padding: '10px 14px',
            border: '1.5px solid #EDD9FF', borderRadius: '10px',
            fontSize: '0.88rem', fontFamily: 'inherit',
            outline: 'none', color: '#2D1A4A',
          }}
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1.5px solid #EDD9FF', borderRadius: '10px',
            fontSize: '0.88rem', fontFamily: 'inherit',
            outline: 'none', cursor: 'pointer',
            background: 'white', color: '#2D1A4A', fontWeight: '700',
          }}
        >
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

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', borderRadius: '16px',
          border: '2px dashed #EDD9FF',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔄</div>
          <h3 style={{ color: '#2D1A4A', margin: '0 0 8px', fontSize: '1.1rem' }}>
            No exchanges found
          </h3>
          <p style={{ color: '#9585B0', margin: 0, fontWeight: '600', fontSize: '0.88rem' }}>
            {search ? 'Try a different search term' : 'No exchange requests at the moment'}
          </p>
        </div>
      )}

      {/* ── Exchange Cards ── */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filtered.map(ex => {
          const statusCfg = STATUS_CONFIG[ex.status] || STATUS_CONFIG.pending;

          return (
            <div key={ex.id} style={{
              background: 'white',
              borderRadius: '16px',
              border: `1.5px solid ${statusCfg.color}30`,
              overflow: 'hidden',
            }}>
              {/* Top bar */}
              <div style={{
                background: statusCfg.bg,
                padding: '10px 16px',
                borderBottom: `1px solid ${statusCfg.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 12px',
                    background: 'white',
                    color: statusCfg.color,
                    borderRadius: '999px',
                    fontSize: '0.76rem', fontWeight: '800',
                    border: `1.5px solid ${statusCfg.color}40`,
                  }}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                  <code style={{ fontSize: '0.78rem', color: statusCfg.color, fontWeight: '800' }}>
                    #{ex.id?.slice(-8).toUpperCase()}
                  </code>
                </div>
                <p style={{ margin: 0, fontSize: '0.74rem', color: statusCfg.color, fontWeight: '700' }}>
                  {new Date(ex.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: '2-digit',
                  })}
                </p>
              </div>

              {/* Body */}
              <div style={{ padding: '16px' }}>
                {/* Customer info */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', flexWrap: 'wrap',
                  gap: '10px', marginBottom: '14px',
                  padding: '10px 14px',
                  background: '#FBF7FF', borderRadius: '10px',
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: '800', color: '#2D1A4A' }}>
                      👤 {ex.user?.name || 'Unknown'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#9585B0', fontWeight: '600' }}>
                      {ex.user?.email}
                    </p>
                  </div>
                  <Link href={`/admin/orders/${ex.orderId}`} style={{
                    fontSize: '0.78rem', color: '#7B2FBE',
                    fontWeight: '700', textDecoration: 'none',
                    fontFamily: 'monospace',
                  }}>
                    Order #{ex.orderId?.slice(-8).toUpperCase()}
                  </Link>
                </div>

                {/* Product comparison */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '14px',
                }}>
                  {/* OLD */}
                  <div style={{
                    padding: '10px',
                    background: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <img
                      src={ex.oldProductImage || 'https://via.placeholder.com/50'}
                      alt={ex.oldProductName}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        margin: 0, fontSize: '0.78rem', fontWeight: '700', color: '#7F1D1D',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        ↩️ {ex.oldProductName}
                      </p>
                      <strong style={{ fontSize: '0.82rem', color: '#DC2626' }}>
                        ₹{ex.oldPrice?.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>

                  <span style={{ fontSize: '1.4rem', color: '#7B2FBE', fontWeight: '900' }}>→</span>

                  {/* NEW */}
                  <div style={{
                    padding: '10px',
                    background: '#ECFDF5',
                    border: '1.5px solid #A7F3D0',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <img
                      src={ex.newProductImage || 'https://via.placeholder.com/50'}
                      alt={ex.newProductName}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        margin: 0, fontSize: '0.78rem', fontWeight: '700', color: '#065F46',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        📦 {ex.newProductName}
                      </p>
                      <strong style={{ fontSize: '0.82rem', color: '#10B981' }}>
                        ₹{ex.newPrice?.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Price diff + reason */}
                <div style={{
                  display: 'flex', gap: '10px',
                  flexWrap: 'wrap', alignItems: 'center',
                  marginBottom: '14px',
                }}>
                  {ex.priceDifference !== 0 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 12px',
                      background: ex.priceDifference > 0 ? '#FFFBEB' : '#F0F9FF',
                      color: ex.priceDifference > 0 ? '#92400E' : '#1E40AF',
                      border: `1px solid ${ex.priceDifference > 0 ? '#FDE68A' : '#BFDBFE'}`,
                      borderRadius: '999px',
                      fontSize: '0.78rem', fontWeight: '800',
                    }}>
                      {ex.priceDifference > 0 ? '💰' : '💸'}
                      {ex.priceDifference > 0
                        ? `Customer pays +₹${ex.priceDifference}`
                        : `Refund −₹${Math.abs(ex.priceDifference)}`}
                    </span>
                  )}
                  <span style={{
                    flex: 1, minWidth: '100px',
                    fontSize: '0.8rem', color: '#6B4E8A', fontWeight: '600',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    📝 {ex.reason}
                  </span>
                </div>

                {/* View button */}
                <Link href={`/admin/exchanges/${ex.id}`} style={{
                  display: 'block', width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                  color: 'white', borderRadius: '10px',
                  fontSize: '0.86rem', fontWeight: '800',
                  textAlign: 'center', textDecoration: 'none',
                }}>
                  👁️ View & Manage →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}