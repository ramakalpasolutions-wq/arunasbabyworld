'use client';
import { useState, useEffect } from 'react';

export default function AdvancedHeatmapPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/heatmap?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  // Auto-refresh live users every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/admin/heatmap?range=${range}`)
        .then(r => r.json())
        .then(d => setData(d))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [range]);

  if (loading || !data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <h2 style={{ color: '#7B2FBE' }}>📡 Analyzing User Behavior...</h2>
      </div>
    );
  }

  const maxCount = data.funnel?.[0]?.count || 1;
  const maxStateRevenue = data.topStates?.[0]?.revenue || 1;

  const funnelColors = [
    'linear-gradient(90deg, #93C5FD, #38BDF8)',
    'linear-gradient(90deg, #C4B5FD, #818CF8)',
    'linear-gradient(90deg, #FDBA74, #F59E0B)',
    'linear-gradient(90deg, #FCA5A5, #F97316)',
    'linear-gradient(90deg, #6EE7B7, #10B981)',
  ];

  const severityColor = {
    critical: { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B', badge: '#DC2626' },
    high: { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', badge: '#D97706' },
    medium: { bg: '#DBEAFE', border: '#BFDBFE', text: '#1E40AF', badge: '#2563EB' },
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Nunito, sans-serif' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>
            🧭 Advanced E-Commerce Analytics
          </h1>
          <p style={{ color: '#64748B', margin: '4px 0 0', fontSize: '0.95rem' }}>
            Funnel conversion, bottlenecks, geo heatmap & live sessions. 
            {' '}<a href="https://clarity.microsoft.com/" target="_blank" rel="noreferrer" style={{ color: '#7B2FBE', fontWeight: '800', textDecoration: 'none' }}>
              Open Clarity Dashboard →
            </a>
          </p>
        </div>

        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontWeight: '800', color: '#1E293B', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* LIVE ACTIVITY BAR */}
      <div style={{ background: 'linear-gradient(135deg, #111827, #1F2937)', color: 'white', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#22C55E', borderRadius: '50%', animation: 'pulse 1.5s infinite', boxShadow: '0 0 10px #22C55E' }} />
            Live Store Activity
          </h3>
          <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.82rem' }}>Updated every 30 seconds</p>
        </div>
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#38BDF8' }}>{data.activeUsers}</div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '700' }}>Active Users</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#A78BFA' }}>{data.activeCart}</div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '700' }}>In Cart/Checkout</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#34D399' }}>₹{(data.totalRevenue / 1000).toFixed(1)}k</div>
            <div style={{ fontSize: '0.72rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '700' }}>Revenue</div>
          </div>
        </div>
      </div>

      {/* FUNNEL */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>📊 Conversion Funnel: Where Users Drop Off</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {data.funnel.map((step, idx) => {
            const widthPct = Math.max(5, (step.count / maxCount) * 100);
            return (
              <div key={idx}>
                {idx > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '20px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: '800', color: step.drop > 50 ? '#EF4444' : '#F59E0B', background: step.drop > 50 ? '#FEE2E2' : '#FEF3C7', padding: '3px 10px', borderRadius: '20px' }}>
                      ↓ {step.drop}% drop
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', padding: '16px 20px', borderRadius: '12px', border: '1px solid #F1F5F9', gap: '16px' }}>
                  <div style={{ width: '28%', fontWeight: '800', color: '#1E293B', fontSize: '0.9rem' }}>
                    {idx + 1}. {step.step}
                  </div>
                  <div style={{ flex: 1, height: '16px', background: '#E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${widthPct}%`, height: '100%', background: funnelColors[idx], borderRadius: '8px', transition: 'width 1s ease-in-out' }} />
                  </div>
                  <div style={{ width: '80px', textAlign: 'right', fontWeight: '900', color: '#0F172A', fontSize: '1.05rem' }}>
                    {step.count.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTLENECKS */}
      <div style={{ ...cardStyle, border: '1px solid #FEE2E2' }}>
        <h2 style={{ ...sectionTitle, color: '#B91C1C' }}>🚨 Issues & Bottlenecks Detected</h2>
        {data.bottlenecks.length === 0 ? (
          <div style={{ padding: '18px', background: '#ECFDF5', color: '#065F46', borderRadius: '12px', fontWeight: '700' }}>
            ✅ Store is healthy — no critical bottlenecks right now.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {data.bottlenecks.map((b, i) => {
              const c = severityColor[b.severity] || severityColor.medium;
              return (
                <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, padding: '20px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: c.text }}>{b.issue}</h3>
                    <span style={{ background: c.badge, color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '900' }}>
                      {b.metric}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: c.text, lineHeight: '1.5' }}>{b.desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GEO + CITIES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* State Matrix */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>🗺️ Top States by Revenue</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
            {data.topStates.length === 0 ? (
              <p style={{ color: '#94A3B8', gridColumn: '1 / -1' }}>No order data yet.</p>
            ) : (
              data.topStates.map((st, idx) => {
                const intensity = st.revenue / maxStateRevenue;
                const bg = intensity > 0.7 ? 'linear-gradient(135deg, #7B2FBE, #5B21B6)' :
                           intensity > 0.4 ? 'linear-gradient(135deg, #EC4899, #DB2777)' :
                           intensity > 0.15 ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                           'linear-gradient(135deg, #94A3B8, #64748B)';
                return (
                  <div key={idx} title={`${st.name}: ₹${st.revenue.toLocaleString()} • ${st.count} orders`} style={{ background: bg, padding: '14px 10px', borderRadius: '12px', color: 'white', textAlign: 'center', cursor: 'crosshair', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: '800', opacity: 0.9, marginBottom: '4px', textTransform: 'uppercase' }}>
                      {st.name.slice(0, 10)}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '900' }}>
                      ₹{(st.revenue / 1000).toFixed(1)}k
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* City List */}
        <div style={cardStyle}>
          <h2 style={sectionTitle}>📍 High-Value Cities</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {data.topCities.length === 0 ? (
              <p style={{ color: '#94A3B8' }}>No order data yet.</p>
            ) : (
              data.topCities.map((city, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', background: '#E0F2FE', color: '#0369A1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.78rem' }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: '#1E293B', fontSize: '0.92rem' }}>{city.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700' }}>{city.state}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '900', color: '#059669', fontSize: '0.92rem' }}>₹{city.revenue.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: '700' }}>{city.count} orders · AOV ₹{city.aov}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CLARITY REMINDER CARD */}
      <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #FBBF24' }}>
        <h2 style={{ ...sectionTitle, color: '#78350F' }}>🎥 Session Replays, Click & Scroll Heatmaps</h2>
        <p style={{ margin: '0 0 14px', color: '#92400E', fontSize: '0.9rem', fontWeight: '700' }}>
          Click, scroll, movement heatmaps, rage/dead clicks, device segmentation and session replays are available in your <strong>Microsoft Clarity dashboard</strong> (free, GDPR-safe, auto-masks sensitive data).
        </p>
        <a href="https://clarity.microsoft.com/" target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#78350F', color: 'white', padding: '10px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: '800', fontSize: '0.9rem' }}>
          Open Clarity Dashboard →
        </a>
      </div>

      <style jsx global>{`
        @keyframes pulse { 50% { opacity: 0.4; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  borderRadius: '16px',
  padding: '26px',
  border: '1px solid #E2E8F0',
  boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
  marginBottom: '24px',
};

const sectionTitle = {
  fontSize: '1.15rem',
  fontWeight: '800',
  marginTop: 0,
  marginBottom: '18px',
  color: '#1E293B',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};