'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import HeroBanner from '@/components/home/HeroBanner';
import ProductCard from '@/components/products/ProductCard';
import useScrollReveal from '@/hooks/useScrollReveal';
import styles from './HomeClient.module.css';

function useSectionSettings() {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    fetch('/api/section-settings')
      .then(r => r.json())
      .then(data => setSettings(data.settings || {}))
      .catch(() => {});
  }, []);
  return settings;
}

const DEFAULT_BRANDS = [
  { id: '1',  name: 'Mothercare',    color: '#FF6B35', link: '/products' },
  { id: '2',  name: 'Babyhug',       color: '#7B2FBE', link: '/products' },
  { id: '3',  name: 'Ed-a-Mamma',    color: '#FF8C5A', link: '/products' },
  { id: '4',  name: 'Gini & Jony',   color: '#9B4FDE', link: '/products' },
  { id: '5',  name: 'Chicco',        color: '#FF6B35', link: '/products' },
  { id: '6',  name: 'Mee Mee',       color: '#7B2FBE', link: '/products' },
  { id: '7',  name: 'Himalaya Baby', color: '#FF8C5A', link: '/products' },
  { id: '8',  name: 'Mamaearth',     color: '#9B4FDE', link: '/products' },
  { id: '9',  name: 'Fisher-Price',  color: '#FF6B35', link: '/products' },
  { id: '10', name: 'Funskool',      color: '#7B2FBE', link: '/products' },
];

const DEFAULT_BUDGET = [
  { price: 499,  emoji: '🎀', color: '#FF6B35', offer: 'Under', link: '/products?maxPrice=499'  },
  { price: 899,  emoji: '🧸', color: '#7B2FBE', offer: 'Under', link: '/products?maxPrice=899'  },
  { price: 1299, emoji: '🍼', color: '#FF8C5A', offer: 'Under', link: '/products?maxPrice=1299' },
  { price: 1999, emoji: '🎁', color: '#9B4FDE', offer: 'Under', link: '/products?maxPrice=1999' },
];

function getSectionBackgroundUrl(items = []) {
  return (
    items.find(item => item?.mobileImage?.url)?.mobileImage?.url ||
    items.find(item => item?.image?.url)?.image?.url ||
    null
  );
}

/* ═══════════════════════════════════════
   2. BRANDS
═══════════════════════════════════════ */
function BrandsSection({ brands }) {
  const displayBrands = brands?.length > 0 ? brands : DEFAULT_BRANDS;
  const items = [...displayBrands, ...displayBrands, ...displayBrands];

  return (
    <section style={{ background: 'white', borderTop: '1px solid #F3E8FF', borderBottom: '1px solid #F3E8FF', overflow: 'hidden', padding: '0' }}>
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #FF6B35, #7B2FBE, #FF8C5A, #9B4FDE, #FF6B35)', backgroundSize: '300% 100%', animation: 'rainbowShift 4s linear infinite' }} />
      <div style={{ position: 'relative', overflow: 'hidden', padding: '12px 0' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to right, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px', background: 'linear-gradient(to left, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div
          style={{ display: 'flex', gap: '12px', width: 'max-content', animation: 'brandScroll 15s linear infinite' }}
          onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
          onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
          onTouchStart={e => e.currentTarget.style.animationPlayState = 'paused'}
          onTouchEnd={e => e.currentTarget.style.animationPlayState = 'running'}
        >
          {items.map((brand, i) => (
            <Link
              key={`${brand.id}-${i}`}
              href={brand.link || '/products'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', textDecoration: 'none', padding: '7px 16px', borderRadius: '999px', border: `1.5px solid ${brand.color}25`, background: `${brand.color}08`, flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${brand.color}18`; e.currentTarget.style.borderColor = brand.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${brand.color}08`; e.currentTarget.style.borderColor = `${brand.color}25`; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
           {brand.logo?.url ? (
  <img
    src={brand.logo.url}
    alt={brand.name || 'Brand'}
    style={{
      width: brand.name ? '24px' : '60px',   // ✅ Bigger if no name
      height: brand.name ? '24px' : '32px',
      objectFit: 'contain',
      borderRadius: '4px',
      flexShrink: 0,
    }}
  />
) : (
  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: brand.color, flexShrink: 0 }} />
)}
{brand.name && (
  <span style={{ fontSize: '0.84rem', fontWeight: '800', color: brand.color, fontFamily: 'Nunito, sans-serif' }}>
    {brand.name}
  </span>
)}
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes brandScroll  { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        @keyframes rainbowShift { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
      `}</style>
    </section>
  );
}

/* ═══════════════════════════════════════
   3. SEASON BANNER — ✅ Split Layout
   Left: text (20%) | Right: full image (80%)
═══════════════════════════════════════ */
function SeasonBanner({ banners }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);

  // ✅ Auto scroll every 5 seconds
  useEffect(() => {
    if (!banners?.length || banners.length <= 1 || paused) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners?.length, paused]);

  if (!banners?.length) return null;
  const banner = banners[current];

  return (
    <section
      style={{ background: '#eef1f5', padding: '20px 16px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          background: '#fff',
        }}>
          {/* ✅ All slides stacked — fade transition */}
          {banners.map((b, i) => (
            <div
              key={b.id || i}
              style={{
                position: i === 0 ? 'relative' : 'absolute',
                inset: 0,
                opacity: i === current ? 1 : 0,
                transition: 'opacity 0.6s ease',
                zIndex: i === current ? 2 : 1,
              }}
            >
              {b.image?.url ? (
                <img
                  src={b.image.url}
                  alt={b.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '440px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '320px',
                  background: `linear-gradient(135deg, ${b.bgColor || '#0EA5E9'}, #7B2FBE)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '2rem', fontWeight: '800',
                  fontFamily: 'Nunito, sans-serif',
                }}>
                  {b.title}
                </div>
              )}
            </div>
          ))}

          {/* Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setCurrent(p => (p - 1 + banners.length) % banners.length)}
                style={{
                  position: 'absolute', left: '16px', top: '50%',
                  transform: 'translateY(-50%)',
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.80)', border: 'none',
                  fontSize: '1.2rem', cursor: 'pointer', color: '#333',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >‹</button>
              <button
                onClick={() => setCurrent(p => (p + 1) % banners.length)}
                style={{
                  position: 'absolute', right: '16px', top: '50%',
                  transform: 'translateY(-50%)',
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.80)', border: 'none',
                  fontSize: '1.2rem', cursor: 'pointer', color: '#333',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)', zIndex: 5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >›</button>
            </>
          )}

          {/* Progress bar */}
          {banners.length > 1 && !paused && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(0,0,0,0.10)', zIndex: 5 }}>
              <div
                key={current}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #FF6B35, #7B2FBE)',
                  animation: 'festivalProgress 5s linear forwards',
                }}
              />
            </div>
          )}

          {/* Dots */}
          {banners.length > 1 && (
            <div style={{
              position: 'absolute', bottom: '14px', left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex', gap: '6px', zIndex: 5,
            }}>
              {banners.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  style={{
                    width: i === current ? '22px' : '8px',
                    height: '8px', borderRadius: '999px',
                    border: 'none',
                    background: i === current ? '#fff' : 'rgba(255,255,255,0.50)',
                    cursor: 'pointer', padding: 0,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes festivalProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
/* ═══════════════════════════════════════
   4. BUDGET — ✅ DB section name
═══════════════════════════════════════ */
function BudgetSection({ banners, sectionSettings = {} }) {
  const secTitle = sectionSettings['budget']?.title || 'Budget Store';

  const displayBudget = banners?.length > 0
    ? banners.map((b, i) => ({
        price: b.price || DEFAULT_BUDGET[i]?.price || 499,
        offer: b.offer || 'UNDER',
        link: b.buttonLink || `/products?maxPrice=${b.price || 499}`,
      }))
    : DEFAULT_BUDGET.map(b => ({ ...b, offer: 'UNDER' }));

  return (
    <section style={{
      padding: 'clamp(36px,5vw,60px) clamp(12px,3vw,40px) clamp(48px,6vw,80px)',
      background: 'linear-gradient(180deg, #f0e0cc 0%, #e0d0be 20%, #c8dce8 50%, #b0d4e8 100%)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ribbon heading */}
      <div style={{
        display: 'inline-block',
        background: '#fff',
        padding: 'clamp(10px,2vw,14px) clamp(28px,4vw,48px)',
        borderRadius: '4px',
        boxShadow: '0 3px 14px rgba(0,0,0,0.10)',
        marginBottom: 'clamp(28px,4vw,44px)',
        position: 'relative',
        zIndex: 2,
        maxWidth: '90%',
      }}>
        <h2 style={{
          fontSize: 'clamp(1rem,2.5vw,1.9rem)',
          fontWeight: '900',
          color: '#1a1a2e',
          margin: 0,
          fontFamily: 'Nunito, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: 'clamp(1.5px,0.3vw,3px)',
          whiteSpace: 'nowrap',
        }}>
          {secTitle}
        </h2>
        <div style={{
          position: 'absolute', left: '-12px', top: '50%',
          transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '16px solid transparent',
          borderBottom: '16px solid transparent',
          borderRight: '12px solid #fff',
        }} />
        <div style={{
          position: 'absolute', right: '-12px', top: '50%',
          transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '16px solid transparent',
          borderBottom: '16px solid transparent',
          borderLeft: '12px solid #fff',
        }} />
      </div>

      {/* ✅ Grid layout — responsive, no cut-off */}
      <div
        className="budgetGrid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${displayBudget.length}, minmax(0, 1fr))`,
          gap: 'clamp(8px,2vw,40px)',
          maxWidth: '1100px',
          margin: '0 auto',
          alignItems: 'center',
          justifyItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {displayBudget.map((item, i) => (
          <Link
            key={i}
            href={item.link}
            style={{
              textDecoration: 'none',
              textAlign: 'center',
              width: '100%',
              minWidth: 0,
            }}
          >
            <div
              style={{
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                padding: 'clamp(6px,1.5vw,12px) clamp(4px,1.5vw,24px)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <p style={{
                fontSize: 'clamp(0.62rem,1.2vw,1rem)',
                fontWeight: '900',
                color: '#1a1a8e',
                margin: '0 0 4px',
                fontFamily: 'Nunito, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: 'clamp(2px,0.5vw,4px)',
              }}>
                {item.offer}
              </p>

              <p style={{
                fontSize: 'clamp(1.5rem,6vw,4.5rem)',
                fontWeight: '900',
                color: '#1a1a8e',
                margin: 0,
                lineHeight: 1.1,
                fontFamily: 'Nunito, sans-serif',
                letterSpacing: '-1px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '2px',
                whiteSpace: 'nowrap',
              }}>
                {item.price}
                <span style={{
                  fontSize: '0.30em',
                  marginBottom: 'clamp(4px,1vw,14px)',
                  color: '#FF6B35',
                  fontWeight: '900',
                  animation: 'budgetArrow 1.2s ease-in-out infinite',
                }}>›</span>
              </p>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes budgetArrow {
          0%, 100% { opacity: 1; transform: translateX(0); }
          50% { opacity: 0.3; transform: translateX(4px); }
        }
      `}</style>
    </section>
  );
}
/* ═══════════════════════════════════════
   5. SUNNY — ✅ DB section name
═══════════════════════════════════════ */
function SunnySection({ banners, sectionSettings = {} }) {
  const secTitle = sectionSettings['sunny']?.title || 'Sunny Play Days';
  const secEmoji = sectionSettings['sunny']?.emoji || '☀️';

  if (!banners?.length) return null;

  return (
    <section style={{ padding: 'clamp(36px,5vw,60px) clamp(12px,2vw,20px)', background: 'linear-gradient(135deg, #FFF9EC 0%, #FFFBF5 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'linear-gradient(135deg, #FFF9EC, #FFF3EC)', border: '1.5px solid #FFD4B8', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'Nunito, sans-serif' }}>
              {secEmoji} Collections
            </span>
            <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
              {secEmoji} {secTitle}
            </h2>
          </div>
          <Link href="/products?category=clothing" style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
            View All →
          </Link>
        </div>

        <div className="sunnyGrid">
          {banners.map((banner, i) => {
            const imageUrl = banner.image?.url || null;
            return (
              <Link key={banner.id || i} href="/products?category=clothing" style={{ textDecoration: 'none' }}>
                <div
                  className="sunnyCard"
                  style={{ borderRadius: '20px', overflow: 'hidden', position: 'relative', border: '2px solid #a8d86c', transition: 'all 0.3s ease', cursor: 'pointer', background: '#E0F2FE', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(255,107,53,0.18)'; e.currentTarget.style.borderColor = '#FF6B35'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#a8d86c'; }}
                >
                  <div className="sunnyImgWrap" style={{ position: 'relative', width: '100%' }}>
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt={banner.title || 'Collection'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.40) 0%, transparent 50%)', zIndex: 1 }} />
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #c5e9f8, #8fd2f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4.5rem' }}>
                        {banner.emoji || '👕'}
                      </div>
                    )}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '36px', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#2D1A4A', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Nunito, sans-serif' }}>{banner.title}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <style>{`
          .sunnyGrid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }
          .sunnyImgWrap { height: clamp(180px, 22vw, 260px); }
          @media (max-width: 1024px) {
            .sunnyGrid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
            .sunnyImgWrap { height: clamp(170px, 26vw, 230px); }
          }
          @media (max-width: 700px) {
            .sunnyGrid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .sunnyImgWrap { height: clamp(160px, 40vw, 220px); }
          }
          @media (max-width: 380px) {
            .sunnyGrid { grid-template-columns: 1fr; }
            .sunnyImgWrap { height: 200px; }
          }
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   6. PROMO — ✅ DB section name
═══════════════════════════════════════ */
function PromoSection({ banners, sectionSettings = {} }) {
  const secTitle = sectionSettings['promo']?.title || 'Shop By Category';

  const categories = [
    { name: 'Clothing',        image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&h=600&fit=crop&auto=format', link: '/products?category=clothing',         color: '#FF6B35' },
    { name: 'Toys & Games',    image: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500&h=600&fit=crop&auto=format',  link: '/products?category=toys',             color: '#EF4444' },
    { name: 'Baby Food',       image: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=500&h=600&fit=crop&auto=format', link: '/products?category=food',            color: '#10B981' },
    { name: 'Personal Care',   image: 'https://images.unsplash.com/photo-1599735362298-10f9a84d3e89?w=500&h=600&fit=crop&auto=format', link: '/products?category=personal-care',   color: '#7B2FBE' },
    { name: 'Skin Care',       image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=600&fit=crop&auto=format',  link: '/products?category=health-care',     color: '#0EA5E9' },
    { name: 'Electric Rides',  image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=600&fit=crop&auto=format', link: '/products?category=electric-vehicles', color: '#F59E0B' },
    { name: 'Cradles & Cribs', image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=500&h=600&fit=crop&auto=format',  link: '/products?category=cradles-cribs',   color: '#EC4899' },
  ];

  return (
    <section style={{
      padding: 'clamp(36px,5vw,52px) clamp(12px,2vw,16px)',
      background: 'linear-gradient(180deg, #fff 0%, #f8f9fb 100%)',
    }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{
            fontSize: 'clamp(1.1rem,2.5vw,1.8rem)',
            fontWeight: '900',
            color: '#1a1a2e',
            margin: '0 0 10px',
            fontFamily: 'Nunito, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            {secTitle}
          </h2>
          <div style={{
            width: '60px', height: '3px',
            background: 'linear-gradient(90deg, #FF6B35, #7B2FBE)',
            borderRadius: '999px',
            margin: '0 auto',
          }} />
        </div>

        {/* ✅ Responsive grid via className */}
        <div className="promoGrid">
          {categories.map((cat, i) => (
            <Link key={i} href={cat.link} style={{ textDecoration: 'none' }}>
              <div
                className="promoCard"
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `2px solid ${cat.color}30`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '100%',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `0 14px 36px ${cat.color}25`;
                  e.currentTarget.style.borderColor = cat.color;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = `${cat.color}30`;
                }}
              >
                <div className="promoImgWrap">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                      transition: 'transform 0.4s ease',
                    }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.innerHTML =
                        `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:#f0f0f0">${cat.name.charAt(0)}</div>`;
                    }}
                  />
                </div>

                <div style={{
                  padding: '11px 6px',
                  background: '#1a1a2e',
                  textAlign: 'center',
                }}>
                  <p style={{
                    fontSize: 'clamp(0.62rem,1.1vw,0.78rem)',
                    fontWeight: '800',
                    color: '#fff',
                    margin: 0,
                    fontFamily: 'Nunito, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {cat.name}
                    <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>›</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ✅ Proper responsive grid */}
        <style>{`
          .promoGrid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 14px;
          }
          .promoImgWrap {
            width: 100%;
            height: clamp(160px, 22vw, 220px);
            overflow: hidden;
            background: #f8f8f8;
          }
          @media (max-width: 1200px) {
            .promoGrid { grid-template-columns: repeat(5, 1fr); gap: 12px; }
          }
          @media (max-width: 900px) {
            .promoGrid { grid-template-columns: repeat(4, 1fr); gap: 10px; }
            .promoImgWrap { height: clamp(140px, 24vw, 180px); }
          }
          @media (max-width: 640px) {
            .promoGrid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .promoImgWrap { height: clamp(120px, 30vw, 160px); }
          }
          @media (max-width: 420px) {
            .promoGrid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .promoImgWrap { height: clamp(130px, 38vw, 170px); }
          }
        `}</style>
      </div>
    </section>
  );
}
/* ═══════════════════════════════════════
   7. GENDER — ✅ DB section name
═══════════════════════════════════════ */
function GenderCard({ banner, isGirl }) {
  const [hovered, setHovered] = useState(false);
  const color = isGirl ? '#EC4899' : '#0EA5E9';
  const defaultImg = isGirl
    ? 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=800&fit=crop&auto=format'
    : 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=800&fit=crop&auto=format';
  const imgUrl = banner?.image?.url || defaultImg;
  const link   = banner?.buttonLink || (isGirl ? '/products?search=girl' : '/products?search=boy');
  const title  = banner?.title      || (isGirl ? 'For Her 👧' : 'For Him 👦');
  const sub    = banner?.subtitle   || (isGirl ? 'Cute & stylish picks for girls' : 'Cool & fun picks for boys');

  return (
    <Link href={link} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ borderRadius: 'clamp(18px,2.5vw,28px)', overflow: 'hidden', position: 'relative', height: 'clamp(320px,45vw,520px)', boxShadow: hovered ? `0 28px 64px ${color}30` : '0 10px 40px rgba(0,0,0,0.12)', transform: hovered ? 'translateY(-10px)' : 'translateY(0)', transition: 'all 0.4s ease', cursor: 'pointer' }}
      >
        <img src={imgUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.5s ease' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${color}CC 0%, ${color}40 40%, transparent 70%)` }} />
        <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '6px 14px', background: color, color: 'white', borderRadius: '999px', fontSize: '0.80rem', fontWeight: '800', fontFamily: 'Nunito, sans-serif', boxShadow: `0 4px 12px ${color}50` }}>
          {isGirl ? '👧 Girls' : '👦 Boys'}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(20px,3vw,32px)', zIndex: 2 }}>
          <h3 style={{ fontSize: 'clamp(1.2rem,2.5vw,1.9rem)', fontWeight: '800', color: 'white', margin: '0 0 6px', textShadow: '0 2px 10px rgba(0,0,0,0.25)', fontFamily: 'Nunito, sans-serif' }}>{title}</h3>
          <p style={{ fontSize: 'clamp(0.78rem,1.2vw,0.90rem)', color: 'rgba(255,255,255,0.88)', margin: '0 0 16px', fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>{sub}</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 22px', background: 'white', color: color, borderRadius: '999px', fontSize: '0.86rem', fontWeight: '800', fontFamily: 'Nunito, sans-serif', boxShadow: '0 4px 14px rgba(0,0,0,0.20)' }}>
            Shop Now →
          </span>
        </div>
      </div>
    </Link>
  );
}

function GenderSection({ banners, sectionSettings = {} }) {
  const secTitle = sectionSettings['gender']?.title || 'Shop by Style';
  const secEmoji = sectionSettings['gender']?.emoji || '👗';

  const girlBanner = banners?.find(b => b.gender === 'girl');
  const boyBanner  = banners?.find(b => b.gender === 'boy');

  return (
    <section style={{ padding: 'clamp(40px,6vw,60px) 20px', background: 'linear-gradient(160deg, #FDF2F8 0%, #E0F2FE 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ display: 'inline-block', padding: '5px 18px', background: 'linear-gradient(135deg, #FDF2F8, #E0F2FE)', border: '1.5px solid #FCE7F3', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', color: '#BE185D', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'Nunito, sans-serif' }}>
            {secEmoji} Shop By Style
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
            {secEmoji} {secTitle}
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(14px,2.5vw,28px)', maxWidth: '900px', margin: '0 auto' }}>
          <GenderCard banner={girlBanner} isGirl={true}  />
          <GenderCard banner={boyBanner}  isGirl={false} />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   8. BABY FOOD — ✅ DB section name
═══════════════════════════════════════ */
function BabyFoodSection({ banners, sectionSettings = {} }) {
  const secTitle = sectionSettings['baby-food']?.title || 'Baby Food & Nutrition';
  const secEmoji = sectionSettings['baby-food']?.emoji || '🍼';

  if (!banners?.length) return null;
  const defaultFoodColors = ['#FF6B35', '#10B981', '#EF4444', '#0EA5E9', '#F59E0B', '#7B2FBE'];

  return (
    <section style={{ padding: 'clamp(40px,6vw,60px) 20px', background: 'linear-gradient(135deg, #FFFBF5 0%, #F0FDF4 50%, #F3E8FF 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ display: 'inline-block', padding: '5px 18px', background: 'linear-gradient(135deg, #FFFBF5, #F0FDF4)', border: '1.5px solid #BBF7D0', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'Nunito, sans-serif' }}>
            🍎 Nutrition First
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif' }}>
            {secEmoji} {secTitle}
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
            Healthy, tasty & nutritious food for your little one
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(150px,18vw,200px), 1fr))', gap: '18px' }}>
          {banners.map((banner, i) => {
            const color  = banner.color || defaultFoodColors[i % defaultFoodColors.length];
            const imgUrl = banner.image?.url || null;
            const link   = banner.buttonLink || '/products?category=food';
            return (
              <Link key={banner.id || i} href={link} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'white', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '2px solid #b8e6f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = `0 20px 48px ${color}25`; e.currentTarget.style.borderColor = color; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div style={{ height: '4px', background: color }} />
                  <div style={{ height: 'clamp(120px,16vw,160px)', overflow: 'hidden', background: imgUrl ? '#f8f8f8' : `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block', padding: '8px', boxSizing: 'border-box' }} />
                    ) : (
                      <span>{banner.emoji || '🍼'}</span>
                    )}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>{banner.title}</h3>
                    {banner.subtitle && <p style={{ fontSize: '0.74rem', color: '#9585B0', margin: '0 0 10px', fontWeight: '500', fontFamily: 'Nunito, sans-serif', lineHeight: 1.4 }}>{banner.subtitle}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: color, fontFamily: 'Nunito, sans-serif' }}>Shop Now →</span>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{banner.emoji || '🍼'}</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link href="/products?category=food" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 28px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: '0.90rem', boxShadow: '0 6px 18px rgba(16,185,129,0.28)', fontFamily: 'Nunito, sans-serif' }}>
            View All Baby Food 🍎
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   9. TOYS — ✅ DB section name
═══════════════════════════════════════ */
function ToysSection({ banners, sectionSettings = {} }) {
  const secTitle = sectionSettings['toys']?.title || 'Toys & Games';
  const secEmoji = sectionSettings['toys']?.emoji || '🧸';

  if (!banners?.length) return null;
  const sectionBg = getSectionBackgroundUrl(banners);

  return (
    <section style={{ position: 'relative', padding: 'clamp(36px,5vw,68px) clamp(12px,2vw,20px)', overflow: 'hidden' }}>
      {sectionBg ? (
        <img src={sectionBg} alt="Toys background" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.18, filter: 'blur(1px)', transform: 'scale(1.04)' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 50%, #FDF4FF 100%)' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.58), rgba(255,255,255,0.82))' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(8px)', border: '1.5px solid #FCA5A5', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'Nunito, sans-serif' }}>
              🎠 Play Time
            </span>
            <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
              {secEmoji} {secTitle}
            </h2>
          </div>
          <Link href="/products?category=toys" style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#EF4444,#7B2FBE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
            View All Toys →
          </Link>
        </div>

        <div className="toysGrid">
          {banners.map((banner, i) => {
            const imageUrl = banner.image?.url || null;
            const link = banner.buttonLink || '/products?category=toys';
            const color = banner.color || '#EF4444';
            return (
              <Link key={banner.id || i} href={link} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(12px)', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(45,26,74,0.08)', border: '2px solid #b8e6f0', transition: 'all 0.3s ease', cursor: 'pointer', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 18px 44px rgba(239,68,68,0.16)'; e.currentTarget.style.borderColor = `${color}55`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,26,74,0.08)'; e.currentTarget.style.borderColor = '#b8e6f0'; }}
                >
                  <div className="toysImgWrap" style={{ overflow: 'hidden', background: imageUrl ? '#fffaf9' : 'linear-gradient(135deg, #FEF2F2, #FFF7ED)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px', boxSizing: 'border-box', transition: 'transform 0.35s ease' }} />
                    ) : (
                      <span style={{ fontSize: '4rem' }}>{banner.emoji || '🧸'}</span>
                    )}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', borderRadius: '999px', background: color, color: 'white', fontSize: '10px', fontWeight: '800', fontFamily: 'Nunito, sans-serif', boxShadow: `0 6px 14px ${color}40` }}>
                      Play
                    </div>
                  </div>
                  <div style={{ padding: '14px 14px 16px' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>{banner.title}</h3>
                    {banner.subtitle && <p style={{ fontSize: '0.74rem', color: '#8E7AA8', margin: '0 0 10px', fontWeight: '600', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: 'Nunito, sans-serif' }}>{banner.subtitle}</p>}
                    <span style={{ fontSize: '0.80rem', fontWeight: '800', color: color, fontFamily: 'Nunito, sans-serif' }}>Shop Now →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <style>{`
          .toysGrid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
          }
          .toysImgWrap { height: clamp(160px, 20vw, 210px); }
          @media (max-width: 1024px) {
            .toysGrid { grid-template-columns: repeat(3, 1fr); gap: 14px; }
            .toysImgWrap { height: clamp(170px, 24vw, 210px); }
          }
          @media (max-width: 700px) {
            .toysGrid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .toysImgWrap { height: clamp(160px, 38vw, 200px); }
          }
          @media (max-width: 380px) {
            .toysGrid { grid-template-columns: 1fr; gap: 12px; }
            .toysImgWrap { height: 200px; }
          }
        `}</style>
      </div>
    </section>
  );
}
/* ═══════════════════════════════════════
   10. CARE — ✅ DB section name
═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   10. CARE — ✅ BENTO + ASYMMETRIC MOSAIC
   Personal Care = Bento Grid (Option 2)
   Health Care   = Asymmetric Mosaic (Option 4)
═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   10. CARE — ✅ FINAL: Bento + Mosaic
   Personal Care = Bento Grid
   Health Care   = Asymmetric Mosaic
═══════════════════════════════════════ */
function CareSection({ personalCareBanners, healthCareBanners, sectionSettings = {} }) {
  const personalTitle = sectionSettings['personal-care']?.title || 'Personal Baby Care';
  const personalEmoji = sectionSettings['personal-care']?.emoji || '🧴';
  const healthTitle   = sectionSettings['health-care']?.title   || 'Health & Safety';
  const healthEmoji   = sectionSettings['health-care']?.emoji   || '💊';

  const getItems = (banners, type, fallbackLink) => {
    return (banners || []).flatMap(b => {
      if (b.gridImages?.length > 0) {
        return b.gridImages.map(img => ({
          url: img.url || '', title: img.title || b.title || '', brand: img.brand || '',
          price: img.price || '', link: img.link || b.buttonLink || fallbackLink, type,
        }));
      }
      if (b.image?.url) {
        return [{ url: b.image.url, title: b.title || (type === 'personal' ? 'Personal Care' : 'Health Care'), brand: '', price: '', link: b.buttonLink || fallbackLink, type }];
      }
      return [];
    });
  };

  const personalItems = getItems(personalCareBanners, 'personal', '/products?category=personal-care');
  const healthItems   = getItems(healthCareBanners,   'health',   '/products?category=health-care');

  if (!personalItems.length && !healthItems.length) return null;

  // ✅ Reusable Image Card
  const ImageCard = ({ item, type, accentColor, badge, badgeIcon = '⭐' }) => (
    <Link href={item.link} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          background: '#fff',
          border: '2px solid #e5e7eb',
          transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.borderColor = accentColor;
          e.currentTarget.style.boxShadow = `0 18px 40px ${accentColor}30`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = '#e5e7eb';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {item.url ? (
          <img
            src={item.url}
            alt={item.title || type}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              padding: '8px',
              boxSizing: 'border-box',
              background: '#fff',
              transition: 'transform 0.4s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '4rem',
            background: type === 'personal' ? '#F3E8FF' : '#ECFDF5',
          }}>
            {type === 'personal' ? '🧴' : '💊'}
          </div>
        )}

        {/* Top-left badge */}
        {badge && (
          <div style={{
            position: 'absolute', top: '12px', left: '12px',
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', background: accentColor,
            borderRadius: '999px', fontSize: '0.62rem', fontWeight: '800',
            color: 'white',
            fontFamily: 'Nunito, sans-serif',
            boxShadow: `0 4px 12px ${accentColor}55`,
            zIndex: 3,
          }}>
            {badgeIcon} {badge}
          </div>
        )}

        {/* Bottom info gradient */}
        {(item.title || item.price) && (
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            padding: '12px 14px 10px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.40) 60%, transparent)',
            color: 'white',
            zIndex: 2,
          }}>
            {item.brand && (
              <p style={{
                fontSize: '0.56rem', fontWeight: '800',
                color: 'rgba(255,255,255,0.80)',
                margin: '0 0 2px',
                textTransform: 'uppercase', letterSpacing: '0.6px',
                fontFamily: 'Nunito, sans-serif',
              }}>{item.brand}</p>
            )}
            {item.title && (
              <p style={{
                fontSize: '0.78rem', fontWeight: '800',
                color: 'white',
                margin: 0, lineHeight: 1.25,
                fontFamily: 'Nunito, sans-serif',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>{item.title}</p>
            )}
            {item.price && (
              <p style={{
                fontSize: '0.90rem', fontWeight: '900',
                color: 'white',
                margin: '3px 0 0',
                fontFamily: 'Nunito, sans-serif',
              }}>₹{item.price}</p>
            )}
          </div>
        )}
      </div>
    </Link>
  );

  // ✅ Section Header
  const SectionHeader = ({ title, emoji, subtitle, accentColor, linkAll }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '5px', height: '38px',
          borderRadius: '999px', background: accentColor,
          boxShadow: `0 0 12px ${accentColor}80`,
        }} />
        <div>
          <p style={{
            fontSize: '0.68rem', fontWeight: '800', color: accentColor,
            margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1.2px',
            fontFamily: 'Nunito, sans-serif',
          }}>
            {emoji} {subtitle}
          </p>
          <h3 style={{
            fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)', fontWeight: '800',
            color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif',
          }}>{title}</h3>
        </div>
      </div>
      <Link href={linkAll} style={{
        padding: '8px 20px',
        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)`,
        color: 'white',
        borderRadius: '999px', textDecoration: 'none',
        fontSize: '0.78rem', fontWeight: '800',
        fontFamily: 'Nunito, sans-serif',
        boxShadow: `0 6px 16px ${accentColor}45`,
        transition: 'transform 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >View All →</Link>
    </div>
  );

  // ✅ BENTO GRID (Personal Care)
  const BentoGrid = ({ items, accentColor }) => {
    const filled = [...items];
    while (filled.length < 5) filled.push(...items);
    const display = filled.slice(0, 5);

    return (
      <div className="bentoGrid">
        <div className="bentoBig">
          <ImageCard item={display[0]} type="personal" accentColor={accentColor} badge="Featured" badgeIcon="⭐" />
        </div>
        <div className="bentoTop1">
          <ImageCard item={display[1]} type="personal" accentColor={accentColor} badge="Best" badgeIcon="🏆" />
        </div>
        <div className="bentoTop2">
          <ImageCard item={display[2]} type="personal" accentColor={accentColor} badge="New" badgeIcon="✨" />
        </div>
        <div className="bentoWide">
          <ImageCard item={display[3]} type="personal" accentColor={accentColor} badge="Trending" badgeIcon="🔥" />
        </div>
      </div>
    );
  };

  // ✅ ASYMMETRIC MOSAIC (Health Care)
  const AsymmetricMosaic = ({ items, accentColor }) => {
    const filled = [...items];
    while (filled.length < 5) filled.push(...items);
    const display = filled.slice(0, 5);

    return (
      <div className="mosaicGrid">
        <div className="mosaicTL">
          <ImageCard item={display[0]} type="health" accentColor={accentColor} badge="Safe" badgeIcon="🛡️" />
        </div>
        <div className="mosaicTR">
          <ImageCard item={display[1]} type="health" accentColor={accentColor} badge="Featured" badgeIcon="⭐" />
        </div>
        <div className="mosaicBL">
          <ImageCard item={display[2]} type="health" accentColor={accentColor} badge="Essential" badgeIcon="💎" />
        </div>
        <div className="mosaicBC">
          <ImageCard item={display[3]} type="health" accentColor={accentColor} badge="New" badgeIcon="✨" />
        </div>
        <div className="mosaicBR">
          <ImageCard item={display[4]} type="health" accentColor={accentColor} badge="Top" badgeIcon="🏆" />
        </div>
      </div>
    );
  };

  return (
    <section style={{
      padding: 'clamp(42px,6vw,68px) 20px',
      background: 'linear-gradient(135deg, #FAFAFA 0%, #F8F4FF 50%, #F0FDF4 100%)',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Main Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{
            display: 'inline-block', padding: '6px 20px',
            background: 'linear-gradient(135deg, #F3E8FF, #ECFDF5)',
            border: '1.5px solid #DFC5F8', borderRadius: '999px',
            fontSize: '0.72rem', fontWeight: '800', color: '#7B2FBE',
            textTransform: 'uppercase', letterSpacing: '1.2px',
            marginBottom: '12px', fontFamily: 'Nunito, sans-serif',
          }}>
            🌿 Baby Wellness
          </span>
          <h2 style={{
            fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: '800',
            color: '#2D1A4A', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif',
          }}>
            Wellness & Care Products
          </h2>
          <p style={{
            fontSize: '0.92rem', color: '#9585B0',
            margin: 0, fontWeight: '500',
            fontFamily: 'Nunito, sans-serif',
          }}>
            Trusted products for your little one's health & happiness
          </p>
        </div>

        {/* PERSONAL CARE — BENTO GRID */}
        {personalItems.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <SectionHeader
              title={personalTitle}
              emoji={personalEmoji}
              subtitle="Baby Care Essentials"
              accentColor="#7B2FBE"
              linkAll="/products?category=personal-care"
            />
            <BentoGrid items={personalItems} accentColor="#7B2FBE" />
          </div>
        )}

        {/* Divider */}
        {personalItems.length > 0 && healthItems.length > 0 && (
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #C8E6D0, transparent)',
            margin: '0 0 48px',
          }} />
        )}

        {/* HEALTH CARE — ASYMMETRIC MOSAIC */}
        {healthItems.length > 0 && (
          <div>
            <SectionHeader
              title={healthTitle}
              emoji={healthEmoji}
              subtitle="Stay Safe & Healthy"
              accentColor="#10B981"
              linkAll="/products?category=health-care"
            />
            <AsymmetricMosaic items={healthItems} accentColor="#10B981" />
          </div>
        )}
      </div>

      <style>{`
        /* ═══════════ BENTO GRID (Personal Care) ═══════════ */
        .bentoGrid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr;
          grid-template-rows: 185px 185px;
          gap: 12px;
          height: 382px;
        }
        .bentoBig    { grid-column: 1; grid-row: 1 / span 2; }
        .bentoTop1   { grid-column: 2; grid-row: 1; }
        .bentoTop2   { grid-column: 3; grid-row: 1; }
        .bentoWide   { grid-column: 2 / span 2; grid-row: 2; }

        /* ═══════════ ASYMMETRIC MOSAIC (Health) ═══════════ */
        .mosaicGrid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 12px;
          height: 380px;
        }
        .mosaicTL  { grid-column: 1; grid-row: 1; }
        .mosaicTR  { grid-column: 2 / span 2; grid-row: 1; }
        .mosaicBL  { grid-column: 1; grid-row: 2; }
        .mosaicBC  { grid-column: 2; grid-row: 2; }
        .mosaicBR  { grid-column: 3; grid-row: 2; }

        /* ═══════════ TABLET (900px) ═══════════ */
        @media (max-width: 900px) {
          .bentoGrid {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 200px 160px 160px;
            height: auto;
          }
          .bentoBig    { grid-column: 1 / span 2; grid-row: 1; }
          .bentoTop1   { grid-column: 1; grid-row: 2; }
          .bentoTop2   { grid-column: 2; grid-row: 2; }
          .bentoWide   { grid-column: 1 / span 2; grid-row: 3; }

          .mosaicGrid {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 170px 170px 170px;
            height: auto;
          }
          .mosaicTL  { grid-column: 1; grid-row: 1; }
          .mosaicTR  { grid-column: 2; grid-row: 1; }
          .mosaicBL  { grid-column: 1 / span 2; grid-row: 2; }
          .mosaicBC  { grid-column: 1; grid-row: 3; }
          .mosaicBR  { grid-column: 2; grid-row: 3; }
        }

        /* ═══════════ MOBILE (560px) ═══════════ */
        @media (max-width: 560px) {
          .bentoGrid {
            grid-template-columns: 1fr;
            grid-template-rows: 200px 160px 160px 160px;
          }
          .bentoBig    { grid-column: 1; grid-row: 1; }
          .bentoTop1   { grid-column: 1; grid-row: 2; }
          .bentoTop2   { grid-column: 1; grid-row: 3; }
          .bentoWide   { grid-column: 1; grid-row: 4; }

          .mosaicGrid {
            grid-template-columns: 1fr;
            grid-template-rows: 170px 170px 170px 170px 170px;
          }
          .mosaicTL  { grid-column: 1; grid-row: 1; }
          .mosaicTR  { grid-column: 1; grid-row: 2; }
          .mosaicBL  { grid-column: 1; grid-row: 3; }
          .mosaicBC  { grid-column: 1; grid-row: 4; }
          .mosaicBR  { grid-column: 1; grid-row: 5; }
        }
      `}</style>
    </section>
  );
}
/* ═══════════════════════════════════════
   11. ELECTRIC VEHICLES — ✅ DB section name
═══════════════════════════════════════ */
function EVSection({ banners, sectionSettings = {} }) {
  const secTitle = sectionSettings['electric']?.title || 'Electric Vehicles for Kids';
  const secEmoji = sectionSettings['electric']?.emoji || '🚗';

  if (!banners?.length) return null;

  return (
    <section style={{ position: 'relative', padding: 'clamp(40px,6vw,60px) 20px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #E8F4FD 0%, #F0E6FF 30%, #FFF0F5 60%, #E8FFF5 100%)', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,190,0.12) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ display: 'inline-block', padding: '5px 18px', background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(14,165,233,0.30)', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', color: '#0c4a6e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'Nunito, sans-serif' }}>
            ⚡ Kids Electric Rides
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif' }}>
            {secEmoji} {secTitle}
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#6B7280', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
            Premium battery-powered rides for every little adventurer
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(180px,22vw,280px), 1fr))', gap: '20px' }}>
          {banners.slice(0, 4).map((item, i) => (
            <Link key={i} href={item.buttonLink || '/products?category=electric-vehicles'} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.07)', border: '2px solid #b8e6f0', transition: 'all 0.3s ease', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 22px 56px rgba(14,165,233,0.18)'; e.currentTarget.style.borderColor = 'rgba(14,165,233,0.50)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.60)'; }}
              >
                <div style={{ height: 'clamp(160px,20vw,220px)', overflow: 'hidden', background: item.image?.url ? '#f0f8ff' : 'linear-gradient(135deg, #E0F2FE, #F3E8FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', position: 'relative' }}>
                  {item.image?.url ? (
                    <img src={item.image.url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block', padding: '12px', boxSizing: 'border-box', transition: 'transform 0.3s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    item.emoji || '🚗'
                  )}
                  {item.ageGroup && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', background: 'rgba(0,0,0,0.45)', color: 'white', borderRadius: '999px', fontSize: '10px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', backdropFilter: 'blur(4px)' }}>
                      👶 {item.ageGroup}
                    </div>
                  )}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>{item.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0EA5E9', fontFamily: 'Nunito, sans-serif' }}>
                      {item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'View Price'}
                    </span>
                    <span style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #0EA5E9, #7B2FBE)', color: 'white', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '800', fontFamily: 'Nunito, sans-serif' }}>🛒 Shop</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link href="/products?category=electric-vehicles" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 30px', background: 'linear-gradient(135deg, #0EA5E9, #7B2FBE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: '0.92rem', boxShadow: '0 6px 20px rgba(14,165,233,0.28)', fontFamily: 'Nunito, sans-serif' }}>
            View All Electric Vehicles ⚡
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   12. TRENDING + FEATURED
═══════════════════════════════════════ */
function TrendingFeaturedSection({ trending, featured }) {
  const allProducts = [];
  const maxLen = Math.max(trending?.length || 0, featured?.length || 0);
  for (let i = 0; i < maxLen; i++) {
    if (trending?.[i]) allProducts.push({ ...trending[i], _label: 'trending' });
    if (featured?.[i]) allProducts.push({ ...featured[i], _label: 'featured' });
  }
  const display = allProducts.slice(0, 8);
  if (!display.length) return null;

  return (
    <section style={{ padding: 'clamp(40px,6vw,60px) 20px', background: 'white' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'block', padding: '4px 14px', background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)', border: '1.5px solid #FFD4B8', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'Nunito, sans-serif', width: 'fit-content' }}>This Week</span>
            <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>🔥 Trending & ⭐ Featured Mix</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/products?trending=true" style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#FF6B35,#FF8C5A)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>🔥 Trending →</Link>
            <Link href="/products?featured=true" style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>⭐ Featured →</Link>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '18px' }}>
          {display.map(p => (
            <div key={`${p._label}-${p.id}`} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, padding: '3px 9px', borderRadius: '999px', fontSize: '10px', fontWeight: '800', background: p._label === 'trending' ? 'linear-gradient(135deg,#FF6B35,#FF8C5A)' : 'linear-gradient(135deg,#7B2FBE,#9B4FDE)', color: 'white', fontFamily: 'Nunito, sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                {p._label === 'trending' ? '🔥 Hot' : '⭐ Pick'}
              </div>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   13. CTA
═══════════════════════════════════════ */
function CTASection() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 25%, #7B2FBE 65%, #9B4FDE 100%)', padding: 'clamp(48px,8vw,88px) 20px', position: 'relative' }}>
        {[{ top: '-80px', right: '-80px', size: '320px' }, { bottom: '-60px', left: '-60px', size: '280px' }].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: s.top, bottom: s.bottom, left: s.left, right: s.right, width: s.size, height: s.size, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
        ))}
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 18px', background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)', borderRadius: '999px', fontSize: '0.82rem', fontWeight: '800', color: 'white', marginBottom: '16px', fontFamily: 'Nunito, sans-serif' }}>🎁 Special Offer</span>
              <h2 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.8rem)', fontWeight: '800', color: 'white', margin: '0 0 16px', lineHeight: 1.18, fontFamily: 'Nunito, sans-serif' }}>Get 10% Off Your First Order!</h2>
              <p style={{ fontSize: 'clamp(0.88rem,1.5vw,1rem)', color: 'rgba(255,255,255,0.92)', margin: '0 0 28px', lineHeight: 1.75, fontWeight: '500', maxWidth: '480px', fontFamily: 'Nunito, sans-serif' }}>Sign up now and unlock exclusive deals, early access to sales, and personalised recommendations.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: 'clamp(11px,2vw,14px) clamp(22px,3vw,32px)', background: 'white', color: '#FF6B35', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: 'clamp(0.88rem,1.5vw,0.96rem)', boxShadow: '0 10px 32px rgba(0,0,0,0.18)', fontFamily: 'Nunito, sans-serif', transition: 'all 0.3s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.color = '#7B2FBE'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.color = '#FF6B35'; }}
                >
                  Create Free Account →
                </Link>
                <Link href="/products" style={{ color: 'rgba(255,255,255,0.92)', fontWeight: '700', fontSize: '0.92rem', textDecoration: 'none', borderBottom: '2px solid rgba(255,255,255,0.45)', paddingBottom: '2px', fontFamily: 'Nunito, sans-serif' }}>
                  Browse Products ↗
                </Link>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '28px', flexWrap: 'wrap' }}>
                {[{ icon: '🛡️', text: '100% Safe & Certified' }, { icon: '🚚', text: 'Free delivery ₹499+' }, { icon: '↩️', text: '30-day returns' }].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.80rem', color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
                    <span>{b.icon}</span>{b.text}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 'clamp(200px,28vw,260px)', height: 'clamp(260px,35vw,340px)', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 20px 56px rgba(0,0,0,0.25)', border: '4px solid rgba(255,255,255,0.28)' }}>
                <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?w=520&h=680&fit=crop&auto=format" alt="Happy Baby" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {[{ top: '16px', left: '-16px', icon: '🧸', num: '12k+', sub: 'Happy Families', delay: '0s' }, { bottom: '16px', right: '-16px', icon: '⭐', num: '4.9', sub: '500+ Reviews', delay: '1.5s' }].map((b, i) => (
                <div key={i} style={{ position: 'absolute', top: b.top, bottom: b.bottom, left: b.left, right: b.right, background: 'white', borderRadius: '12px', padding: '8px 12px', boxShadow: '0 8px 20px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', gap: '7px', animation: `badgeFloat 3s ease-in-out infinite ${b.delay}` }}>
                  <span style={{ fontSize: '1.2rem' }}>{b.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: '700', color: '#FF6B35', fontFamily: 'Nunito, sans-serif' }}>{b.num}</p>
                    <p style={{ margin: 0, fontSize: '0.60rem', color: '#888', fontFamily: 'Nunito, sans-serif' }}>{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes badgeFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }`}</style>
    </section>
  );
}

/* ═══════════════════════════════════════
   MAIN HOME CLIENT — ✅ With Show/Hide & Order
═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   MAIN HOME CLIENT — ✅ Custom order
═══════════════════════════════════════ */
export default function HomeClient({
  heroBanners         = [],
  brands              = [],
  festivalBanners     = [],
  budgetBanners       = [],
  sunnyBanners        = [],
  promoBanners        = [],
  genderBanners       = [],
  personalCareBanners = [],
  healthCareBanners   = [],
  evBanners           = [],
  babyFoodBanners     = [],
  toysBanners         = [],
  ctaBanners          = [],
  trending            = [],
  featured            = [],
  initialSectionSettings = {},
}) {
  useScrollReveal();
  const sectionSettings = useSectionSettings(initialSectionSettings);

  // ✅ Check if section is visible (default true)
  const isVisible = (key) => sectionSettings[key]?.isVisible !== false;

  // ✅ YOUR CUSTOM ORDER:
  // 1. Hero → 2. Brands → 3. Category(Promo) → 4. Budget → 5. Sunny
  // → 6. Festival → 7. Gender → 8. Baby Food → 9. Toys
  // → 10. Personal+Health Care → 11. Electric → 12. Trending → 13. CTA
  const allSections = [
    { key: 'hero',          render: <HeroBanner banners={heroBanners} /> },
    { key: 'brands',        render: <BrandsSection brands={brands} /> },
    { key: 'promo',         render: <PromoSection banners={promoBanners} sectionSettings={sectionSettings} /> },
    { key: 'budget',        render: <BudgetSection banners={budgetBanners} sectionSettings={sectionSettings} /> },
    { key: 'sunny',         render: <SunnySection banners={sunnyBanners} sectionSettings={sectionSettings} /> },
    { key: 'festival',      render: <SeasonBanner banners={festivalBanners} /> },
    { key: 'gender',        render: <GenderSection banners={genderBanners} sectionSettings={sectionSettings} /> },
    { key: 'baby-food',     render: <BabyFoodSection banners={babyFoodBanners} sectionSettings={sectionSettings} /> },
    { key: 'toys',          render: <ToysSection banners={toysBanners} sectionSettings={sectionSettings} /> },
    { key: 'care',          render: <CareSection personalCareBanners={personalCareBanners} healthCareBanners={healthCareBanners} sectionSettings={sectionSettings} /> },
    { key: 'electric',      render: <EVSection banners={evBanners} sectionSettings={sectionSettings} /> },
    { key: 'trending',      render: <TrendingFeaturedSection trending={trending} featured={featured} /> },
    { key: 'cta',           render: <CTASection banners={ctaBanners} /> },
  ];

  return (
    <div className={styles.home}>
      {allSections.map(section => (
        isVisible(section.key) && (
          <div key={section.key}>
            {section.render}
          </div>
        )
      ))}
    </div>
  );
}