'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import HeroBanner from '@/components/home/HeroBanner';
import ProductCard from '@/components/products/ProductCard';
import useScrollReveal from '@/hooks/useScrollReveal';
import styles from './HomeClient.module.css';

/* ═══════════════════════════════════════
   HOOK — fetch section settings from DB
═══════════════════════════════════════ */
function useSectionSettings(initialSettings = {}) {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    fetch('/api/section-settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  return settings;
}

/* ═══════════════════════════════════════
   DEFAULTS
═══════════════════════════════════════ */
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
   FLIP CARD
═══════════════════════════════════════ */
function FlipCard({ children, sceneClassName = '', href }) {
  const [flipped, setFlipped] = useState(false);

  const inner = (
    <div
      className={`flipScene ${sceneClassName} ${flipped ? 'isFlipped' : ''}`}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onPointerDown={() => setFlipped(true)}
      onPointerUp={() => setFlipped(false)}
      onPointerLeave={() => setFlipped(false)}
      onPointerCancel={() => setFlipped(false)}
    >
      <div className="flipCard">{children}</div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

/* ═══════════════════════════════════════
   1. BRANDS SECTION
═══════════════════════════════════════ */
function BrandsSection({ brands, sectionSettings = {} }) {
  const s         = sectionSettings['brands'] || {};
  const secTitle  = s.title       || 'Top Baby Brands';
  const secDesc   = s.description || '';

  const displayBrands = brands?.length > 0 ? brands : DEFAULT_BRANDS;
  const items = [...displayBrands, ...displayBrands, ...displayBrands];

  return (
    <section style={{ background: 'white', borderTop: '7px solid #F3E8FF', borderBottom: '1px solid #F3E8FF', overflow: 'hidden', padding: '0' }}>
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #FF6B35, #7B2FBE, #FF8C5A, #9B4FDE, #FF6B35)', backgroundSize: '300% 100%', animation: 'rainbowShift 4s linear infinite' }} />
      
      {/* Section title if set */}
      {(s.title || s.description) && (
        <div style={{ textAlign: 'center', padding: '10px 16px 0', fontFamily: 'Nunito, sans-serif' }}>
          {s.title && <p style={{ fontSize: '0.78rem', fontWeight: '800', color: '#7B2FBE', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '1px' }}>{secTitle}</p>}
          {secDesc && <p style={{ fontSize: '0.72rem', color: '#9585B0', margin: 0, fontWeight: '500' }}>{secDesc}</p>}
        </div>
      )}

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
                <img src={brand.logo.url} alt={brand.name || 'Brand'} style={{ width: brand.name ? '32px' : '80px', height: brand.name ? '49px' : '47px', objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: brand.color, flexShrink: 0 }} />
              )}
              {brand.name && (
                <span style={{ fontSize: '0.84rem', fontWeight: '800', color: brand.color, fontFamily: 'Nunito, sans-serif' }}>{brand.name}</span>
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
   2. SEASON BANNER (FESTIVAL)
═══════════════════════════════════════ */
function SeasonBanner({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['festival'] || {};
  const secTitle = s.title       || '';
  const secDesc  = s.description || '';

  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);

  useEffect(() => {
    if (!banners?.length || banners.length <= 1 || paused) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners?.length, paused]);

  if (!banners?.length) return null;

  return (
    <section style={{ background: '#eef1f5', padding: '16px' }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>

        {/* Section heading from admin */}
        {(secTitle || secDesc) && (
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            {secTitle && <h2 style={{ fontSize: 'clamp(1rem,2vw,1.4rem)', fontWeight: '900', color: '#2D1A4A', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>{secTitle}</h2>}
            {secDesc  && <p  style={{ fontSize: '0.84rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>{secDesc}</p>}
          </div>
        )}

        <div style={{ borderRadius: '14px', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', background: '#fff', height: 'clamp(250px, 24vw, 470px)' }}>
          {banners.map((b, i) => (
            <div key={b.id || i} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 0.4s ease', zIndex: i === current ? 2 : 1 }}>
              {b.image?.url ? (
                <img src={b.image.url} alt={b.title || 'Festival'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${b.bgColor || '#0EA5E9'}, #7B2FBE)` }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)', zIndex: 3 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 'clamp(240px, 55%, 480px)', padding: 'clamp(14px, 2.5vw, 28px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 4 }}>
                {b.festivalName && (
                  <span style={{ display: 'inline-block', width: 'fit-content', padding: '4px 12px', background: 'rgba(255,255,255,0.97)', color: '#7B2FBE', borderRadius: '999px', fontSize: 'clamp(0.6rem, 1vw, 0.72rem)', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Nunito, sans-serif', boxShadow: '0 3px 10px rgba(0,0,0,0.2)' }}>
                    {b.emoji || '🎪'} {b.festivalName}
                  </span>
                )}
                {b.title && (
                  <h2 style={{ fontSize: 'clamp(1.1rem, 2.4vw, 1.8rem)', fontWeight: '900', color: 'white', margin: '0 0 6px', lineHeight: 1.15, fontFamily: 'Nunito, sans-serif', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                    {b.title}
                  </h2>
                )}
                {b.subtitle && (
                  <p style={{ fontSize: 'clamp(0.75rem, 1.3vw, 0.9rem)', color: 'rgba(255,255,255,0.94)', margin: '0 0 12px', fontWeight: '500', lineHeight: 1.4, fontFamily: 'Nunito, sans-serif', textShadow: '0 1px 6px rgba(0,0,0,0.5)', maxWidth: '380px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {b.subtitle}
                  </p>
                )}
                {b.buttonText && (
                  <Link href={b.buttonLink || '/products'} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content', padding: 'clamp(7px, 1.2vw, 10px) clamp(16px, 2.5vw, 24px)', background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: 'clamp(0.75rem, 1.2vw, 0.86rem)', fontFamily: 'Nunito, sans-serif', boxShadow: '0 6px 18px rgba(255,107,53,0.4)', transition: 'transform 0.2s ease' }}>
                    {b.buttonText} →
                  </Link>
                )}
              </div>
            </div>
          ))}

          {banners.length > 1 && (
            <>
              <button onClick={() => setCurrent(p => (p - 1 + banners.length) % banners.length)} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#2D1A4A', boxShadow: '0 3px 10px rgba(0,0,0,0.2)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>‹</button>
              <button onClick={() => setCurrent(p => (p + 1) % banners.length)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#2D1A4A', boxShadow: '0 3px 10px rgba(0,0,0,0.2)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>›</button>
            </>
          )}
          {banners.length > 1 && !paused && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(0,0,0,0.2)', zIndex: 5 }}>
              <div key={current} style={{ height: '100%', background: 'linear-gradient(90deg, #FF6B35, #7B2FBE)', animation: 'festivalProgress 5s linear forwards' }} />
            </div>
          )}
          {banners.length > 1 && (
            <div style={{ position: 'absolute', bottom: '12px', right: '18px', display: 'flex', gap: '5px', zIndex: 5 }}>
              {banners.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '20px' : '7px', height: '7px', borderRadius: '999px', border: 'none', background: i === current ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes festivalProgress { from { width: 0%; } to { width: 100%; } }`}</style>
    </section>
  );
}

/* ═══════════════════════════════════════
   3. BUDGET
═══════════════════════════════════════ */
function BudgetSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['budget'] || {};
  const secTitle = s.title       || 'Budget Store';
  const secEmoji = s.emoji       || '';
  const secDesc  = s.description || '';

  const displayBudget = banners?.length > 0
    ? banners.map((b, i) => ({
        price: b.price || DEFAULT_BUDGET[i]?.price || 499,
        offer: b.offer || 'UNDER',
        link:  b.buttonLink || `/products?maxPrice=${b.price || 499}`,
      }))
    : DEFAULT_BUDGET.map(b => ({ ...b, offer: 'UNDER' }));

  return (
    <section style={{ padding: 'clamp(36px,5vw,60px) clamp(12px,3vw,40px) clamp(48px,6vw,80px)', background: 'linear-gradient(180deg, #f0e0cc 0%, #e0d0be 20%, #c8dce8 50%, #b0d4e8 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ display: 'inline-block', background: '#fff', padding: 'clamp(10px,2vw,14px) clamp(28px,4vw,48px)', borderRadius: '4px', boxShadow: '0 3px 14px rgba(0,0,0,0.10)', marginBottom: secDesc ? '8px' : 'clamp(28px,4vw,44px)', position: 'relative', zIndex: 2, maxWidth: '90%' }}>
        <h2 style={{ fontSize: 'clamp(1rem,2.5vw,1.9rem)', fontWeight: '900', color: '#1a1a2e', margin: 0, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 'clamp(1.5px,0.3vw,3px)', whiteSpace: 'nowrap' }}>
          {secEmoji} {secTitle}
        </h2>
        <div style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', borderRight: '12px solid #fff' }} />
        <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '16px solid transparent', borderBottom: '16px solid transparent', borderLeft: '12px solid #fff' }} />
      </div>

      {secDesc && (
        <p style={{ fontSize: '0.84rem', color: '#666', margin: '0 auto clamp(20px,3vw,36px)', fontWeight: '500', fontFamily: 'Nunito, sans-serif', maxWidth: '500px', position: 'relative', zIndex: 2 }}>
          {secDesc}
        </p>
      )}

      <div className="budgetGrid" style={{ display: 'grid', gridTemplateColumns: `repeat(${displayBudget.length}, minmax(0, 1fr))`, gap: 'clamp(8px,2vw,40px)', maxWidth: '1100px', margin: '0 auto', alignItems: 'center', justifyItems: 'center', position: 'relative', zIndex: 2 }}>
        {displayBudget.map((item, i) => (
          <Link key={i} href={item.link} style={{ textDecoration: 'none', textAlign: 'center', width: '100%', minWidth: 0 }}>
            <div
              style={{ cursor: 'pointer', transition: 'transform 0.3s ease', padding: 'clamp(6px,1.5vw,12px) clamp(4px,1.5vw,24px)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <p style={{ fontSize: 'clamp(0.62rem,1.2vw,1rem)', fontWeight: '900', color: '#1a1a8e', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 'clamp(2px,0.5vw,4px)' }}>
                {item.offer}
              </p>
              <p style={{ fontSize: 'clamp(1.5rem,6vw,4.5rem)', fontWeight: '900', color: '#1a1a8e', margin: 0, lineHeight: 1.1, fontFamily: 'Nunito, sans-serif', letterSpacing: '-1px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                {item.price}
                <span style={{ fontSize: '0.30em', marginBottom: 'clamp(4px,1vw,14px)', color: '#FF6B35', fontWeight: '900', animation: 'budgetArrow 1.2s ease-in-out infinite' }}>›</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
      <style>{`@keyframes budgetArrow { 0%, 100% { opacity: 1; transform: translateX(0); } 50% { opacity: 0.3; transform: translateX(4px); } }`}</style>
    </section>
  );
}

/* ═══════════════════════════════════════
   4. SUNNY — Flip
═══════════════════════════════════════ */
function SunnySection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['sunny'] || {};
  const secTitle = s.title       || 'Sunny Play Days';
  const secEmoji = s.emoji       || '☀️';
  const secDesc  = s.description || '';
  const secBtn   = s.buttonText  || 'View All';

  if (!banners?.length) return null;

  return (
    <section style={{ padding: 'clamp(36px,5vw,60px) clamp(12px,2vw,20px)', background: 'linear-gradient(135deg, #FFF9EC 0%, #FFFBF5 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'linear-gradient(135deg, #FFF9EC, #FFF3EC)', border: '1.5px solid #FFD4B8', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'Nunito, sans-serif' }}>
              {secEmoji} Collections
            </span>
            <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>
              {secEmoji} {secTitle}
            </h2>
            {secDesc && (
              <p style={{ fontSize: '0.84rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
                {secDesc}
              </p>
            )}
          </div>
          <Link href="/products?category=clothing" style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
            {secBtn} →
          </Link>
        </div>

        <div className="sunnyGrid">
          {banners.map((banner, i) => {
            const frontImg = banner.image?.url || null;
            const backImg  = banner.mobileImage?.url || frontImg;
            return (
              <FlipCard key={banner.id || i} sceneClassName="sunnyFlipScene" href="/products?category=clothing">
                <div className="flipFace flipFront sunnyDashedBorder">
                  <div className="sunnyImgWrap">
                    {frontImg ? (
                      <img src={frontImg} alt={banner.title || 'Collection'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #c5e9f8, #8fd2f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4.5rem' }}>{banner.emoji || '👕'}</div>
                    )}
                    <div className="sunnyTitleStrip"><span>{banner.title}</span></div>
                  </div>
                </div>
                <div className="flipFace flipBack sunnyDashedBorder">
                  <div className="sunnyImgWrap">
                    {backImg ? (
                      <img src={backImg} alt={banner.title || 'Back'} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #FFE8B0, #FFD78A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4.5rem' }}>☀️</div>
                    )}
                    <div className="sunnyTitleStrip"><span>{banner.title}</span></div>
                  </div>
                </div>
              </FlipCard>
            );
          })}
        </div>

        <style>{`
          .sunnyGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
          .sunnyFlipScene { height: 280px; }
          .sunnyDashedBorder { border: 3px solid #E03F4F; background: white; box-sizing: border-box; border-radius: 24px; box-shadow: 0 6px 18px rgba(224,63,79,0.18); transition: box-shadow 0.3s ease; }
          .flipScene.isFlipped .sunnyDashedBorder, .flipScene:hover .sunnyDashedBorder { border-color: #C92A3A; box-shadow: 0 14px 36px rgba(224,63,79,0.35); }
          .sunnyImgWrap { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 16px; }
          .sunnyTitleStrip { position: absolute; left: 0; bottom: 0; right: 0; background: #1a1a2e; padding: 10px 12px; text-align: center; }
          .sunnyTitleStrip span { font-size: 11px; font-weight: 900; color: white; letter-spacing: 0.8px; text-transform: uppercase; font-family: 'Nunito', sans-serif; }
          @media (max-width: 1024px) { .sunnyGrid { grid-template-columns: repeat(3, 1fr); gap: 14px; } .sunnyFlipScene { height: 260px; } }
          @media (max-width: 700px)  { .sunnyGrid { grid-template-columns: repeat(2, 1fr); gap: 12px; } .sunnyFlipScene { height: 240px; } }
          @media (max-width: 380px)  { .sunnyGrid { grid-template-columns: 1fr; } .sunnyFlipScene { height: 260px; } }
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   5. CATEGORY (PROMO)
═══════════════════════════════════════ */
function PromoSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['promo'] || sectionSettings['category'] || {};
  const secTitle = s.title       || 'Shop By Category';
  const secEmoji = s.emoji       || '🛍️';
  const secDesc  = s.description || '';

  const DEFAULT_CATEGORIES = [
    { id: 'd1', title: 'Clothing',        image: { url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&h=600&fit=crop&auto=format' }, buttonLink: '/products?category=clothing',           color: '#FF6B35' },
    { id: 'd2', title: 'Toys & Games',    image: { url: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500&h=600&fit=crop&auto=format' },  buttonLink: '/products?category=toys',               color: '#EF4444' },
    { id: 'd3', title: 'Baby Food',       image: { url: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=500&h=600&fit=crop&auto=format' }, buttonLink: '/products?category=food',              color: '#10B981' },
    { id: 'd4', title: 'Personal Care',   image: { url: 'https://images.unsplash.com/photo-1599735362298-10f9a84d3e89?w=500&h=600&fit=crop&auto=format' }, buttonLink: '/products?category=personal-care',     color: '#7B2FBE' },
    { id: 'd5', title: 'Skin Care',       image: { url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=600&fit=crop&auto=format' },  buttonLink: '/products?category=health-care',       color: '#0EA5E9' },
    { id: 'd6', title: 'Electric Rides',  image: { url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=600&fit=crop&auto=format' }, buttonLink: '/products?category=electric-vehicles', color: '#F59E0B' },
    { id: 'd7', title: 'Cradles & Cribs', image: { url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=500&h=600&fit=crop&auto=format' },  buttonLink: '/products?category=cradles-cribs',     color: '#EC4899' },
  ];

  const categories = banners?.length > 0 ? banners : DEFAULT_CATEGORIES;
  const count = categories.length;
  const cols  = count >= 7 ? 7 : count;

  return (
    <section style={{ padding: 'clamp(36px,5vw,52px) clamp(12px,2vw,16px)', background: 'linear-gradient(180deg, #fff 0%, #f8f9fb 100%)' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: 'clamp(1.1rem,2.5vw,1.8rem)', fontWeight: '900', color: '#1a1a2e', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {secEmoji} {secTitle}
          </h2>
          {secDesc && (
            <p style={{ fontSize: '0.85rem', color: '#9585B0', margin: '0 0 10px', fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
              {secDesc}
            </p>
          )}
          <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, #FF6B35, #7B2FBE)', borderRadius: '999px', margin: '0 auto' }} />
        </div>

        <div className="promoGrid" style={{ '--cols': cols }}>
          {categories.map((cat, i) => {
            const imgUrl = cat.image?.url || null;
            const link   = cat.buttonLink || '/products';
            const color  = cat.color      || '#FF6B35';
            const name   = cat.title      || 'Category';
            return (
              <Link key={cat.id || i} href={link} style={{ textDecoration: 'none' }}>
                <div
                  className="promoCard"
                  style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: `2px solid ${color}30`, transition: 'all 0.3s ease', cursor: 'pointer', height: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = `0 14px 36px ${color}25`; e.currentTarget.style.borderColor = color; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = `${color}30`; }}
                >
                  <div className="promoImgWrap">
                    {imgUrl ? (
                      <img src={imgUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', transition: 'transform 0.4s ease' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: `${color}15`, color: color, fontWeight: '900' }}>{name.charAt(0)}</div>
                    )}
                  </div>
                  <div style={{ padding: '11px 6px', background: '#1a1a2e', textAlign: 'center' }}>
                    <p style={{ fontSize: 'clamp(0.62rem,1.1vw,0.78rem)', fontWeight: '800', color: '#fff', margin: 0, fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {name}<span style={{ fontSize: '0.85rem', flexShrink: 0 }}>›</span>
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <style>{`
          .promoGrid { display: grid; grid-template-columns: repeat(var(--cols, 7), 1fr); gap: 14px; }
          .promoImgWrap { width: 100%; height: 320px; overflow: hidden; background: #f8f8f8; }
          @media (max-width: 1200px) { .promoGrid { grid-template-columns: repeat(5, 1fr); gap: 12px; } .promoImgWrap { height: 240px; } }
          @media (max-width: 900px)  { .promoGrid { grid-template-columns: repeat(4, 1fr); gap: 10px; } .promoImgWrap { height: 220px; } }
          @media (max-width: 640px)  { .promoGrid { grid-template-columns: repeat(3, 1fr); gap: 10px; } .promoImgWrap { height: 200px; } }
          @media (max-width: 420px)  { .promoGrid { grid-template-columns: repeat(2, 1fr); gap: 10px; } .promoImgWrap { height: 210px; } }
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   6. GENDER
═══════════════════════════════════════ */
function GenderCard({ banner, isGirl }) {
  const [hovered, setHovered] = useState(false);
  const color      = isGirl ? '#EC4899' : '#0EA5E9';
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 22px', background: 'white', color: color, borderRadius: '999px', fontSize: '0.86rem', fontWeight: '800', fontFamily: 'Nunito, sans-serif', boxShadow: '0 4px 14px rgba(0,0,0,0.20)' }}>Shop Now →</span>
        </div>
      </div>
    </Link>
  );
}

function GenderSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['gender'] || {};
  const secTitle = s.title       || 'Shop by Style';
  const secEmoji = s.emoji       || '👗';
  const secDesc  = s.description || '';

  const girlBanner = banners?.find(b => b.gender === 'girl');
  const boyBanner  = banners?.find(b => b.gender === 'boy');

  return (
    <section style={{ padding: 'clamp(40px,6vw,60px) 20px', background: 'linear-gradient(160deg, #FDF2F8 0%, #E0F2FE 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ display: 'inline-block', padding: '5px 18px', background: 'linear-gradient(135deg, #FDF2F8, #E0F2FE)', border: '1.5px solid #FCE7F3', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', color: '#BE185D', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'Nunito, sans-serif' }}>
            {secEmoji} Shop By Style
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif' }}>
            {secEmoji} {secTitle}
          </h2>
          {secDesc && (
            <p style={{ fontSize: '0.88rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
              {secDesc}
            </p>
          )}
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
   7. BABY FOOD — Flip
═══════════════════════════════════════ */
function BabyFoodSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['baby-food'] || {};
  const secTitle = s.title       || 'Baby Food & Nutrition';
  const secEmoji = s.emoji       || '🍼';
  const secDesc  = s.description || '';
  const secBtn   = s.buttonText  || 'View All Baby Food';

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
          {secDesc && (
            <p style={{ fontSize: '0.88rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
              {secDesc}
            </p>
          )}
        </div>

        <div className="bfGrid">
          {banners.map((banner, i) => {
            const color    = banner.color || defaultFoodColors[i % defaultFoodColors.length];
            const frontImg = banner.image?.url || null;
            const backImg  = banner.mobileImage?.url || frontImg;
            const link     = banner.buttonLink || '/products?category=food';
            return (
              <FlipCard key={banner.id || i} sceneClassName="bfFlipScene" href={link}>
                <div className="flipFace flipFront bfCard" style={{ borderColor: `${color}40` }}>
                  <div className="bfImgWrap" style={{ background: frontImg ? '#f8f8f8' : `${color}12` }}>
                    {frontImg
                      ? <img src={frontImg} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', boxSizing: 'border-box' }} />
                      : <span style={{ fontSize: '4rem' }}>{banner.emoji || '🍼'}</span>}
                  </div>
                  <div className="bfInfo">
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>{banner.title}</h3>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color, fontFamily: 'Nunito, sans-serif' }}>Shop Now →</span>
                  </div>
                </div>
                <div className="flipFace flipBack bfCard" style={{ borderColor: color }}>
                  <div className="bfImgWrap" style={{ background: backImg ? '#f8f8f8' : `${color}25` }}>
                    {backImg
                      ? <img src={backImg} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', boxSizing: 'border-box' }} />
                      : <span style={{ fontSize: '4rem' }}>🍎</span>}
                  </div>
                  <div className="bfInfo" style={{ background: color, color: 'white' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', margin: '0 0 4px', color: 'white', fontFamily: 'Nunito, sans-serif' }}>{banner.title}</h3>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'white', fontFamily: 'Nunito, sans-serif' }}>View Details →</span>
                  </div>
                </div>
              </FlipCard>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link href="/products?category=food" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '11px 28px', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: '0.90rem', boxShadow: '0 6px 18px rgba(16,185,129,0.28)', fontFamily: 'Nunito, sans-serif' }}>
            {secBtn} 🍎
          </Link>
        </div>

        <style>{`
          .bfGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 18px; }
          .bfFlipScene { height: 280px; }
          .bfCard { background: white; border: 2px solid transparent; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.07); display: flex; flex-direction: column; }
          .bfImgWrap { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .bfInfo { padding: 12px 14px; background: white; }
          @media (max-width: 700px) { .bfGrid { grid-template-columns: repeat(2, 1fr); gap: 12px; } .bfFlipScene { height: 260px; } }
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   8. TOYS — Flip
═══════════════════════════════════════ */
function ToysSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['toys'] || {};
  const secTitle = s.title       || 'Toys & Games';
  const secEmoji = s.emoji       || '🧸';
  const secDesc  = s.description || '';
  const secBtn   = s.buttonText  || 'View All Toys';

  if (!banners?.length) return null;
  const sectionBg = getSectionBackgroundUrl(banners);

  return (
    <section style={{ position: 'relative', padding: 'clamp(36px,5vw,68px) clamp(12px,2vw,20px)', overflow: 'hidden' }}>
      {sectionBg
        ? <img src={sectionBg} alt="bg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18, filter: 'blur(1px)' }} />
        : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 50%, #FDF4FF 100%)' }} />
      }
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.58), rgba(255,255,255,0.82))' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(255,255,255,0.72)', border: '1.5px solid #FCA5A5', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'Nunito, sans-serif' }}>
              🎠 Play Time
            </span>
            <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>
              {secEmoji} {secTitle}
            </h2>
            {secDesc && (
              <p style={{ fontSize: '0.84rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
                {secDesc}
              </p>
            )}
          </div>
          <Link href="/products?category=toys" style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#EF4444,#7B2FBE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>
            {secBtn} →
          </Link>
        </div>

        <div className="toysGrid">
          {banners.map((banner, i) => {
            const frontImg = banner.image?.url || null;
            const backImg  = banner.mobileImage?.url || frontImg;
            const link     = banner.buttonLink || '/products?category=toys';
            const color    = banner.color || '#EF4444';
            return (
              <FlipCard key={banner.id || i} sceneClassName="toysFlipScene" href={link}>
                <div className="flipFace flipFront toysCard">
                  <div className="toysImgWrap" style={{ background: frontImg ? '#fffaf9' : 'linear-gradient(135deg, #FEF2F2, #FFF7ED)' }}>
                    {frontImg
                      ? <img src={frontImg} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px', boxSizing: 'border-box' }} />
                      : <span style={{ fontSize: '4rem' }}>{banner.emoji || '🧸'}</span>}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 10px', borderRadius: '999px', background: color, color: 'white', fontSize: '10px', fontWeight: '800', fontFamily: 'Nunito, sans-serif' }}>Play</div>
                  </div>
                  <div className="toysInfo">
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>{banner.title}</h3>
                    <span style={{ fontSize: '0.80rem', fontWeight: '800', color, fontFamily: 'Nunito, sans-serif' }}>Shop Now →</span>
                  </div>
                </div>
                <div className="flipFace flipBack toysCard" style={{ border: `2px solid ${color}` }}>
                  <div className="toysImgWrap" style={{ background: backImg ? '#fffaf9' : `${color}15` }}>
                    {backImg
                      ? <img src={backImg} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px', boxSizing: 'border-box' }} />
                      : <span style={{ fontSize: '4rem' }}>🎁</span>}
                  </div>
                  <div className="toysInfo" style={{ background: color }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'white', margin: '0 0 5px', fontFamily: 'Nunito, sans-serif' }}>{banner.title}</h3>
                    <span style={{ fontSize: '0.80rem', fontWeight: '800', color: 'white', fontFamily: 'Nunito, sans-serif' }}>View Details →</span>
                  </div>
                </div>
              </FlipCard>
            );
          })}
        </div>

        <style>{`
          .toysGrid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; }
          .toysFlipScene { height: 320px; }
          .toysCard { background: rgba(255,255,255,0.86); backdrop-filter: blur(12px); border: 2px solid #b8e6f0; border-radius: 22px; overflow: hidden; display: flex; flex-direction: column; }
          .toysImgWrap { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
          .toysInfo { padding: 12px 14px; background: white; }
          @media (max-width: 1024px) { .toysGrid { grid-template-columns: repeat(3, 1fr); gap: 14px; } .toysFlipScene { height: 270px; } }
          @media (max-width: 700px)  { .toysGrid { grid-template-columns: repeat(2, 1fr); gap: 12px; } .toysFlipScene { height: 260px; } }
          @media (max-width: 380px)  { .toysGrid { grid-template-columns: 1fr; } }
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   9. CARE — Pure Image Flip (No Text on Cards)
═══════════════════════════════════════ */
function CareSection({ personalCareBanners, healthCareBanners, sectionSettings = {} }) {
  // ===== Editable text from Section Settings =====
  const ws            = sectionSettings['wellness'] || {};
  const wellnessBadge = ws.badge       || '🌿 Baby Wellness';
  const wellnessTitle = ws.title       || 'Wellness & Care Products';
  const wellnessDesc  = ws.description || "Trusted products for your little one's health & happiness";

  const ps            = sectionSettings['personal-care'] || {};
  const personalSub   = ps.subtitle    || '🧴 Baby Care Essentials';
  const personalTitle = ps.title       || 'Personal Baby Care';
  const personalDesc  = ps.description || 'Safe and gentle baby care products';
  const personalBtn   = ps.buttonText  || 'View All';

  const hs          = sectionSettings['health-care'] || {};
  const healthSub   = hs.subtitle    || '💊 Stay Safe & Healthy';
  const healthTitle = hs.title       || 'Health & Safety';
  const healthDesc  = hs.description || 'Keep your baby safe and healthy';
  const healthBtn   = hs.buttonText  || 'View All';

  // ===== Extract images from banners (Front + Back) =====
  const getImageItems = (banners, fallbackLink) => {
    return (banners || []).map(b => ({
      front: b.image?.url || '',
      back:  b.mobileImage?.url || b.image?.url || '',
      link:  b.buttonLink || fallbackLink,
    })).filter(item => item.front);
  };

  const personalItems = getImageItems(personalCareBanners, '/products?category=personal-care');
  const healthItems   = getImageItems(healthCareBanners,   '/products?category=health-care');

  if (!personalItems.length && !healthItems.length) return null;

  // ===== Pure Image Flip Card (NO TEXT) =====
  const PureImageCard = ({ item, accentColor, fallbackEmoji = '🖼️' }) => (
    <FlipCard href={item.link} sceneClassName="careFlipScene">
      {/* FRONT */}
      <div className="flipFace flipFront" style={{ borderRadius: '20px', background: '#fff', border: `2px solid ${accentColor}30`, overflow: 'hidden' }}>
        {item.front ? (
          <img src={item.front} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', background: `${accentColor}10` }}>{fallbackEmoji}</div>
        )}
      </div>
      {/* BACK */}
      <div className="flipFace flipBack" style={{ borderRadius: '20px', background: '#fff', border: `2px solid ${accentColor}`, overflow: 'hidden' }}>
        {item.back ? (
          <img src={item.back} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', background: `${accentColor}20` }}>{fallbackEmoji}</div>
        )}
      </div>
    </FlipCard>
  );

  // ===== Section Header (editable text) =====
  const SectionHeader = ({ title, subtitle, description, accentColor, linkAll, btnText }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
        <div style={{ width: '5px', height: '38px', borderRadius: '999px', background: accentColor, boxShadow: `0 0 12px ${accentColor}80`, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.68rem', fontWeight: '800', color: accentColor, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '1.2px', fontFamily: 'Nunito, sans-serif' }}>{subtitle}</p>
          <h3 style={{ fontSize: 'clamp(1.15rem, 2.2vw, 1.5rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 2px', fontFamily: 'Nunito, sans-serif' }}>{title}</h3>
          {description && <p style={{ fontSize: '0.80rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>{description}</p>}
        </div>
      </div>
      <Link href={linkAll} style={{ padding: '8px 20px', background: `linear-gradient(135deg, ${accentColor}, ${accentColor}DD)`, color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '800', fontFamily: 'Nunito, sans-serif', boxShadow: `0 6px 16px ${accentColor}45`, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {btnText} →
      </Link>
    </div>
  );

  // ===== Bento Grid — 4 image cards (Personal Care) =====
  const BentoGrid = ({ items, accentColor }) => {
    const filled = [...items];
    while (filled.length < 4) filled.push(items[0] || { front: '', back: '', link: '/products' });
    const display = filled.slice(0, 4);
    return (
      <div className="bentoGrid">
        <div className="bentoBig"><PureImageCard item={display[0]} accentColor={accentColor} fallbackEmoji="🧴" /></div>
        <div className="bentoTop1"><PureImageCard item={display[1]} accentColor={accentColor} fallbackEmoji="🧴" /></div>
        <div className="bentoTop2"><PureImageCard item={display[2]} accentColor={accentColor} fallbackEmoji="🧴" /></div>
        <div className="bentoWide"><PureImageCard item={display[3]} accentColor={accentColor} fallbackEmoji="🧴" /></div>
      </div>
    );
  };

  // ===== Mosaic Grid — 5 image cards (Health Care) =====
  const MosaicGrid = ({ items, accentColor }) => {
    const filled = [...items];
    while (filled.length < 5) filled.push(items[0] || { front: '', back: '', link: '/products' });
    const display = filled.slice(0, 5);
    return (
      <div className="mosaicGrid">
        <div className="mosaicTL"><PureImageCard item={display[0]} accentColor={accentColor} fallbackEmoji="💊" /></div>
        <div className="mosaicTR"><PureImageCard item={display[1]} accentColor={accentColor} fallbackEmoji="💊" /></div>
        <div className="mosaicBL"><PureImageCard item={display[2]} accentColor={accentColor} fallbackEmoji="💊" /></div>
        <div className="mosaicBC"><PureImageCard item={display[3]} accentColor={accentColor} fallbackEmoji="💊" /></div>
        <div className="mosaicBR"><PureImageCard item={display[4]} accentColor={accentColor} fallbackEmoji="💊" /></div>
      </div>
    );
  };

  return (
    <section style={{ padding: 'clamp(42px,6vw,68px) 20px', background: 'linear-gradient(135deg, #FAFAFA 0%, #F8F4FF 50%, #F0FDF4 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Main Heading (editable from settings) */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ display: 'inline-block', padding: '6px 20px', background: 'linear-gradient(135deg, #F3E8FF, #ECFDF5)', border: '1.5px solid #DFC5F8', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', fontFamily: 'Nunito, sans-serif' }}>
            {wellnessBadge}
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif' }}>
            {wellnessTitle}
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
            {wellnessDesc}
          </p>
        </div>

        {/* Personal Care */}
        {personalItems.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <SectionHeader
              title={personalTitle}
              subtitle={personalSub}
              description={personalDesc}
              accentColor="#7B2FBE"
              linkAll="/products?category=personal-care"
              btnText={personalBtn}
            />
            <BentoGrid items={personalItems} accentColor="#7B2FBE" />
          </div>
        )}

        {/* Divider */}
        {personalItems.length > 0 && healthItems.length > 0 && (
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #C8E6D0, transparent)', margin: '0 0 48px' }} />
        )}

        {/* Health Care */}
        {healthItems.length > 0 && (
          <div>
            <SectionHeader
              title={healthTitle}
              subtitle={healthSub}
              description={healthDesc}
              accentColor="#10B981"
              linkAll="/products?category=health-care"
              btnText={healthBtn}
            />
            <MosaicGrid items={healthItems} accentColor="#10B981" />
          </div>
        )}
      </div>

      <style>{`
        .careFlipScene { height: 100%; }
        .bentoGrid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; grid-template-rows: 185px 185px; gap: 12px; height: 382px; }
        .bentoBig  { grid-column: 1; grid-row: 1 / span 2; }
        .bentoTop1 { grid-column: 2; grid-row: 1; }
        .bentoTop2 { grid-column: 3; grid-row: 1; }
        .bentoWide { grid-column: 2 / span 2; grid-row: 2; }

        .mosaicGrid { display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 12px; height: 380px; }
        .mosaicTL { grid-column: 1; grid-row: 1; }
        .mosaicTR { grid-column: 2 / span 2; grid-row: 1; }
        .mosaicBL { grid-column: 1; grid-row: 2; }
        .mosaicBC { grid-column: 2; grid-row: 2; }
        .mosaicBR { grid-column: 3; grid-row: 2; }

        @media (max-width: 900px) {
          .bentoGrid { grid-template-columns: 1fr 1fr; grid-template-rows: 200px 160px 160px; height: auto; }
          .bentoBig  { grid-column: 1 / span 2; grid-row: 1; }
          .bentoTop1 { grid-column: 1; grid-row: 2; }
          .bentoTop2 { grid-column: 2; grid-row: 2; }
          .bentoWide { grid-column: 1 / span 2; grid-row: 3; }
          .mosaicGrid { grid-template-columns: 1fr 1fr; grid-template-rows: 170px 170px 170px; height: auto; }
          .mosaicTL { grid-column: 1; grid-row: 1; }
          .mosaicTR { grid-column: 2; grid-row: 1; }
          .mosaicBL { grid-column: 1 / span 2; grid-row: 2; }
          .mosaicBC { grid-column: 1; grid-row: 3; }
          .mosaicBR { grid-column: 2; grid-row: 3; }
        }
        @media (max-width: 560px) {
          .bentoGrid { grid-template-columns: 1fr; grid-template-rows: 200px 160px 160px 160px; }
          .bentoBig { grid-column: 1; grid-row: 1; }
          .bentoTop1 { grid-column: 1; grid-row: 2; }
          .bentoTop2 { grid-column: 1; grid-row: 3; }
          .bentoWide { grid-column: 1; grid-row: 4; }
          .mosaicGrid { grid-template-columns: 1fr; grid-template-rows: 170px 170px 170px 170px 170px; }
          .mosaicTL { grid-column: 1; grid-row: 1; }
          .mosaicTR { grid-column: 1; grid-row: 2; }
          .mosaicBL { grid-column: 1; grid-row: 3; }
          .mosaicBC { grid-column: 1; grid-row: 4; }
          .mosaicBR { grid-column: 1; grid-row: 5; }
        }
      `}</style>
    </section>
  );
}

/* ═══════════════════════════════════════
   10. ELECTRIC VEHICLES — Flip
═══════════════════════════════════════ */
function EVSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['electric'] || {};
  const secTitle = s.title       || 'Electric Vehicles for Kids';
  const secEmoji = s.emoji       || '🚗';
  const secDesc  = s.description || '';
  const secBtn   = s.buttonText  || 'View All Electric Vehicles';

  if (!banners?.length) return null;

  return (
    <section style={{ position: 'relative', padding: 'clamp(40px,6vw,60px) 20px', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #E8F4FD 0%, #F0E6FF 30%, #FFF0F5 60%, #E8FFF5 100%)', zIndex: 0 }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ display: 'inline-block', padding: '5px 18px', background: 'rgba(255,255,255,0.80)', border: '1.5px solid rgba(14,165,233,0.30)', borderRadius: '999px', fontSize: '0.72rem', fontWeight: '800', color: '#0c4a6e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontFamily: 'Nunito, sans-serif' }}>
            ⚡ Kids Electric Rides
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif' }}>
            {secEmoji} {secTitle}
          </h2>
          {secDesc && (
            <p style={{ fontSize: '0.88rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
              {secDesc}
            </p>
          )}
        </div>

        <div className="evGrid">
          {banners.slice(0, 4).map((item, i) => {
            const frontImg = item.image?.url || null;
            const backImg  = item.mobileImage?.url || frontImg;
            return (
              <FlipCard key={i} sceneClassName="evFlipScene" href={item.buttonLink || '/products?category=electric-vehicles'}>
                <div className="flipFace flipFront evRedBorder">
                  <div className="evImgWrap" style={{ background: frontImg ? '#f0f8ff' : 'linear-gradient(135deg, #E0F2FE, #F3E8FF)' }}>
                    {frontImg
                      ? <img src={frontImg} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px', boxSizing: 'border-box' }} />
                      : <span style={{ fontSize: '5rem' }}>{item.emoji || '🚗'}</span>}
                    {item.ageGroup && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', background: 'rgba(0,0,0,0.45)', color: 'white', borderRadius: '999px', fontSize: '10px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', backdropFilter: 'blur(4px)' }}>
                        👶 {item.ageGroup}
                      </div>
                    )}
                  </div>
                  <div className="evInfo">
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>{item.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0EA5E9', fontFamily: 'Nunito, sans-serif' }}>
                        {item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'View'}
                      </span>
                      <span style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #0EA5E9, #7B2FBE)', color: 'white', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '800', fontFamily: 'Nunito, sans-serif' }}>🛒 Shop</span>
                    </div>
                  </div>
                </div>
                <div className="flipFace flipBack evRedBorder">
                  <div className="evImgWrap" style={{ background: backImg ? '#f0f8ff' : 'linear-gradient(135deg, #F0E6FF, #FFE0F0)' }}>
                    {backImg
                      ? <img src={backImg} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px', boxSizing: 'border-box' }} />
                      : <span style={{ fontSize: '5rem' }}>⚡</span>}
                  </div>
                  <div className="evInfo" style={{ background: 'linear-gradient(135deg, #0EA5E9, #7B2FBE)' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'white', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>{item.title}</h3>
                    <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'white', fontFamily: 'Nunito, sans-serif' }}>Click to View →</span>
                  </div>
                </div>
              </FlipCard>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link href="/products?category=electric-vehicles" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 30px', background: 'linear-gradient(135deg, #0EA5E9, #7B2FBE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: '0.92rem', boxShadow: '0 6px 20px rgba(14,165,233,0.28)', fontFamily: 'Nunito, sans-serif' }}>
            {secBtn} ⚡
          </Link>
        </div>

        <style>{`
          .evGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
          .evFlipScene { height: 350px; }
          .evRedBorder { border: 3px solid #E03F4F; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); box-sizing: border-box; display: flex; flex-direction: column; border-radius: 24px; box-shadow: 0 6px 18px rgba(224,63,79,0.18); transition: box-shadow 0.3s ease; }
          .flipScene.isFlipped .evRedBorder, .flipScene:hover .evRedBorder { border-color: #C92A3A; box-shadow: 0 18px 44px rgba(224,63,79,0.35); }
          .evImgWrap { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; border-radius: 16px; }
          .evInfo { padding: 14px 16px; background: white; }
          @media (max-width: 700px) { .evGrid { grid-template-columns: repeat(2, 1fr); gap: 14px; } .evFlipScene { height: 300px; } }
          @media (max-width: 380px) { .evGrid { grid-template-columns: 1fr; } }
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   11. TRENDING + FEATURED
═══════════════════════════════════════ */
function TrendingFeaturedSection({ trending, featured, sectionSettings = {} }) {
  const s        = sectionSettings['trending'] || {};
  const secTitle = s.title       || 'Trending & Featured Mix';
  const secEmoji = s.emoji       || '🔥';
  const secDesc  = s.description || 'This week\'s hottest picks';

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
            <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>
              {secEmoji} {secTitle}
            </h2>
            {secDesc && (
              <p style={{ fontSize: '0.84rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>
                {secDesc}
              </p>
            )}
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
   12. CTA
═══════════════════════════════════════ */
function CTASection({ sectionSettings = {} }) {
  const s       = sectionSettings['cta'] || {};
  const secTitle = s.title       || 'Get 10% Off Your First Order!';
  const secDesc  = s.description || 'Sign up now and unlock exclusive deals, early access to sales, and personalised recommendations.';
  const secBtn   = s.buttonText  || 'Create Free Account';

  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 25%, #7B2FBE 65%, #9B4FDE 100%)', padding: 'clamp(48px,8vw,88px) 20px', position: 'relative' }}>
        {[{ top: '-80px', right: '-80px', size: '320px' }, { bottom: '-60px', left: '-60px', size: '280px' }].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: s.top, bottom: s.bottom, left: s.left, right: s.right, width: s.size, height: s.size, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
        ))}
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 18px', background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)', borderRadius: '999px', fontSize: '0.82rem', fontWeight: '800', color: 'white', marginBottom: '16px', fontFamily: 'Nunito, sans-serif' }}>
                🎁 Special Offer
              </span>
              <h2 style={{ fontSize: 'clamp(1.5rem,3.5vw,2.8rem)', fontWeight: '800', color: 'white', margin: '0 0 16px', lineHeight: 1.18, fontFamily: 'Nunito, sans-serif' }}>
                {secTitle}
              </h2>
              <p style={{ fontSize: 'clamp(0.88rem,1.5vw,1rem)', color: 'rgba(255,255,255,0.92)', margin: '0 0 28px', lineHeight: 1.75, fontWeight: '500', maxWidth: '480px', fontFamily: 'Nunito, sans-serif' }}>
                {secDesc}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: 'clamp(11px,2vw,14px) clamp(22px,3vw,32px)', background: 'white', color: '#FF6B35', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: 'clamp(0.88rem,1.5vw,0.96rem)', boxShadow: '0 10px 32px rgba(0,0,0,0.18)', fontFamily: 'Nunito, sans-serif' }}>
                  {secBtn} →
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
   MAIN HOME CLIENT
═══════════════════════════════════════ */
export default function HomeClient({
  heroBanners         = [],
  brands              = [],
  categoryBanners     = [],
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
  const isVisible = (key) => sectionSettings[key]?.isVisible !== false;

  const allSections = [
    { key: 'hero',          render: <HeroBanner banners={heroBanners} /> },
    { key: 'brands',        render: <BrandsSection brands={brands} sectionSettings={sectionSettings} /> },
    { key: 'promo',         render: <PromoSection banners={categoryBanners} sectionSettings={sectionSettings} /> },
    { key: 'budget',        render: <BudgetSection banners={budgetBanners} sectionSettings={sectionSettings} /> },
    { key: 'sunny',         render: <SunnySection banners={sunnyBanners} sectionSettings={sectionSettings} /> },
    { key: 'festival',      render: <SeasonBanner banners={festivalBanners} sectionSettings={sectionSettings} /> },
    { key: 'gender',        render: <GenderSection banners={genderBanners} sectionSettings={sectionSettings} /> },
    { key: 'baby-food',     render: <BabyFoodSection banners={babyFoodBanners} sectionSettings={sectionSettings} /> },
    { key: 'toys',          render: <ToysSection banners={toysBanners} sectionSettings={sectionSettings} /> },
    { key: 'care',          render: <CareSection personalCareBanners={personalCareBanners} healthCareBanners={healthCareBanners} sectionSettings={sectionSettings} /> },
    { key: 'electric',      render: <EVSection banners={evBanners} sectionSettings={sectionSettings} /> },
    { key: 'trending',      render: <TrendingFeaturedSection trending={trending} featured={featured} sectionSettings={sectionSettings} /> },
    { key: 'cta',           render: <CTASection sectionSettings={sectionSettings} /> },
  ];

  return (
    <>
      <style jsx global>{`
        .flipScene {
          perspective: 1200px;
          width: 100%;
          height: 100%;
          cursor: pointer;
          position: relative;
          -webkit-tap-highlight-color: transparent;
        }
        .flipCard {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.25s ease-out;
          transform-style: preserve-3d;
        }
        .flipFace {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 20px;
          overflow: hidden;
        }
        .flipFront { transform: rotateY(0deg); }
        .flipBack  { transform: rotateY(180deg); }
        .flipScene:hover .flipCard,
        .flipScene.isFlipped .flipCard {
          transform: rotateY(180deg);
        }
      `}</style>

      <div className={styles.home}>
        {allSections.map(section => (
          isVisible(section.key) && (
            <div key={section.key}>{section.render}</div>
          )
        ))}
      </div>
    </>
  );
}