'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import HeroBanner from '@/components/home/HeroBanner';
import ProductCard from '@/components/products/ProductCard';
import useScrollReveal from '@/hooks/useScrollReveal';
import styles from './HomeClient.module.css';

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
   2. BRANDS — Rainbow auto scroll
═══════════════════════════════════════ */
function BrandsSection({ brands }) {
  const displayBrands = brands?.length > 0 ? brands : DEFAULT_BRANDS;
  const items = [...displayBrands, ...displayBrands, ...displayBrands];

  return (
    <section style={{
      background: 'white',
      borderTop: '1px solid #F3E8FF',
      borderBottom: '1px solid #F3E8FF',
      overflow: 'hidden',
      padding: '0',
    }}>
      <div style={{
        height: '3px',
        background: 'linear-gradient(90deg, #FF6B35, #7B2FBE, #FF8C5A, #9B4FDE, #FF6B35)',
        backgroundSize: '300% 100%',
        animation: 'rainbowShift 4s linear infinite',
      }} />
      <div style={{ position: 'relative', overflow: 'hidden', padding: '12px 0' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '60px',
          background: 'linear-gradient(to right, white, transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px',
          background: 'linear-gradient(to left, white, transparent)',
          zIndex: 2, pointerEvents: 'none',
        }} />
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
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                textDecoration: 'none', padding: '7px 16px', borderRadius: '999px',
                border: `1.5px solid ${brand.color}25`, background: `${brand.color}08`,
                flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${brand.color}18`;
                e.currentTarget.style.borderColor = brand.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = `${brand.color}08`;
                e.currentTarget.style.borderColor = `${brand.color}25`;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {brand.logo?.url ? (
                <img
                  src={brand.logo.url}
                  alt={brand.name}
                  style={{
                    width: '20px', height: '20px',
                    objectFit: 'contain', borderRadius: '3px', flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: '7px', height: '7px',
                  borderRadius: '50%', background: brand.color, flexShrink: 0,
                }} />
              )}
              <span style={{
                fontSize: '0.84rem', fontWeight: '800',
                color: brand.color, fontFamily: 'Nunito, sans-serif',
              }}>
                {brand.name}
              </span>
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
   3. SEASON BANNER
═══════════════════════════════════════ */
function SeasonBanner({ banners }) {
  const [current,   setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused,    setPaused]    = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!banners?.length || banners.length <= 1 || paused) return;
    timerRef.current = setInterval(() => setCurrent(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [banners?.length, paused]);

  if (!banners?.length) return null;
  const banner = banners[current];
  const imgUrl = banner.image?.url || null;

  const go = (idx) => {
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 300);
  };

  return (
    <section
      style={{ position: 'relative', overflow: 'hidden', width: '100%' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ✅ FIXED: Use <img> tag for proper image display without cropping */}
      <div style={{ position: 'relative', width: '100%', minHeight: 'clamp(200px,35vw,480px)' }}>
        {imgUrl ? (
          <>
            <img
              src={imgUrl}
              alt={banner.title}
              style={{
                width: '100%',
                height: 'clamp(200px,35vw,480px)',
                objectFit: 'cover',
                objectPosition: 'center center',
                display: 'block',
                opacity: animating ? 0 : 1,
                transition: 'opacity 0.35s ease',
              }}
            />
          </>
        ) : (
          <div style={{
            width: '100%',
            height: 'clamp(200px,35vw,480px)',
            background: `linear-gradient(135deg, ${banner.bgColor || '#FF6B35'}, #7B2FBE)`,
            opacity: animating ? 0 : 1,
            transition: 'opacity 0.35s ease',
          }} />
        )}

        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)',
        }} />

        {/* Content */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center',
          padding: 'clamp(20px,5vw,80px)',
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(12px)' : 'translateY(0)',
          transition: 'all 0.35s ease',
        }}>
          <div style={{ maxWidth: '520px' }}>
            {(banner.festivalName || banner.subtitle) && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 14px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: '999px',
                fontSize: 'clamp(0.70rem,1.5vw,0.78rem)',
                fontWeight: '700', color: 'white',
                marginBottom: '14px', fontFamily: 'Nunito, sans-serif',
              }}>
                {banner.emoji && <span>{banner.emoji}</span>}
                {banner.festivalName || banner.subtitle}
              </div>
            )}
            <h2 style={{
              fontSize: 'clamp(1.4rem,4vw,3.2rem)', fontWeight: '800',
              color: 'white', margin: '0 0 10px', lineHeight: 1.15,
              textShadow: '0 3px 20px rgba(0,0,0,0.30)', fontFamily: 'Nunito, sans-serif',
            }}>
              {banner.title}
            </h2>
            {banner.subtitle && banner.festivalName && (
              <p style={{
                fontSize: 'clamp(0.82rem,1.5vw,1rem)',
                color: 'rgba(255,255,255,0.88)', margin: '0 0 24px',
                lineHeight: 1.6, fontWeight: '500',
                fontFamily: 'Nunito, sans-serif', maxWidth: '440px',
              }}>
                {banner.subtitle}
              </p>
            )}
            <Link
              href={banner.buttonLink || '/products'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: 'clamp(10px,2vw,13px) clamp(20px,3vw,32px)',
                background: 'white', color: '#FF6B35', borderRadius: '999px',
                textDecoration: 'none', fontWeight: '800',
                fontSize: 'clamp(0.84rem,1.5vw,0.95rem)',
                boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              {banner.buttonText || 'Shop Now'} →
            </Link>
          </div>
        </div>

        {/* Nav arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => go((current - 1 + banners.length) % banners.length)}
              style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.88)', border: 'none',
                borderRadius: '50%',
                width: 'clamp(36px,5vw,44px)', height: 'clamp(36px,5vw,44px)',
                fontSize: '1.5rem', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 3, color: '#2D1A4A',
                boxShadow: '0 4px 14px rgba(0,0,0,0.16)', fontFamily: 'inherit',
              }}
            >‹</button>
            <button
              onClick={() => go((current + 1) % banners.length)}
              style={{
                position: 'absolute', right: '12px', top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.88)', border: 'none',
                borderRadius: '50%',
                width: 'clamp(36px,5vw,44px)', height: 'clamp(36px,5vw,44px)',
                fontSize: '1.5rem', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 3, color: '#2D1A4A',
                boxShadow: '0 4px 14px rgba(0,0,0,0.16)', fontFamily: 'inherit',
              }}
            >›</button>
          </>
        )}

        {/* Progress bar */}
        {banners.length > 1 && !paused && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '3px', background: 'rgba(255,255,255,0.25)', zIndex: 3,
          }}>
            <div
              key={current}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #FF6B35, white)',
                animation: 'seasonProgress 5s linear forwards',
              }}
            />
          </div>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div style={{
            position: 'absolute', bottom: '14px', left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', gap: '6px', zIndex: 4,
          }}>
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setAnimating(false); }}
                style={{
                  width: i === current ? '22px' : '8px', height: '8px',
                  borderRadius: '999px', border: 'none',
                  background: i === current ? 'white' : 'rgba(255,255,255,0.50)',
                  cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s ease', fontFamily: 'inherit',
                }}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes seasonProgress { from { width: 0%; } to { width: 100%; } }`}</style>
    </section>
  );
}

/* ═══════════════════════════════════════
   4. BUDGET
═══════════════════════════════════════ */
function BudgetSection({ banners }) {
  const displayBudget = banners?.length > 0
    ? banners.map((b, i) => ({
        price: b.price || DEFAULT_BUDGET[i]?.price || 499,
        emoji: b.emoji || DEFAULT_BUDGET[i]?.emoji || '🎀',
        color: b.color || DEFAULT_BUDGET[i]?.color || '#FF6B35',
        offer: b.offer || 'Under',
        link: b.buttonLink || `/products?maxPrice=${b.price || 499}`,
        image: b.image?.url || null,
        title: b.title || '',
      }))
    : DEFAULT_BUDGET;

  const sectionBg = getSectionBackgroundUrl(banners);

  return (
    <section style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(42px,6vw,70px) 20px' }}>
      {/* ✅ direct background image */}
      {sectionBg ? (
        <img
          src={sectionBg}
          alt="Budget background"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: 0.18,
            filter: 'blur(1px)',
            transform: 'scale(1.04)',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, #FFF3EC 0%, #FFF9F5 30%, #F3E8FF 60%, #F8F0FF 100%)',
          }}
        />
      )}

      {/* aesthetic overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.78))' }} />
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.14) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,190,0.12) 0%, transparent 70%)' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <div style={{ marginBottom: '36px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 18px',
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255,107,53,0.25)',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: '800',
              color: '#FF6B35',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            💰 Save More
          </span>

          <h2 style={{ fontSize: 'clamp(1.7rem,3vw,2.7rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif' }}>
            🏪 Budget Store
          </h2>

          <p style={{ fontSize: '1rem', color: '#7C6A96', margin: 0, fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
            Best baby deals under your budget
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(12px,2vw,28px)', flexWrap: 'wrap' }}>
          {displayBudget.map((item, i) => (
            <Link key={i} href={item.link} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 'clamp(132px,18vw,190px)',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  border: `3px solid ${item.color}`,
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: `0 10px 30px ${item.color}20`,
                  transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 22px 48px ${item.color}32`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${item.color}20`;
                }}
              >
                {item.image ? (
                  <>
                    <img
                      src={item.image}
                      alt={item.title || `Under ₹${item.price}`}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        padding: '14px',
                        boxSizing: 'border-box',
                        display: 'block',
                        borderRadius: '50%',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '10px',
                        right: '10px',
                        bottom: '10px',
                        padding: '8px 10px',
                        borderRadius: '999px',
                        background: 'rgba(255,255,255,0.88)',
                        backdropFilter: 'blur(8px)',
                        textAlign: 'center',
                        boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                      }}
                    >
                      <span style={{ display: 'block', fontSize: '1rem', fontWeight: '900', color: item.color, fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>
                        ₹{item.price}
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: '800', color: '#7C6A96', fontFamily: 'Nunito, sans-serif' }}>
                        {item.offer}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 'clamp(1.8rem,3vw,3rem)', lineHeight: 1 }}>{item.emoji}</span>
                    <span style={{ fontSize: '0.60rem', fontWeight: '800', color: '#9585B0', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Nunito, sans-serif' }}>
                      {item.offer}
                    </span>
                    <span style={{ fontSize: 'clamp(1.2rem,2.5vw,2.2rem)', fontWeight: '900', color: item.color, fontFamily: 'Nunito, sans-serif', lineHeight: 1 }}>
                      ₹{item.price}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'white', background: item.color, padding: '2px 12px', borderRadius: '999px', fontFamily: 'Nunito, sans-serif' }}>
                      Shop →
                    </span>
                  </>
                )}
              </div>

              <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.84rem', fontWeight: '800', color: '#2D1A4A', fontFamily: 'Nunito, sans-serif' }}>
                {item.title || `Under ₹${item.price}`}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
/* ═══════════════════════════════════════
   5. SUNNY — No shop button, click → clothing
═══════════════════════════════════════ */
function SunnySection({ banners }) {
  if (!banners?.length) return null;

  return (
    <section style={{ padding: 'clamp(40px,6vw,60px) 20px', background: 'linear-gradient(135deg, #FFF9EC 0%, #FFFBF5 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '28px', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <span style={{
              display: 'inline-block', padding: '4px 14px',
              background: 'linear-gradient(135deg, #FFF9EC, #FFF3EC)',
              border: '1.5px solid #FFD4B8', borderRadius: '999px',
              fontSize: '0.70rem', fontWeight: '800', color: '#FF6B35',
              textTransform: 'uppercase', letterSpacing: '0.8px',
              marginBottom: '8px', fontFamily: 'Nunito, sans-serif',
            }}>
              ☀️ Collections
            </span>
            <h2 style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
              ☀️ Sunny Play Days
            </h2>
          </div>
          <Link
            href="/products?category=clothing"
            style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
              color: 'white', borderRadius: '999px', textDecoration: 'none',
              fontSize: '0.82rem', fontWeight: '700', fontFamily: 'Nunito, sans-serif',
            }}
          >
            View All →
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(150px,20vw,220px), 1fr))',
          gap: '16px',
        }}>
          {banners.map((banner, i) => {
            const imageUrl = banner.image?.url || null;
            return (
              <Link key={banner.id || i} href="/products?category=clothing" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    borderRadius: '20px', overflow: 'hidden',
                    // ✅ FIXED: Proper height with image aspect ratio preserved
                    position: 'relative',
                    border: '2px solid #EDD9FF',
                    transition: 'all 0.3s ease', cursor: 'pointer',
                    background: '#E0F2FE',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(255,107,53,0.18)';
                    e.currentTarget.style.borderColor = '#FF6B35';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#EDD9FF';
                  }}
                >
                  {imageUrl ? (
                    // ✅ FIXED: Image shows full without cropping top/bottom
                    <div style={{ position: 'relative', width: '100%', minHeight: 'clamp(180px,24vw,260px)' }}>
                      <img
                        src={imageUrl}
                        alt={banner.title || 'Collection'}
                        style={{
                          width: '100%',
                          height: 'clamp(180px,24vw,260px)',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                          display: 'block',
                        }}
                      />
                      {/* Gradient overlay */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.40) 0%, transparent 50%)',
                        zIndex: 1,
                      }} />
                      {/* Vertical title sidebar */}
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: '36px', background: 'rgba(255,255,255,0.92)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                      }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '900', color: '#2D1A4A',
                          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                          letterSpacing: '1px', textTransform: 'uppercase',
                          fontFamily: 'Nunito, sans-serif',
                        }}>
                          {banner.title}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      height: 'clamp(180px,24vw,260px)',
                      background: 'linear-gradient(160deg, #c5e9f8, #8fd2f2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '4.5rem', position: 'relative',
                    }}>
                      {banner.emoji || '👕'}
                      <div style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: '36px', background: 'rgba(255,255,255,0.92)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '900', color: '#2D1A4A',
                          writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                          letterSpacing: '1px', textTransform: 'uppercase',
                          fontFamily: 'Nunito, sans-serif',
                        }}>
                          {banner.title}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   6. PROMO — Auto-play 3.5s
═══════════════════════════════════════ */
function PromoSection({ banners }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!banners?.length || banners.length <= 1) return;

    timerRef.current = setInterval(() => {
      if (!paused) {
        setCurrent(prev => (prev + 1) % banners.length);
      }
    }, 3500);

    return () => clearInterval(timerRef.current);
  }, [banners?.length, paused]);

  if (!banners?.length) return null;

  const goPrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(prev => (prev - 1 + banners.length) % banners.length);
  };

  const goNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(prev => (prev + 1) % banners.length);
  };

  return (
    <section
      style={{
        padding: 'clamp(40px,6vw,60px) 20px',
        background: 'linear-gradient(135deg, #FFF3EC 0%, #F3E8FF 100%)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)',
              border: '1.5px solid #FFD4B8',
              borderRadius: '999px',
              fontSize: '0.70rem',
              fontWeight: '800',
              color: '#FF6B35',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '8px',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            🏷️ Hot Deals
          </span>

          <h2
            style={{
              fontSize: 'clamp(1.4rem,2.5vw,2rem)',
              fontWeight: '800',
              color: '#2D1A4A',
              margin: 0,
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            🏷️ Special Offers
          </h2>
        </div>

        {/* Main Slider */}
        <div
          style={{
            position: 'relative',
            height: 'clamp(240px, 36vw, 420px)',
            borderRadius: '24px',
            overflow: 'hidden',
            background: '#ffffff',
            boxShadow: '0 18px 50px rgba(45,26,74,0.12)',
          }}
        >
          {banners.map((banner, i) => {
            const isActive = i === current;

            return (
              <div
                key={banner.id || i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  transition: 'opacity 0.55s ease',
                  zIndex: isActive ? 2 : 1,
                  pointerEvents: isActive ? 'auto' : 'none',
                  background: '#ffffff',
                }}
              >
                <Link
                  href={banner.buttonLink || '/products'}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    background: '#ffffff',
                  }}
                >
                  {banner.image?.url ? (
                    <img
                      src={banner.image.url}
                      alt={banner.title || `Promo ${i + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',       // ✅ full image visible
                        objectPosition: 'center',
                        display: 'block',
                        background: '#ffffff',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(135deg, ${banner.bgColor || '#FFF3EC'}, #F3E8FF)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '5rem',
                      }}
                    >
                      {banner.emoji || '🎁'}
                    </div>
                  )}
                </Link>
              </div>
            );
          })}

          {/* Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={goPrev}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.94)',
                  color: '#2D1A4A',
                  fontSize: '1.5rem',
                  fontWeight: '900',
                  cursor: 'pointer',
                  zIndex: 5,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  fontFamily: 'inherit',
                }}
              >
                ‹
              </button>

              <button
                onClick={goNext}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.94)',
                  color: '#2D1A4A',
                  fontSize: '1.5rem',
                  fontWeight: '900',
                  cursor: 'pointer',
                  zIndex: 5,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  fontFamily: 'inherit',
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Progress Bar */}
          {!paused && banners.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'rgba(0,0,0,0.08)',
                zIndex: 5,
              }}
            >
              <div
                key={current}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #FF6B35, #7B2FBE)',
                  animation: 'promoProgressFinal 3.5s linear forwards',
                }}
              />
            </div>
          )}

          {/* Dots */}
          {banners.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '7px',
                zIndex: 6,
              }}
            >
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrent(i);
                  }}
                  style={{
                    width: i === current ? '26px' : '8px',
                    height: '8px',
                    borderRadius: '999px',
                    border: 'none',
                    background: i === current ? '#FF6B35' : 'rgba(45,26,74,0.18)',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {banners.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '14px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {banners.map((banner, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: '92px',
                  height: '62px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `2.5px solid ${i === current ? '#FF6B35' : 'transparent'}`,
                  cursor: 'pointer',
                  padding: 0,
                  background: '#ffffff',
                  opacity: i === current ? 1 : 0.6,
                  transition: 'all 0.25s ease',
                  boxShadow: i === current
                    ? '0 4px 14px rgba(255,107,53,0.24)'
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  outline: 'none',
                }}
              >
                {banner.image?.url ? (
                  <img
                    src={banner.image.url}
                    alt={banner.title || `Thumb ${i + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',      // ✅ thumbnail also full fit
                      objectPosition: 'center',
                      display: 'block',
                      background: '#ffffff',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      background: `linear-gradient(135deg, ${banner.bgColor || '#FFF3EC'}, #F3E8FF)`,
                    }}
                  >
                    {banner.emoji || '🎁'}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes promoProgressFinal {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
/* ═══════════════════════════════════════
   7. GENDER
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
        style={{
          borderRadius: 'clamp(18px,2.5vw,28px)', overflow: 'hidden',
          position: 'relative', height: 'clamp(320px,45vw,520px)',
          boxShadow: hovered ? `0 28px 64px ${color}30` : '0 10px 40px rgba(0,0,0,0.12)',
          transform: hovered ? 'translateY(-10px)' : 'translateY(0)',
          transition: 'all 0.4s ease', cursor: 'pointer',
        }}
      >
        {/* ✅ FIXED: Image fills properly */}
        <img
          src={imgUrl}
          alt={title}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.5s ease',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to top, ${color}CC 0%, ${color}40 40%, transparent 70%)`,
        }} />
        <div style={{
          position: 'absolute', top: '16px', left: '16px',
          padding: '6px 14px', background: color, color: 'white',
          borderRadius: '999px', fontSize: '0.80rem', fontWeight: '800',
          fontFamily: 'Nunito, sans-serif', boxShadow: `0 4px 12px ${color}50`,
        }}>
          {isGirl ? '👧 Girls' : '👦 Boys'}
        </div>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: 'clamp(20px,3vw,32px)', zIndex: 2,
        }}>
          <h3 style={{
            fontSize: 'clamp(1.2rem,2.5vw,1.9rem)', fontWeight: '800',
            color: 'white', margin: '0 0 6px',
            textShadow: '0 2px 10px rgba(0,0,0,0.25)', fontFamily: 'Nunito, sans-serif',
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: 'clamp(0.78rem,1.2vw,0.90rem)',
            color: 'rgba(255,255,255,0.88)', margin: '0 0 16px',
            fontWeight: '500', fontFamily: 'Nunito, sans-serif',
          }}>
            {sub}
          </p>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '9px 22px', background: 'white', color: color,
            borderRadius: '999px', fontSize: '0.86rem', fontWeight: '800',
            fontFamily: 'Nunito, sans-serif', boxShadow: '0 4px 14px rgba(0,0,0,0.20)',
          }}>
            Shop Now →
          </span>
        </div>
      </div>
    </Link>
  );
}

function GenderSection({ banners }) {
  const girlBanner = banners?.find(b => b.gender === 'girl');
  const boyBanner  = banners?.find(b => b.gender === 'boy');
  return (
    <section style={{ padding: 'clamp(40px,6vw,60px) 20px', background: 'linear-gradient(160deg, #FDF2F8 0%, #E0F2FE 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{
            display: 'inline-block', padding: '5px 18px',
            background: 'linear-gradient(135deg, #FDF2F8, #E0F2FE)',
            border: '1.5px solid #FCE7F3', borderRadius: '999px',
            fontSize: '0.72rem', fontWeight: '800', color: '#BE185D',
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: '12px', fontFamily: 'Nunito, sans-serif',
          }}>
            👗 Shop By Style
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
            Shop by Style 👗
          </h2>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(14px,2.5vw,28px)', maxWidth: '900px', margin: '0 auto',
        }}>
          <GenderCard banner={girlBanner} isGirl={true}  />
          <GenderCard banner={boyBanner}  isGirl={false} />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   8. BABY FOOD
═══════════════════════════════════════ */
function BabyFoodSection({ banners }) {
  if (!banners?.length) return null;
  const defaultFoodColors = ['#FF6B35', '#10B981', '#EF4444', '#0EA5E9', '#F59E0B', '#7B2FBE'];

  return (
    <section style={{ padding: 'clamp(40px,6vw,60px) 20px', background: 'linear-gradient(135deg, #FFFBF5 0%, #F0FDF4 50%, #F3E8FF 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{
            display: 'inline-block', padding: '5px 18px',
            background: 'linear-gradient(135deg, #FFFBF5, #F0FDF4)',
            border: '1.5px solid #BBF7D0', borderRadius: '999px',
            fontSize: '0.72rem', fontWeight: '800', color: '#166534',
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: '12px', fontFamily: 'Nunito, sans-serif',
          }}>
            🍎 Nutrition First
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif' }}>
            🍼 Baby Food & Nutrition
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
            Healthy, tasty & nutritious food for your little one
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(150px,18vw,200px), 1fr))',
          gap: '18px',
        }}>
          {banners.map((banner, i) => {
            const color  = banner.color || defaultFoodColors[i % defaultFoodColors.length];
            const imgUrl = banner.image?.url || null;
            const link   = banner.buttonLink || '/products?category=food';

            return (
              <Link key={banner.id || i} href={link} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: 'white', borderRadius: '22px', overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
                    border: '2px solid transparent', transition: 'all 0.3s ease', cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = `0 20px 48px ${color}25`;
                    e.currentTarget.style.borderColor = color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.07)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ height: '4px', background: color }} />
                  {/* ✅ FIXED: Image container with proper rendering */}
                  <div style={{
                    height: 'clamp(120px,16vw,160px)',
                    overflow: 'hidden',
                    background: imgUrl ? '#f8f8f8' : `${color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '4rem',
                  }}>
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={banner.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          objectPosition: 'center',
                          display: 'block',
                          padding: '8px',
                          boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <span>{banner.emoji || '🍼'}</span>
                    )}
                  </div>
                  <div style={{ padding: '14px' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>
                      {banner.title}
                    </h3>
                    {banner.subtitle && (
                      <p style={{ fontSize: '0.74rem', color: '#9585B0', margin: '0 0 10px', fontWeight: '500', fontFamily: 'Nunito, sans-serif', lineHeight: 1.4 }}>
                        {banner.subtitle}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: color, fontFamily: 'Nunito, sans-serif' }}>
                        Shop Now →
                      </span>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem',
                      }}>
                        {banner.emoji || '🍼'}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link
            href="/products?category=food"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 28px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white', borderRadius: '999px', textDecoration: 'none',
              fontWeight: '800', fontSize: '0.90rem',
              boxShadow: '0 6px 18px rgba(16,185,129,0.28)', fontFamily: 'Nunito, sans-serif',
            }}
          >
            View All Baby Food 🍎
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   9. TOYS — ✅ With proper image rendering
═══════════════════════════════════════ */
function ToysSection({ banners }) {
  if (!banners?.length) return null;

  const sectionBg = getSectionBackgroundUrl(banners);

  return (
    <section style={{ position: 'relative', padding: 'clamp(42px,6vw,68px) 20px', overflow: 'hidden' }}>
      {/* direct background image */}
      {sectionBg ? (
        <img
          src={sectionBg}
          alt="Toys background"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: 0.18,
            filter: 'blur(1px)',
            transform: 'scale(1.04)',
          }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 50%, #FDF4FF 100%)' }} />
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.58), rgba(255,255,255,0.82))' }} />
      <div style={{ position: 'absolute', top: '-70px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.14) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '-80px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,190,0.10) 0%, transparent 70%)' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(8px)', border: '1.5px solid #FCA5A5', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'Nunito, sans-serif' }}>
              🎠 Play Time
            </span>
            <h2 style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
              🧸 Toys & Games
            </h2>
          </div>

          <Link
            href="/products?category=toys"
            style={{
              padding: '9px 20px',
              background: 'linear-gradient(135deg,#EF4444,#7B2FBE)',
              color: 'white',
              borderRadius: '999px',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: '700',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            View All Toys →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px,18vw,230px), 1fr))', gap: '18px' }}>
          {banners.map((banner, i) => {
            const imageUrl = banner.image?.url || null;
            const link = banner.buttonLink || '/products?category=toys';
            const color = banner.color || '#EF4444';

            return (
              <Link key={banner.id || i} href={link} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.86)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '22px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(45,26,74,0.08)',
                    border: '1.5px solid rgba(255,255,255,0.75)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 18px 44px rgba(239,68,68,0.16)';
                    e.currentTarget.style.borderColor = `${color}55`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,26,74,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.75)';
                  }}
                >
                  <div style={{ height: 'clamp(150px,18vw,210px)', overflow: 'hidden', background: imageUrl ? '#fffaf9' : 'linear-gradient(135deg, #FEF2F2, #FFF7ED)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={banner.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          objectPosition: 'center',
                          display: 'block',
                          padding: '12px',
                          boxSizing: 'border-box',
                          transition: 'transform 0.35s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ) : (
                      <span style={{ fontSize: '4rem' }}>{banner.emoji || '🧸'}</span>
                    )}

                    <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', borderRadius: '999px', background: `${color}`, color: 'white', fontSize: '10px', fontWeight: '800', fontFamily: 'Nunito, sans-serif', boxShadow: `0 6px 14px ${color}40` }}>
                      Play
                    </div>
                  </div>

                  <div style={{ padding: '14px 14px 16px' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>
                      {banner.title}
                    </h3>

                    {banner.subtitle && (
                      <p style={{ fontSize: '0.74rem', color: '#8E7AA8', margin: '0 0 10px', fontWeight: '600', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>
                        {banner.subtitle}
                      </p>
                    )}

                    <span style={{ fontSize: '0.80rem', fontWeight: '800', color: color, fontFamily: 'Nunito, sans-serif' }}>
                      Shop Now →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
/* ═══════════════════════════════════════
   10. CARE — Personal Care + Health Care
═══════════════════════════════════════ */
function CareSection({ personalCareBanners, healthCareBanners }) {
  const getItems = (banners, type, fallbackLink) => {
    return (banners || []).flatMap(b => {
      if (b.gridImages?.length > 0) {
        return b.gridImages.map(img => ({
          url: img.url || '',
          title: img.title || b.title || '',
          brand: img.brand || '',
          price: img.price || '',
          link: img.link || b.buttonLink || fallbackLink,
          type,
        }));
      }

      if (b.image?.url) {
        return [
          {
            url: b.image.url,
            title: b.title || (type === 'personal' ? 'Personal Care' : 'Health Care'),
            brand: '',
            price: '',
            link: b.buttonLink || fallbackLink,
            type,
          },
        ];
      }

      return [];
    });
  };

  const personalItems = getItems(personalCareBanners, 'personal', '/products?category=personal-care');
  const healthItems = getItems(healthCareBanners, 'health', '/products?category=health-care');

  if (!personalItems.length && !healthItems.length) return null;

  const MagazineRow = ({ items, type, title, emoji, accentColor, linkAll }) => {
    if (!items.length) return null;

    const filled = [...items];
    while (filled.length < 3) filled.push(...items);
    const display = filled.slice(0, 3);

    const big = display[0];
    const sideCards = display.slice(1, 3);

    const SmallCard = ({ item }) => (
      <Link href={item.link} style={{ textDecoration: 'none', display: 'block' }}>
        <div
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            height: 'clamp(118px,16vw,185px)',
            background: item.url ? '#f8f8f8' : type === 'personal' ? '#F3E8FF' : '#ECFDF5',
            border: '1.5px solid transparent',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = accentColor;
            e.currentTarget.style.boxShadow = `0 14px 30px ${accentColor}22`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'transparent';
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
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
              {type === 'personal' ? '🧴' : '💊'}
            </div>
          )}

          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.58) 0%, transparent 58%)' }} />

          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px' }}>
            {item.brand && (
              <p style={{ fontSize: '0.58rem', fontWeight: '800', color: 'rgba(255,255,255,0.76)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'Nunito, sans-serif' }}>
                {item.brand}
              </p>
            )}
            <p style={{ fontSize: '0.80rem', fontWeight: '800', color: 'white', margin: 0, lineHeight: 1.2, fontFamily: 'Nunito, sans-serif' }}>
              {item.title}
            </p>
            {item.price && (
              <p style={{ fontSize: '0.82rem', fontWeight: '900', color: 'white', margin: '3px 0 0', fontFamily: 'Nunito, sans-serif' }}>
                ₹{item.price}
              </p>
            )}
          </div>
        </div>
      </Link>
    );

    return (
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '34px', borderRadius: '999px', background: accentColor }} />
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: '800', color: accentColor, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Nunito, sans-serif' }}>
                {emoji} {type === 'personal' ? 'Baby Care' : 'Stay Healthy'}
              </p>
              <h3 style={{ fontSize: 'clamp(1.1rem,2vw,1.5rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
                {title}
              </h3>
            </div>
          </div>

          <Link
            href={linkAll}
            style={{
              padding: '8px 18px',
              background: accentColor,
              color: 'white',
              borderRadius: '999px',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: '700',
              fontFamily: 'Nunito, sans-serif',
              boxShadow: `0 4px 12px ${accentColor}35`,
            }}
          >
            View All →
          </Link>
        </div>

        <div className="careLayoutGrid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(260px,0.85fr)', gap: '14px' }}>
          {/* left big */}
          <Link href={big.link} style={{ textDecoration: 'none', display: 'block' }}>
            <div
              style={{
                borderRadius: '22px',
                overflow: 'hidden',
                height: 'clamp(260px,35vw,420px)',
                position: 'relative',
                background: big.url ? '#f8f8f8' : type === 'personal' ? '#F3E8FF' : '#ECFDF5',
                border: '1.5px solid transparent',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.boxShadow = `0 18px 42px ${accentColor}25`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {big.url ? (
                <img
                  src={big.url}
                  alt={big.title || type}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>
                  {type === 'personal' ? '🧴' : '💊'}
                </div>
              )}

              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.66) 0%, transparent 58%)' }} />

              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 18px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: accentColor, borderRadius: '999px', fontSize: '0.66rem', fontWeight: '800', color: 'white', marginBottom: '8px', fontFamily: 'Nunito, sans-serif' }}>
                  ⭐ Featured
                </div>

                {big.brand && (
                  <p style={{ fontSize: '0.62rem', fontWeight: '800', color: 'rgba(255,255,255,0.75)', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Nunito, sans-serif' }}>
                    {big.brand}
                  </p>
                )}

                <h4 style={{ fontSize: 'clamp(0.95rem,1.5vw,1.18rem)', fontWeight: '800', color: 'white', margin: '0 0 6px', lineHeight: 1.2, fontFamily: 'Nunito, sans-serif' }}>
                  {big.title}
                </h4>

                {big.price && (
                  <p style={{ fontSize: '1.08rem', fontWeight: '900', color: 'white', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
                    ₹{big.price}
                  </p>
                )}
              </div>
            </div>
          </Link>

          {/* right 2 cards */}
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '14px' }}>
            {sideCards.map((item, i) => (
              <SmallCard key={i} item={item} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section style={{ padding: 'clamp(42px,6vw,68px) 20px', background: 'linear-gradient(135deg, #FAFAFA 0%, #F8F4FF 50%, #F0FDF4 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ display: 'inline-block', padding: '5px 18px', background: 'linear-gradient(135deg, #F3E8FF, #ECFDF5)', border: '1.5px solid #DFC5F8', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'Nunito, sans-serif' }}>
            🌿 Baby Wellness
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
            Wellness & Care Products
          </h2>
        </div>

        <MagazineRow
          items={personalItems}
          type="personal"
          title="Personal Baby Care"
          emoji="🧴"
          accentColor="#7B2FBE"
          linkAll="/products?category=personal-care"
        />

        {personalItems.length > 0 && healthItems.length > 0 && (
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #EDD9FF, transparent)', marginBottom: '48px' }} />
        )}

        <MagazineRow
          items={healthItems}
          type="health"
          title="Health & Safety"
          emoji="💊"
          accentColor="#10B981"
          linkAll="/products?category=health-care"
        />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .careLayoutGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
/* ═══════════════════════════════════════
   11. ELECTRIC VEHICLES
═══════════════════════════════════════ */
function EVSection({ banners }) {
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
            🚗 Electric Vehicles for Kids
          </h2>
          <p style={{ fontSize: '0.95rem', color: '#6B7280', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
            Premium battery-powered rides for every little adventurer
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(180px,22vw,280px), 1fr))', gap: '20px' }}>
          {banners.slice(0, 4).map((item, i) => (
            <Link key={i} href={item.buttonLink || '/products?category=electric-vehicles'} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)',
                  borderRadius: '22px', overflow: 'hidden',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.07)',
                  border: '2px solid rgba(255,255,255,0.60)',
                  transition: 'all 0.3s ease', cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 22px 56px rgba(14,165,233,0.18)';
                  e.currentTarget.style.borderColor = 'rgba(14,165,233,0.50)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.60)';
                }}
              >
                {/* ✅ FIXED: EV image with proper display */}
                <div style={{
                  height: 'clamp(160px,20vw,220px)',
                  overflow: 'hidden',
                  background: item.image?.url ? '#f0f8ff' : 'linear-gradient(135deg, #E0F2FE, #F3E8FF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '5rem', position: 'relative',
                }}>
                  {item.image?.url ? (
                    <img
                      src={item.image.url}
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        display: 'block',
                        padding: '12px',
                        boxSizing: 'border-box',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    item.emoji || '🚗'
                  )}
                  {item.ageGroup && (
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px',
                      padding: '4px 10px', background: 'rgba(0,0,0,0.45)',
                      color: 'white', borderRadius: '999px', fontSize: '10px',
                      fontWeight: '700', fontFamily: 'Nunito, sans-serif', backdropFilter: 'blur(4px)',
                    }}>
                      👶 {item.ageGroup}
                    </div>
                  )}
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>
                    {item.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0EA5E9', fontFamily: 'Nunito, sans-serif' }}>
                      {item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'View Price'}
                    </span>
                    <span style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #0EA5E9, #7B2FBE)', color: 'white', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '800', fontFamily: 'Nunito, sans-serif' }}>
                      🛒 Shop
                    </span>
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
   12. TRENDING + FEATURED MIX
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
            <span style={{ display: 'block', padding: '4px 14px', background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)', border: '1.5px solid #FFD4B8', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'Nunito, sans-serif', width: 'fit-content' }}>
              This Week
            </span>
            <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
              🔥 Trending & ⭐ Featured Mix
            </h2>
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
                <Link
                  href="/register"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: 'clamp(11px,2vw,14px) clamp(22px,3vw,32px)', background: 'white', color: '#FF6B35', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: 'clamp(0.88rem,1.5vw,0.96rem)', boxShadow: '0 10px 32px rgba(0,0,0,0.18)', fontFamily: 'Nunito, sans-serif', transition: 'all 0.3s ease' }}
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
                {[
                  { icon: '🛡️', text: '100% Safe & Certified' },
                  { icon: '🚚', text: 'Free delivery ₹499+' },
                  { icon: '↩️', text: '30-day returns' },
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.80rem', color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>
                    <span>{b.icon}</span>{b.text}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 'clamp(200px,28vw,260px)', height: 'clamp(260px,35vw,340px)', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 20px 56px rgba(0,0,0,0.25)', border: '4px solid rgba(255,255,255,0.28)' }}>
                <img
                  src="https://images.unsplash.com/photo-1519689680058-324335c77eba?w=520&h=680&fit=crop&auto=format"
                  alt="Happy Baby"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {[
                { top: '16px', left: '-16px', icon: '🧸', num: '12k+', sub: 'Happy Families', delay: '0s' },
                { bottom: '16px', right: '-16px', icon: '⭐', num: '4.9', sub: '500+ Reviews', delay: '1.5s' },
              ].map((b, i) => (
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
   MAIN HOME CLIENT
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
  trending            = [],
  featured            = [],
}) {
  useScrollReveal();

  return (
    <div className={styles.home}>
      <HeroBanner banners={heroBanners} />
      <BrandsSection brands={brands} />
      <SeasonBanner banners={festivalBanners} />
      <BudgetSection banners={budgetBanners} />
      <SunnySection banners={sunnyBanners} />
      <PromoSection banners={promoBanners} />
      <GenderSection banners={genderBanners} />
      <BabyFoodSection banners={babyFoodBanners} />
      <ToysSection banners={toysBanners} />
      <CareSection
        personalCareBanners={personalCareBanners}
        healthCareBanners={healthCareBanners}
      />
      <EVSection banners={evBanners} />
      <TrendingFeaturedSection trending={trending} featured={featured} />
      <CTASection />
    </div>
  );
}