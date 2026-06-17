'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
  processing:   { label: 'Processing',   color: '#3B82F6', bg: '#DBEAFE', icon: '⚙️' },
  completed:    { label: 'Completed',    color: '#10B981', bg: '#D1FAE5', icon: '✅' },
  failed:       { label: 'Failed',       color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
  not_required: { label: 'N/A',          color: '#6B7280', bg: '#F3F4F6', icon: 'ℹ️' },
};

const REFUND_TYPE_CONFIG = {
  razorpay:       { label: 'Razorpay Auto', emoji: '⚡', color: '#10B981' },
  upi_transfer:   { label: 'UPI Manual',    emoji: '📱', color: '#10B981' },
  bank_transfer:  { label: 'Bank Manual',   emoji: '🏦', color: '#3B82F6' },
  not_required:   { label: 'Not Required',  emoji: 'ℹ️', color: '#6B7280' },
};

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [stats, setStats]     = useState({
    total: 0, pending: 0, processing: 0, completed: 0, failed: 0,
    totalAmount: 0, completedAmount: 0,
  });

  useEffect(() => { fetchRefunds(); }, [filter]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter !== 'all') params.append('status', filter);

      const res  = await fetch(`/api/refunds?${params}`);
      const data = await res.json();
      const list = data.refunds || [];
      setRefunds(list);

      // Calculate stats
      const s = {
        total: list.length,
        pending:    list.filter(r => r.refundStatus === 'pending').length,
        processing: list.filter(r => r.refundStatus === 'processing').length,
        completed:  list.filter(r => r.refundStatus === 'completed').length,
        failed:     list.filter(r => r.refundStatus === 'failed').length,
        totalAmount:     list.reduce((sum, r) => sum + (r.amount || 0), 0),
        completedAmount: list.filter(r => r.refundStatus === 'completed').reduce((sum, r) => sum + (r.amount || 0), 0),
      };
      setStats(s);
    } catch (err) {
      toast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const filteredRefunds = refunds.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.id?.toLowerCase().includes(q)        ||
      r.orderId?.toLowerCase().includes(q)   ||
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#9585B0', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
        <p style={{ fontWeight: '700' }}>Loading refunds...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif', padding: '4px' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 4px', color: '#2D1A4A' }}>
            Refunds 💰
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '0.86rem', fontWeight: '600' }}>
            Manage all refund requests in one place
          </p>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px', marginBottom: '24px',
      }}>
        {[
          { label: 'Total',      value: stats.total,      color: '#7B2FBE', bg: '#F3E8FF', icon: '📊' },
          { label: 'Pending',    value: stats.pending,    color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
          { label: 'Processing', value: stats.processing, color: '#3B82F6', bg: '#DBEAFE', icon: '⚙️' },
          { label: 'Completed',  value: stats.completed,  color: '#10B981', bg: '#D1FAE5', icon: '✅' },
          { label: 'Failed',     value: stats.failed,     color: '#EF4444', bg: '#FEE2E2', icon: '❌' },
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
              fontSize: '1.2rem', fontWeight: '900', flexShrink: 0,
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

      {/* ── Money stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px', marginBottom: '20px',
      }}>
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #F3E8FF, #EDE9FE)',
          border: '1.5px solid #DDD6FE', borderRadius: '14px',
        }}>
          <p style={{ fontSize: '0.74rem', fontWeight: '800', color: '#6D28D9', margin: 0, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            💰 Total Refund Amount
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: '900', color: '#7B2FBE', margin: '4px 0 0', lineHeight: 1 }}>
            ₹{stats.totalAmount?.toLocaleString('en-IN')}
          </p>
        </div>
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
          border: '1.5px solid #A7F3D0', borderRadius: '14px',
        }}>
          <p style={{ fontSize: '0.74rem', fontWeight: '800', color: '#065F46', margin: 0, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            ✅ Completed Amount
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: '900', color: '#10B981', margin: '4px 0 0', lineHeight: 1 }}>
            ₹{stats.completedAmount?.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* ── Filters + Search ── */}
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
          placeholder="🔍 Search by ID, customer name, or email..."
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
          <option value="processing">⚙️ Processing</option>
          <option value="completed">✅ Completed</option>
          <option value="failed">❌ Failed</option>
        </select>
      </div>

      {/* ── Empty state ── */}
      {filteredRefunds.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'white', borderRadius: '16px',
          border: '2px dashed #EDD9FF',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💰</div>
          <h3 style={{ color: '#2D1A4A', margin: '0 0 8px', fontSize: '1.1rem' }}>
            No refunds found
          </h3>
          <p style={{ color: '#9585B0', margin: 0, fontWeight: '600', fontSize: '0.88rem' }}>
            {search ? 'Try a different search term' : `No ${filter !== 'all' ? filter : ''} refunds at the moment`}
          </p>
        </div>
      )}

      {/* ── Refunds Table ── */}
      {filteredRefunds.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '14px',
          border: '1.5px solid #EDD9FF',
          overflow: 'hidden',
          overflowX: 'auto',
        }}>
          <table style={{
            width: '100%', minWidth: '900px',
            borderCollapse: 'collapse', fontSize: '0.86rem',
          }}>
            <thead>
              <tr style={{ background: '#FBF7FF', borderBottom: '2px solid #EDD9FF' }}>
                <th style={thStyle}>Refund ID</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.map(r => {
                const statusCfg = STATUS_CONFIG[r.refundStatus] || STATUS_CONFIG.pending;
                const typeCfg   = REFUND_TYPE_CONFIG[r.refundType] || REFUND_TYPE_CONFIG.razorpay;

                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F3E8FF' }}>
                    <td style={tdStyle}>
                      <code style={{ fontSize: '0.78rem', color: '#7B2FBE', fontWeight: '700' }}>
                        #{r.id?.slice(-8).toUpperCase()}
                      </code>
                    </td>
                    <td style={tdStyle}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '700', color: '#2D1A4A' }}>
                          {r.user?.name || 'Unknown'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: '#9585B0', fontWeight: '600' }}>
                          {r.user?.email}
                        </p>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <Link href={`/admin/orders/${r.orderId}`} style={{
                        color: '#7B2FBE', textDecoration: 'none', fontWeight: '700', fontSize: '0.8rem',
                        fontFamily: 'monospace',
                      }}>
                        #{r.orderId?.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td style={tdStyle}>
                      <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>
                        ₹{r.amount?.toLocaleString('en-IN')}
                      </strong>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px',
                        background: `${typeCfg.color}15`,
                        color: typeCfg.color,
                        borderRadius: '999px',
                        fontSize: '0.74rem', fontWeight: '800',
                        border: `1px solid ${typeCfg.color}30`,
                      }}>
                        <span>{typeCfg.emoji}</span>
                        {typeCfg.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 12px',
                        background: statusCfg.bg, color: statusCfg.color,
                        borderRadius: '999px',
                        fontSize: '0.76rem', fontWeight: '800',
                      }}>
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#9585B0', fontSize: '0.78rem', fontWeight: '600' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: '2-digit',
                      })}
                    </td>
                    <td style={tdStyle}>
                      <Link href={`/admin/refunds/${r.id}`} style={{
                        display: 'inline-block', padding: '6px 14px',
                        background: 'linear-gradient(135deg, #7B2FBE, #9333EA)',
                        color: 'white', borderRadius: '8px',
                        fontSize: '0.76rem', fontWeight: '800',
                        textDecoration: 'none', whiteSpace: 'nowrap',
                      }}>
                        👁️ View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '12px 14px',
  textAlign: 'left',
  fontSize: '0.76rem',
  fontWeight: '800',
  color: '#7B2FBE',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '12px 14px',
  color: '#2D1A4A',
  fontWeight: '600',
};