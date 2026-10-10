'use client';
import { useState, useEffect } from 'react';

export default function AdminHeatmapPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/heatmap')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <h2 style={{ color: '#7B2FBE' }}>🔥 Loading Live Traffic & Navigation Heatmap...</h2>
      </div>
    );
  }

  const getHeatStyle = (heat) => {
    switch (heat) {
      case 'hot':
        return { background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff', border: '1px solid #B91C1C' };
      case 'warm':
        return { background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', border: '1px solid #C2410C' };
      case 'mild':
        return { background: 'linear-gradient(135deg, #FBBF24, #D97706)', color: '#fff', border: '1px solid #B45309' };
      default:
        return { background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' };
    }
  };

  const maxHits = data?.pageTraffic?.[0]?.hits || 1000;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Nunito, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          🔥 User Traffic & Navigation Heatmap
        </h1>
        <p style={{ color: '#64748B', margin: '4px 0 0', fontSize: '0.92rem' }}>
          See where visitors are browsing, clicking, and converting in your store.
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>

        {/* Section 1: Page Navigation Traffic Heatmap */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1E293B', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧭 Store Navigation Hotspots
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.pageTraffic?.map((item, idx) => {
              const fillPct = Math.round((item.hits / maxHits) * 100);
              const heatStyle = getHeatStyle(item.heat);

              return (
                <div key={idx} style={{ padding: '12px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0F172A' }}>
                      {item.name} <code style={{ fontSize: '0.75rem', color: '#64748B', background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>{item.route}</code>
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '900', padding: '3px 8px', borderRadius: '20px', ...heatStyle }}>
                      {item.heat.toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${fillPct}%`, height: '100%', borderRadius: '4px', ...heatStyle, transition: 'width 0.6s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#64748B', fontWeight: '700' }}>
                    <span>{item.hits.toLocaleString()} Visits</span>
                    <span>{fillPct}% Traffic Density</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Top Buyer Cities & States */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top Cities */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1E293B', marginTop: 0, marginBottom: '16px' }}>
              📍 Top City Hotspots
            </h2>

            {data?.topCities?.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No saved addresses yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data?.topCities?.map((city, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '900', color: '#7B2FBE', fontSize: '0.9rem' }}>#{idx + 1}</span>
                      <span style={{ fontWeight: '800', color: '#334155', fontSize: '0.88rem' }}>{city.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: '900', color: '#0F172A', fontSize: '0.88rem' }}>{city.count} users</span>
                      <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: '700' }}>{city.percentage}% of total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top States */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1E293B', marginTop: 0, marginBottom: '16px' }}>
              🗺️ State Distribution
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data?.topStates?.map((st, idx) => (
                <div key={idx} style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', border: '1px solid #BAE6FD', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0369A1' }}>{st.name}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', background: '#0284C7', color: '#fff', padding: '2px 6px', borderRadius: '6px' }}>{st.count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}