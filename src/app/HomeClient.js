// C:\Users\user\arunasbabyworld\src\app\HomeClient.js

'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import HeroBanner from '@/components/home/HeroBanner';
import ProductCard from '@/components/products/ProductCard';
import useScrollReveal from '@/hooks/useScrollReveal';
import styles from './HomeClient.module.css';

/* ═══════════════════════════════════════
   HOOK
═══════════════════════════════════════ */
function useSectionSettings(initialSettings = {}) {
  const [settings, setSettings] = useState(initialSettings);
  useEffect(() => {
    fetch('/api/section-settings', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { if (data.settings) setSettings(data.settings); })
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
  { price: 499,  emoji: '🎀', color: '#FF6B35', offer: 'UNDER', link: '/products?maxPrice=499'  },
  { price: 899,  emoji: '🧸', color: '#7B2FBE', offer: 'UNDER', link: '/products?maxPrice=899'  },
  { price: 1299, emoji: '🍼', color: '#FF8C5A', offer: 'UNDER', link: '/products?maxPrice=1299' },
  { price: 1999, emoji: '🎁', color: '#9B4FDE', offer: 'UNDER', link: '/products?maxPrice=1999' },
];

function getSectionBackgroundUrl(items = []) {
  return (
    items.find(item => item?.mobileImage?.url)?.mobileImage?.url ||
    items.find(item => item?.image?.url)?.image?.url ||
    null
  );
}

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

function SectionWrapper({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.sectionWrapper} ${visible ? styles.sectionVisible : ''}`}>
      {children}
    </div>
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
   1. BRANDS
═══════════════════════════════════════ */
function BrandsSection({ brands, sectionSettings = {} }) {
  const s        = sectionSettings['brands'] || {};
  const secTitle = s.title       || 'Top Baby Brands';
  const secDesc  = s.description || '';

  const displayBrands = brands?.length > 0 ? brands : DEFAULT_BRANDS;
  const items = [...displayBrands, ...displayBrands, ...displayBrands];

  return (
    <section style={{ background: 'white', borderTop: '7px solid #F3E8FF', borderBottom: '1px solid #F3E8FF', overflow: 'hidden', padding: '0' }}>
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #FF6B35, #7B2FBE, #FF8C5A, #9B4FDE, #FF6B35)', backgroundSize: '300% 100%', animation: 'rainbowShift 4s linear infinite' }} />

      {(s.title || s.description) && (
        <div style={{ textAlign: 'center', padding: '10px 16px 0', fontFamily: 'Nunito, sans-serif' }}>
          {s.title && <p style={{ fontSize: '0.78rem', fontWeight: '800', color: '#7B2FBE', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '1px' }}>{secTitle}</p>}
          {secDesc  && <p style={{ fontSize: '0.72rem', color: '#9585B0', margin: 0, fontWeight: '500' }}>{secDesc}</p>}
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

  const [current, setCurrent]               = useState(0);
  const [paused,  setPaused]                = useState(false);
  const [muted,   setMuted]                 = useState(true);
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);
  const [mediaDims, setMediaDims]           = useState({});

  useEffect(() => {
    const hasVideo = banners?.some(b => isVideoUrl(b?.image?.url));
    if (!hasVideo) return;
    let attempted = false;
    const tryUnmute = () => {
      if (attempted) return;
      attempted = true;
      setMuted(false);
      setShowUnmutePrompt(false);
    };
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, tryUnmute, { once: true, passive: true }));
    const promptTimer = setTimeout(() => { if (muted) setShowUnmutePrompt(true); }, 2000);
    return () => {
      events.forEach(ev => window.removeEventListener(ev, tryUnmute));
      clearTimeout(promptTimer);
    };
  }, [banners]);

  useEffect(() => { if (!muted) setShowUnmutePrompt(false); }, [muted]);

  useEffect(() => {
    if (!banners?.length || banners.length <= 1 || paused) return;
    const isVideo = isVideoUrl(banners[current]?.image?.url);
    const delay   = isVideo ? 10000 : 5000;
    const t = setInterval(() => setCurrent(p => (p + 1) % banners.length), delay);
    return () => clearInterval(t);
  }, [banners, paused, current]);

  if (!banners?.length) return null;

  const activeRatio = mediaDims[current];
  const cardAspect  = activeRatio ? `${activeRatio}` : '16 / 9';

  return (
    <section
      className="kidFestivalSection"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="kidDeco kidCloud1">☁️</div>
      <div className="kidDeco kidCloud2">☁️</div>
      <div className="kidDeco kidStar1">⭐</div>
      <div className="kidDeco kidStar2">✨</div>
      <div className="kidDeco kidStar3">🌟</div>
      <div className="kidDeco kidBalloon1">🎈</div>
      <div className="kidDeco kidBalloon2">🎈</div>
      <div className="kidDeco kidHeart1">💕</div>
      <div className="kidDeco kidRainbow">🌈</div>
      <div className="kidDeco kidTeddy">🧸</div>

      <div className="kidFestivalInner">
        {(secTitle || secDesc) && (
          <div className="kidFestivalHeader">
            {secTitle && <h2>{secTitle}</h2>}
            {secDesc  && <p>{secDesc}</p>}
          </div>
        )}

        <div className="kidFestivalCard" style={{ aspectRatio: cardAspect }}>
          {banners.map((b, i) => {
            const mediaUrl = b.image?.url;
            const isVideo  = isVideoUrl(mediaUrl);
            const isActive = i === current;

            return (
              <div
                key={b.id || i}
                className="kidFestivalSlide"
                style={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 2 : 1, pointerEvents: isActive ? 'auto' : 'none' }}
              >
                <div className="kidMediaWrap">
                  {mediaUrl ? (
                    isVideo ? (
                      <video
                        key={`${b.id}-${isActive}`}
                        src={mediaUrl}
                        autoPlay loop muted={muted} playsInline
                        className="kidMedia"
                        onLoadedMetadata={e => {
                          const v = e.currentTarget;
                          if (v.videoWidth && v.videoHeight)
                            setMediaDims(prev => ({ ...prev, [i]: `${v.videoWidth} / ${v.videoHeight}` }));
                        }}
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt={b.title || 'Festival'}
                        className="kidMedia"
                        onLoad={e => {
                          const img = e.currentTarget;
                          if (img.naturalWidth && img.naturalHeight)
                            setMediaDims(prev => ({ ...prev, [i]: `${img.naturalWidth} / ${img.naturalHeight}` }));
                        }}
                      />
                    )
                  ) : (
                    <div className="kidNoMedia" style={{ background: `linear-gradient(135deg, ${b.bgColor || '#FFD4B8'}, #FFE8B0)` }}>
                      <span>{b.emoji || '🎁'}</span>
                    </div>
                  )}
                </div>

                {(b.festivalName || b.title || b.subtitle || b.buttonText) && (
                  <>
                    <div className="kidTextOverlay" />
                    <div className="kidTextContent">
                      {b.festivalName && <span className="kidFestivalBadge">{b.emoji || '🎪'} {b.festivalName}</span>}
                      {b.title    && <h2>{b.title}</h2>}
                      {b.subtitle && <p>{b.subtitle}</p>}
                      {b.buttonText && (
                        <Link href={b.buttonLink || '/products'} className="kidShopBtn">{b.buttonText} →</Link>
                      )}
                    </div>
                  </>
                )}

                {isVideo && isActive && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setMuted(m => !m); setShowUnmutePrompt(false); }}
                    className={`kidMuteBtn ${muted ? 'kidMutedPulse' : ''}`}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                  >
                    {muted ? '🔇' : '🔊'}
                  </button>
                )}

                {isVideo && isActive && showUnmutePrompt && muted && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setMuted(false); setShowUnmutePrompt(false); }}
                    className="kidUnmutePrompt"
                  >
                    🔊 Tap for sound
                  </button>
                )}
              </div>
            );
          })}

          {banners.length > 1 && (
            <>
              <button onClick={() => setCurrent(p => (p - 1 + banners.length) % banners.length)} className="kidNav kidNavLeft"  aria-label="Previous">‹</button>
              <button onClick={() => setCurrent(p => (p + 1) % banners.length)}                  className="kidNav kidNavRight" aria-label="Next">›</button>
            </>
          )}

          {banners.length > 1 && !paused && !isVideoUrl(banners[current]?.image?.url) && (
            <div className="kidProgressTrack">
              <div key={current} className="kidProgressFill" />
            </div>
          )}

          {banners.length > 1 && (
            <div className="kidDots">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} className={`kidDot ${i === current ? 'kidDotActive' : ''}`} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .kidFestivalSection { position:relative; padding:32px 0 36px; overflow:hidden; background: radial-gradient(ellipse at 15% 20%,#FFE5EC 0%,transparent 45%), radial-gradient(ellipse at 85% 30%,#E0F4FF 0%,transparent 50%), radial-gradient(ellipse at 50% 90%,#FFF4D6 0%,transparent 55%), linear-gradient(135deg,#FFF9F0 0%,#FFE8F0 25%,#E8F4FF 50%,#F0E8FF 75%,#FFF0E0 100%); }
        .kidDeco { position:absolute; font-size:2rem; opacity:0.55; pointer-events:none; user-select:none; z-index:1; filter:drop-shadow(0 4px 8px rgba(0,0,0,0.08)); }
        .kidCloud1   { top:4%;    left:2%;   font-size:2.8rem; animation:floatY 6s   ease-in-out infinite;        }
        .kidCloud2   { top:6%;    right:3%;  font-size:2.4rem; animation:floatY 7s   ease-in-out infinite 1s;    }
        .kidStar1    { top:12%;   left:8%;   font-size:1.6rem; animation:spin   8s   linear     infinite;         }
        .kidStar2    { bottom:10%;right:6%;  font-size:1.4rem; animation:spin   10s  linear     infinite reverse; }
        .kidStar3    { top:22%;   right:2%;  font-size:1.8rem; animation:pulse  3s   ease-in-out infinite;        }
        .kidBalloon1 { bottom:14%;left:3%;   font-size:2.5rem; animation:floatY 5s   ease-in-out infinite 0.5s;  }
        .kidBalloon2 { top:42%;   right:1%;  font-size:2rem;   animation:floatY 6.5s ease-in-out infinite 1.5s;  }
        .kidHeart1   { top:38%;   left:1%;   font-size:1.5rem; animation:pulse  2.5s ease-in-out infinite;        }
        .kidRainbow  { bottom:6%; left:12%;  font-size:2rem;   animation:floatY 8s   ease-in-out infinite; opacity:0.4; }
        .kidTeddy    { bottom:4%; right:14%; font-size:2.2rem; animation:wobble 4s   ease-in-out infinite; opacity:0.45; }
        @keyframes floatY  { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-15px)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.15);opacity:.85} }
        @keyframes wobble  { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        .kidFestivalInner  { width:100%; margin:0 auto; position:relative; z-index:2; padding:0; }
        .kidFestivalHeader { text-align:center; margin-bottom:16px; padding:0 16px; }
        .kidFestivalHeader h2 { font-size:clamp(1.2rem,2.4vw,1.8rem); font-weight:900; color:#2D1A4A; margin:0 0 4px; font-family:'Nunito',sans-serif; text-shadow:0 2px 6px rgba(255,255,255,0.6); }
        .kidFestivalHeader p  { font-size:0.92rem; color:#6B4E8A; margin:0; font-weight:600; font-family:'Nunito',sans-serif; }
        .kidFestivalCard { position:relative; width:100%; max-width:100vw; margin:0 auto; background:#000; overflow:hidden; max-height:90vh; border-top:4px solid rgba(255,107,53,0.25); border-bottom:4px solid rgba(123,47,190,0.25); box-shadow:0 10px 40px rgba(0,0,0,0.15); }
        .kidFestivalSlide { position:absolute; inset:0; transition:opacity 0.5s ease; }
        .kidMediaWrap { position:absolute; inset:0; width:100%; height:100%; overflow:hidden; display:flex; align-items:center; justify-content:center; background:#000; }
        .kidMedia { width:100%; height:100%; object-fit:contain; object-position:center; display:block; }
        .kidNoMedia { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:6rem; }
        .kidTextOverlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.35) 30%,rgba(0,0,0,0.05) 55%,transparent 100%); z-index:3; pointer-events:none; }
        .kidTextContent { position:absolute; left:0; right:0; bottom:0; width:100%; padding:clamp(16px,3vw,36px) clamp(16px,4vw,60px); display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; z-index:4; }
        .kidFestivalBadge { display:inline-block; width:fit-content; padding:6px 16px; background:white; color:#FF6B35; border-radius:999px; font-size:clamp(0.65rem,1vw,0.78rem); font-weight:900; margin-bottom:12px; text-transform:uppercase; letter-spacing:1.2px; font-family:'Nunito',sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.25); border:2px solid rgba(255,255,255,0.9); }
        .kidTextContent h2 { font-size:clamp(1.2rem,3vw,2.4rem); font-weight:900; color:white; margin:0 0 10px; line-height:1.15; font-family:'Nunito',sans-serif; text-shadow:0 2px 12px rgba(0,0,0,0.65),0 0 4px rgba(0,0,0,0.4); max-width:80%; }
        .kidTextContent p  { font-size:clamp(0.8rem,1.4vw,1.05rem); color:rgba(255,255,255,0.96); margin:0 0 14px; font-weight:600; line-height:1.45; font-family:'Nunito',sans-serif; text-shadow:0 1px 8px rgba(0,0,0,0.55); max-width:70%; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .kidShopBtn { display:inline-flex; align-items:center; gap:6px; width:fit-content; padding:clamp(10px,1.5vw,14px) clamp(22px,3vw,32px); background:linear-gradient(135deg,#FF6B35,#FF4081,#7B2FBE); color:white; border-radius:999px; text-decoration:none; font-weight:800; font-size:clamp(0.82rem,1.3vw,0.95rem); font-family:'Nunito',sans-serif; box-shadow:0 8px 22px rgba(255,107,53,0.50),0 0 0 3px rgba(255,255,255,0.4); transition:transform 0.25s ease,box-shadow 0.25s ease; border:2px solid rgba(255,255,255,0.85); }
        .kidShopBtn:hover { transform:translateY(-3px) scale(1.04); }
        .kidMuteBtn { position:absolute; top:16px; right:16px; width:44px; height:44px; border-radius:50%; background:rgba(255,255,255,0.95); color:#2D1A4A; border:2px solid rgba(255,107,53,0.4); cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; z-index:6; box-shadow:0 4px 12px rgba(0,0,0,0.20); transition:transform 0.2s ease; }
        .kidMuteBtn:hover { transform:scale(1.12); }
        .kidMutedPulse { animation:mutedPulse 1.8s ease-in-out infinite; background:linear-gradient(135deg,#FF6B35,#FF4081); color:white; border-color:white; }
        @keyframes mutedPulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,107,53,0.7)} 50%{box-shadow:0 0 0 14px rgba(255,107,53,0)} }
        .kidUnmutePrompt { position:absolute; top:70px; right:16px; padding:9px 16px; background:linear-gradient(135deg,#FF6B35,#FF4081); color:white; border:2px solid white; border-radius:999px; font-size:13px; font-weight:800; font-family:'Nunito',sans-serif; cursor:pointer; z-index:7; box-shadow:0 6px 20px rgba(255,107,53,0.50); animation:bouncePrompt 1s ease-in-out infinite; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
        @keyframes bouncePrompt { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .kidNav { position:absolute; top:50%; transform:translateY(-50%); width:46px; height:46px; border-radius:50%; background:rgba(255,255,255,0.95); border:2px solid rgba(255,107,53,0.4); font-size:1.6rem; cursor:pointer; color:#2D1A4A; box-shadow:0 4px 14px rgba(0,0,0,0.25); z-index:5; display:flex; align-items:center; justify-content:center; font-weight:900; transition:all 0.2s ease; line-height:1; }
        .kidNav:hover { background:linear-gradient(135deg,#FF6B35,#7B2FBE); color:white; transform:translateY(-50%) scale(1.12); border-color:white; }
        .kidNavLeft  { left:20px; }
        .kidNavRight { right:20px; }
        .kidProgressTrack { position:absolute; bottom:0; left:0; right:0; height:4px; background:rgba(255,255,255,0.3); z-index:5; }
        .kidProgressFill  { height:100%; background:linear-gradient(90deg,#FF6B35,#FF4081,#7B2FBE); animation:kidProgress 5s linear forwards; }
        @keyframes kidProgress { from{width:0%} to{width:100%} }
        .kidDots { position:absolute; bottom:18px; left:50%; transform:translateX(-50%); display:flex; gap:8px; z-index:5; }
        .kidDot  { width:10px; height:10px; border-radius:50%; border:2px solid rgba(255,255,255,0.7); background:rgba(255,255,255,0.4); cursor:pointer; padding:0; transition:all 0.3s ease; box-shadow:0 2px 6px rgba(0,0,0,0.30); }
        .kidDotActive { width:32px; border-radius:999px; background:white; border-color:white; }
        @media(max-width:1024px){.kidFestivalSection{padding:24px 0 28px}.kidFestivalCard{max-height:75vh}.kidNav{width:40px;height:40px;font-size:1.4rem}.kidNavLeft{left:12px}.kidNavRight{right:12px}}
        @media(max-width:768px){.kidFestivalSection{padding:18px 0 22px}.kidFestivalCard{max-height:70vh;border-top-width:3px;border-bottom-width:3px}.kidDeco{font-size:1.4rem;opacity:0.4}.kidCloud1,.kidCloud2{font-size:1.8rem}.kidBalloon1,.kidBalloon2{font-size:1.6rem}.kidTeddy{font-size:1.5rem}.kidRainbow{font-size:1.4rem}.kidNav{width:36px;height:36px;font-size:1.2rem}.kidNavLeft{left:8px}.kidNavRight{right:8px}.kidMuteBtn{width:38px;height:38px;font-size:14px;top:12px;right:12px}.kidUnmutePrompt{font-size:12px;padding:7px 12px;top:58px;right:12px}.kidTextContent{padding:16px 18px}.kidTextContent h2{max-width:100%}.kidTextContent p{max-width:100%}}
        @media(max-width:480px){.kidFestivalCard{max-height:65vh}.kidDeco{font-size:1.2rem}.kidShopBtn{padding:8px 18px;font-size:0.8rem}.kidDots{bottom:12px;gap:6px}.kidDot{width:8px;height:8px}.kidDotActive{width:24px}}
      `}</style>
    </section>
  );
}
/* ═══════════════════════════════════════
   6. GENDER (HER & HIM Style)
═══════════════════════════════════════ */
function GenderSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['gender'] || {};
  const secTitle = s.title       || 'Shop By Gender';
  const secEmoji = s.emoji       || '👶';
  const secDesc  = s.description || 'Adorable picks for boys & girls';

  if (!banners?.length) return null;

  // Split banners: even index = HER (girls), odd index = HIM (boys)
  // OR just take first two
  const items = banners.slice(0, 2);

  return (
    <section className="herHimSection">
      {/* Header */}
      <div className="herHimHeader">
        <span className="herHimBadge">💖 For Little Ones</span>
        <h2 className="herHimTitle">{secEmoji} {secTitle}</h2>
        {secDesc && <p className="herHimDesc">{secDesc}</p>}
      </div>

      {/* Main HER & HIM Card */}
      <div className="herHimWrapper">
        <div className="herHimCard">

          {/* Giant Background Text */}
          <div className="bgTextHer">HER</div>
          <div className="bgTextHim">HIM</div>

          {/* Wood plank floor effect */}
          <div className="woodFloor" />

          {/* Two banner images side by side */}
          <div className="herHimImages">
            {items.map((banner, i) => {
              const imgUrl = banner.image?.url || banner.mobileImage?.url;
              const isHer  = i === 0;
              return (
                <div key={banner.id || i} className={`herHimImgWrap ${isHer ? 'herSide' : 'himSide'}`}>
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={banner.title || (isHer ? 'Girls' : 'Boys')}
                      className="herHimImg"
                    />
                  ) : (
                    <div className="herHimFallback">
                      <span>{isHer ? '👧' : '👦'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="herHimButtons">
            {items.map((banner, i) => {
              const isHer = i === 0;
              const link  = banner.buttonLink || '/products';
              const label = isHer ? 'HER' : 'HIM';
              return (
                <Link key={i} href={link} className={`ctaPill ${isHer ? 'ctaHer' : 'ctaHim'}`}>
                  {label} ›
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .herHimSection {
          padding: clamp(36px, 5vw, 60px) clamp(12px, 2vw, 20px);
          background: linear-gradient(180deg, #FFF5F8 0%, #F0F8FF 100%);
          position: relative;
          overflow: hidden;
        }

        /* HEADER */
        .herHimHeader {
          text-align: center;
          margin-bottom: 32px;
          position: relative;
          z-index: 2;
        }
        .herHimBadge {
          display: inline-block;
          padding: 6px 20px;
          background: rgba(255, 255, 255, 0.95);
          border: 1.5px solid #FFB6D9;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          color: #E91E63;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 14px;
          font-family: 'Nunito', sans-serif;
          box-shadow: 0 4px 14px rgba(233, 30, 99, 0.12);
        }
        .herHimTitle {
          font-size: clamp(1.6rem, 3vw, 2.4rem);
          font-weight: 900;
          color: #2D1A4A;
          margin: 0 0 8px;
          font-family: 'Nunito', sans-serif;
        }
        .herHimDesc {
          font-size: 0.95rem;
          color: #9585B0;
          margin: 0;
          font-weight: 500;
          font-family: 'Nunito', sans-serif;
        }

        /* WRAPPER */
        .herHimWrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
        }

        /* MAIN CARD */
        .herHimCard {
          position: relative;
          background: linear-gradient(180deg, #BFE3F2 0%, #A8D4E8 40%, #C9B89C 70%, #B8A88C 100%);
          border-radius: 32px;
          overflow: hidden;
          min-height: clamp(380px, 50vw, 540px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          padding: clamp(20px, 3vw, 40px) clamp(20px, 3vw, 40px) clamp(80px, 10vw, 120px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        /* GIANT BACKGROUND TEXT */
        .bgTextHer,
        .bgTextHim {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          font-size: clamp(8rem, 22vw, 22rem);
          font-weight: 900;
          color: rgba(255, 255, 255, 0.55);
          font-family: 'Nunito', 'Arial Black', sans-serif;
          letter-spacing: -0.05em;
          line-height: 0.85;
          pointer-events: none;
          user-select: none;
          z-index: 1;
          text-shadow:
            0 4px 0 rgba(255, 255, 255, 0.25),
            0 8px 24px rgba(0, 0, 0, 0.08);
        }
        .bgTextHer {
          left: clamp(-20px, -2vw, -10px);
        }
        .bgTextHim {
          right: clamp(-20px, -2vw, -10px);
        }

        /* WOOD FLOOR EFFECT */
        .woodFloor {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 35%;
          background:
            repeating-linear-gradient(
              90deg,
              rgba(139, 105, 75, 0.18) 0px,
              rgba(139, 105, 75, 0.18) 2px,
              transparent 2px,
              transparent 60px
            ),
            linear-gradient(180deg, transparent 0%, rgba(139, 105, 75, 0.20) 100%);
          z-index: 1;
          pointer-events: none;
        }

        /* IMAGES CONTAINER */
        .herHimImages {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: clamp(20px, 4vw, 60px);
          width: 100%;
          max-width: 900px;
          height: 100%;
        }

        .herHimImgWrap {
          flex: 1;
          height: clamp(280px, 38vw, 460px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          position: relative;
        }
        .herHimImg {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom center;
          display: block;
          filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.25));
          transition: transform 0.4s ease;
        }
        .herHimImgWrap:hover .herHimImg {
          transform: translateY(-8px) scale(1.03);
        }
        .herHimFallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8rem;
        }

        /* CTA BUTTONS */
        .herHimButtons {
          position: absolute;
          bottom: clamp(24px, 4vw, 50px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: clamp(60px, 18vw, 220px);
          z-index: 5;
        }
        .ctaPill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: clamp(10px, 1.5vw, 14px) clamp(28px, 4vw, 44px);
          background: linear-gradient(135deg, #FFE85C 0%, #FFD93D 100%);
          color: #1a1a2e;
          font-family: 'Nunito', sans-serif;
          font-weight: 900;
          font-size: clamp(0.95rem, 1.8vw, 1.2rem);
          text-decoration: none;
          border-radius: 999px;
          letter-spacing: 1px;
          box-shadow:
            0 6px 0 #C9A52E,
            0 10px 20px rgba(0, 0, 0, 0.20);
          border: 3px solid #1a1a2e;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }
        .ctaPill:hover {
          transform: translateY(-3px);
          box-shadow:
            0 9px 0 #C9A52E,
            0 14px 26px rgba(0, 0, 0, 0.25);
        }
        .ctaPill:active {
          transform: translateY(2px);
          box-shadow:
            0 3px 0 #C9A52E,
            0 5px 12px rgba(0, 0, 0, 0.20);
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .herHimCard {
            min-height: 360px;
            padding: 20px 16px 90px;
            border-radius: 24px;
          }
          .bgTextHer,
          .bgTextHim {
            font-size: clamp(6rem, 26vw, 12rem);
            color: rgba(255, 255, 255, 0.45);
          }
          .herHimImages {
            gap: 12px;
          }
          .herHimImgWrap {
            height: clamp(220px, 45vw, 320px);
          }
          .herHimButtons {
            gap: clamp(40px, 22vw, 100px);
            bottom: 20px;
          }
          .ctaPill {
            padding: 9px 22px;
            font-size: 0.9rem;
            border-width: 2.5px;
            box-shadow:
              0 4px 0 #C9A52E,
              0 7px 14px rgba(0, 0, 0, 0.18);
          }
        }
        @media (max-width: 480px) {
          .herHimSection {
            padding: 28px 10px;
          }
          .herHimCard {
            min-height: 320px;
            padding: 16px 10px 80px;
            border-radius: 20px;
          }
          .bgTextHer,
          .bgTextHim {
            font-size: 7rem;
          }
          .herHimImgWrap {
            height: 220px;
          }
          .herHimButtons {
            gap: 50px;
          }
          .ctaPill {
            padding: 8px 18px;
            font-size: 0.85rem;
          }
        }
      `}</style>
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
    ? banners.map((b, i) => {
        let priceValue = b.price;
        if (!priceValue && b.title) {
          const parsed = parseFloat(b.title.toString().replace(/[^0-9.]/g, ''));
          if (!isNaN(parsed) && parsed > 0) priceValue = parsed;
        }
        if (!priceValue) priceValue = DEFAULT_BUDGET[i]?.price || 499;
        return { price: priceValue, offer: (b.offer || 'UNDER').toUpperCase(), link: b.buttonLink || `/products?maxPrice=${priceValue}` };
      })
    : DEFAULT_BUDGET;

  return (
    <section style={{ padding: 'clamp(36px,5vw,60px) clamp(12px,3vw,40px) clamp(48px,6vw,80px)', background: 'linear-gradient(180deg,#f0e0cc 0%,#e0d0be 20%,#c8dce8 50%,#b0d4e8 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${displayBudget.length}, minmax(0, 1fr))`, gap: 'clamp(8px,2vw,40px)', maxWidth: '1100px', margin: '0 auto', alignItems: 'center', justifyItems: 'center', position: 'relative', zIndex: 2 }}>
        {displayBudget.map((item, i) => (
          <Link key={i} href={item.link} style={{ textDecoration: 'none', textAlign: 'center', width: '100%', minWidth: 0 }}>
            <div
              style={{ cursor: 'pointer', transition: 'transform 0.3s ease', padding: 'clamp(6px,1.5vw,12px) clamp(4px,1.5vw,24px)' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <p style={{ fontSize: 'clamp(0.62rem,1.2vw,1rem)', fontWeight: '900', color: '#1a1a8e', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: 'clamp(2px,0.5vw,4px)' }}>{item.offer}</p>
              <p style={{ fontSize: 'clamp(1.5rem,6vw,4.5rem)', fontWeight: '900', color: '#1a1a8e', margin: 0, lineHeight: 1.1, fontFamily: 'Nunito, sans-serif', letterSpacing: '-1px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                {item.price}
                <span style={{ fontSize: '0.30em', marginBottom: 'clamp(4px,1vw,14px)', color: '#FF6B35', fontWeight: '900', animation: 'budgetArrow 1.2s ease-in-out infinite' }}>›</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
      <style>{`@keyframes budgetArrow { 0%,100%{opacity:1;transform:translateX(0)} 50%{opacity:0.3;transform:translateX(4px)} }`}</style>
    </section>
  );
}

/* ═══════════════════════════════════════
   4. SUNNY
═══════════════════════════════════════ */
function SunnySection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['sunny'] || {};
  const secTitle = s.title       || 'Sunny Play Days';
  const secEmoji = s.emoji       || '☀️';
  const secDesc  = s.description || '';
  const secBtn   = s.buttonText  || 'View All';

  if (!banners?.length) return null;

  return (
    <section style={{ padding: 'clamp(36px,5vw,60px) clamp(12px,2vw,20px)', background: 'linear-gradient(135deg,#FFF9EC 0%,#FFFBF5 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'linear-gradient(135deg,#FFF9EC,#FFF3EC)', border: '1.5px solid #FFD4B8', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', fontFamily: 'Nunito, sans-serif' }}>
              {secEmoji} Collections
            </span>
            <h2 style={{ fontSize: 'clamp(1.3rem,2.5vw,2rem)', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px', fontFamily: 'Nunito, sans-serif' }}>{secEmoji} {secTitle}</h2>
            {secDesc && <p style={{ fontSize: '0.84rem', color: '#9585B0', margin: 0, fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>{secDesc}</p>}
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
                    {frontImg
                      ? <img src={frontImg} alt={banner.title || 'Collection'} style={{ width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',display:'block' }} />
                      : <div style={{ width:'100%',height:'100%',background:'linear-gradient(160deg,#c5e9f8,#8fd2f2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'4.5rem' }}>{banner.emoji||'👕'}</div>}
                    <div className="sunnyTitleStrip"><span>{banner.title}</span></div>
                  </div>
                </div>
                <div className="flipFace flipBack sunnyDashedBorder">
                  <div className="sunnyImgWrap">
                    {backImg
                      ? <img src={backImg} alt={banner.title||'Back'} style={{ width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',display:'block' }} />
                      : <div style={{ width:'100%',height:'100%',background:'linear-gradient(160deg,#FFE8B0,#FFD78A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'4.5rem' }}>☀️</div>}
                    <div className="sunnyTitleStrip"><span>{banner.title}</span></div>
                  </div>
                </div>
              </FlipCard>
            );
          })}
        </div>

        <style>{`
          .sunnyGrid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
          .sunnyFlipScene { height:280px; }
          .sunnyDashedBorder { border:3px solid #E03F4F; background:white; box-sizing:border-box; border-radius:24px; box-shadow:0 6px 18px rgba(224,63,79,0.18); transition:box-shadow 0.3s ease; }
          .flipScene.isFlipped .sunnyDashedBorder,.flipScene:hover .sunnyDashedBorder{border-color:#C92A3A;box-shadow:0 14px 36px rgba(224,63,79,0.35)}
          .sunnyImgWrap { position:relative; width:100%; height:100%; overflow:hidden; border-radius:16px; }
          .sunnyTitleStrip { position:absolute; left:0; bottom:0; right:0; background:#1a1a2e; padding:10px 12px; text-align:center; }
          .sunnyTitleStrip span { font-size:11px; font-weight:900; color:white; letter-spacing:0.8px; text-transform:uppercase; font-family:'Nunito',sans-serif; }
          @media(max-width:1024px){.sunnyGrid{grid-template-columns:repeat(3,1fr);gap:14px}.sunnyFlipScene{height:260px}}
          @media(max-width:700px) {.sunnyGrid{grid-template-columns:repeat(2,1fr);gap:12px}.sunnyFlipScene{height:240px}}
          @media(max-width:380px) {.sunnyGrid{grid-template-columns:1fr}.sunnyFlipScene{height:260px}}
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   PROMO SECTION — Text Overlay Style (FIXED)
═══════════════════════════════════════ */
function PromoSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['promo'] || {};
  const secTitle = s.title       || 'Special Offers';
  const secEmoji = s.emoji       || '🏷️';
  const secDesc  = s.description || 'Exclusive deals just for you';

  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);

  useEffect(() => {
    if (!banners?.length || banners.length <= 1 || paused) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners, paused]);

  if (!banners?.length) return null;

  return (
    <SectionWrapper>
      <section className="promoSec">
        <div className="promoWrap">

          {/* Header */}
          <div className="promoHead">
            <span className="promoBadge">🎁 Hot Deals</span>
            <h2 className="promoTitle">{secEmoji} {secTitle}</h2>
            {secDesc && <p className="promoDesc">{secDesc}</p>}
          </div>

          {/* Carousel */}
          <div
            className="promoCarousel"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {banners.map((b, i) => {
              const mediaUrl  = b.image?.url    || '';
              const isVideo   = isVideoUrl(mediaUrl);
              const isActive  = i === current;
              const cardTitle = b.title         || '';
              const cardDesc  = b.description   || b.subtitle || '';
              const offerText = b.offer         || '';
              const btnText   = b.buttonText    || 'SHOP NOW';
              const link      = b.buttonLink    || '/products';
              const accent    = b.color         || '#FF6B9D';

              return (
                <div
                  key={b.id || i}
                  className={`promoSlide ${isActive ? 'promoSlideActive' : ''}`}
                >
                  <Link href={link} className="promoCard">

                    {/* Background Media */}
                    <div className="promoMediaWrap">
                      {mediaUrl ? (
                        isVideo ? (
                          <video
                            key={`${b.id}-${isActive}`}
                            src={mediaUrl}
                            autoPlay loop muted playsInline
                            className="promoMedia"
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={cardTitle}
                            className="promoMedia"
                            loading="lazy"
                          />
                        )
                      ) : (
                        <div className="promoNoMedia"><span>🎁</span></div>
                      )}

                      {/* Dark gradient overlay for text readability */}
                      <div className="promoOverlay" />
                    </div>

                    {/* CONTENT — Overlaid on right side */}
                    <div className="promoContent">

                      {/* Promo Badge */}
                      <span className="promoTagBadge" style={{ background: accent }}>
                        ✨ PROMO
                      </span>

                      {/* Title */}
                      {cardTitle && (
                        <h3 className="promoCardTitle">{cardTitle}</h3>
                      )}

                      {/* Description */}
                      {cardDesc && (
                        <p className="promoCardDesc">{cardDesc}</p>
                      )}

                      {/* Offer */}
                      {offerText && (
                        <div className="promoOfferRow">
                          <span className="promoOfferLabel">UPTO</span>
                          <span className="promoOfferNum">{offerText}</span>
                          {!/[%₹$]/.test(offerText) && <span className="promoOfferPct">% OFF</span>}
                        </div>
                      )}

                      {/* Button */}
                      <button type="button" className="promoBtn">
                        {btnText} <span className="promoBtnArrow">›</span>
                      </button>
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* Dots */}
            {banners.length > 1 && (
              <div className="promoDots">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`promoDot ${i === current ? 'promoDotActive' : ''}`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .promoSec {
            padding: clamp(36px, 5vw, 60px) clamp(12px, 2vw, 20px);
            background: linear-gradient(135deg, #FFF9F5 0%, #FFF0F8 50%, #F5F0FF 100%);
          }
          .promoWrap {
            max-width: 1300px;
            margin: 0 auto;
          }

          /* HEADER */
          .promoHead {
            text-align: center;
            margin-bottom: 28px;
          }
          .promoBadge {
            display: inline-block;
            padding: 5px 18px;
            background: linear-gradient(135deg, #FFF3EC, #FFE8F5);
            border: 1.5px solid #FFD4B8;
            border-radius: 999px;
            font-size: 0.72rem;
            font-weight: 800;
            color: #FF6B35;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            font-family: 'Nunito', sans-serif;
          }
          .promoTitle {
            font-size: clamp(1.4rem, 2.6vw, 2.2rem);
            font-weight: 900;
            color: #2D1A4A;
            margin: 0 0 6px;
            font-family: 'Nunito', sans-serif;
          }
          .promoDesc {
            font-size: 0.9rem;
            color: #9585B0;
            margin: 0;
            font-weight: 500;
            font-family: 'Nunito', sans-serif;
          }

          /* CAROUSEL */
          .promoCarousel {
            position: relative;
            width: 100%;
            aspect-ratio: 21 / 9;
            min-height: 360px;
            max-height: 560px;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 14px 44px rgba(0, 0, 0, 0.12);
            background: #000;
          }

          /* SLIDE */
          .promoSlide {
            position: absolute;
            inset: 0;
            opacity: 0;
            transition: opacity 0.7s ease;
            pointer-events: none;
            z-index: 1;
          }
          .promoSlideActive {
            opacity: 1;
            pointer-events: auto;
            z-index: 2;
          }

          /* CARD */
          .promoCard {
            position: relative;
            display: block;
            width: 100%;
            height: 100%;
            text-decoration: none;
            color: inherit;
          }

          /* MEDIA — Full background */
          .promoMediaWrap {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            overflow: hidden;
          }
          .promoMedia {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
            display: block;
          }
          .promoNoMedia {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 6rem;
            background: linear-gradient(135deg, #FFE8D6, #F5E6FF);
          }

          /* Dark gradient overlay — for text readability on RIGHT side */
          .promoOverlay {
            position: absolute;
            inset: 0;
            z-index: 2;
            background: linear-gradient(
              to left,
              rgba(0, 0, 0, 0.82) 0%,
              rgba(0, 0, 0, 0.65) 30%,
              rgba(0, 0, 0, 0.25) 55%,
              transparent 75%
            );
          }

          /* CONTENT — Overlaid on right side */
          .promoContent {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            width: 50%;
            z-index: 3;
            padding: clamp(24px, 4vw, 56px);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: clamp(10px, 1.8vw, 18px);
            color: #fff;
          }

          .promoTagBadge {
            display: inline-block;
            padding: 5px 14px;
            border-radius: 999px;
            font-size: 0.68rem;
            font-weight: 800;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-family: 'Nunito', sans-serif;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }

          .promoCardTitle {
            font-size: clamp(1.3rem, 2.6vw, 2.4rem);
            font-weight: 900;
            color: #fff;
            margin: 0;
            line-height: 1.15;
            font-family: 'Nunito', sans-serif;
            text-shadow:
              0 2px 12px rgba(0, 0, 0, 0.7),
              0 0 4px rgba(0, 0, 0, 0.5);
          }

          .promoCardDesc {
            font-size: clamp(0.85rem, 1.3vw, 1rem);
            font-weight: 500;
            color: rgba(255, 255, 255, 0.92);
            margin: 0;
            line-height: 1.55;
            font-family: 'Nunito', sans-serif;
            text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .promoOfferRow {
            display: flex;
            align-items: baseline;
            gap: 6px;
            margin-top: 4px;
          }
          .promoOfferLabel {
            font-size: clamp(0.75rem, 1.2vw, 0.95rem);
            font-weight: 800;
            color: #FFD93D;
            font-family: 'Nunito', sans-serif;
            letter-spacing: 1px;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          }
          .promoOfferNum {
            font-size: clamp(2rem, 4.5vw, 3.5rem);
            font-weight: 900;
            line-height: 1;
            color: #FFD93D;
            font-family: 'Nunito', sans-serif;
            letter-spacing: -1.5px;
            text-shadow:
              0 4px 16px rgba(0, 0, 0, 0.6),
              0 2px 4px rgba(0, 0, 0, 0.5);
          }
          .promoOfferPct {
            font-size: clamp(0.9rem, 1.6vw, 1.3rem);
            font-weight: 900;
            color: #FFD93D;
            font-family: 'Nunito', sans-serif;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          }

          .promoBtn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: clamp(10px, 1.5vw, 14px) clamp(24px, 3vw, 36px);
            background: linear-gradient(135deg, #FF6B35, #FF4081, #7B2FBE);
            color: #fff;
            border: 2px solid rgba(255, 255, 255, 0.85);
            border-radius: 999px;
            font-size: clamp(0.8rem, 1.3vw, 0.95rem);
            font-weight: 800;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            cursor: pointer;
            font-family: 'Nunito', sans-serif;
            box-shadow:
              0 8px 22px rgba(255, 107, 53, 0.5),
              0 0 0 3px rgba(255, 255, 255, 0.2);
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            margin-top: 6px;
          }
          .promoBtn:hover {
            transform: translateY(-3px) scale(1.04);
            box-shadow:
              0 12px 28px rgba(255, 107, 53, 0.6),
              0 0 0 4px rgba(255, 255, 255, 0.3);
          }
          .promoBtnArrow {
            font-size: 1.3em;
            line-height: 1;
            transition: transform 0.25s ease;
          }
          .promoBtn:hover .promoBtnArrow {
            transform: translateX(4px);
          }

          /* DOTS */
          .promoDots {
            position: absolute;
            bottom: 16px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            z-index: 5;
          }
          .promoDot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            border: 2px solid rgba(255, 255, 255, 0.7);
            cursor: pointer;
            padding: 0;
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          }
          .promoDotActive {
            width: 32px;
            border-radius: 999px;
            background: linear-gradient(90deg, #FF6B35, #7B2FBE);
            border-color: #fff;
          }

          /* RESPONSIVE */
          @media (max-width: 900px) {
            .promoCarousel {
              aspect-ratio: 4 / 5;
              min-height: 460px;
              max-height: none;
            }
            .promoOverlay {
              background: linear-gradient(
                to top,
                rgba(0, 0, 0, 0.88) 0%,
                rgba(0, 0, 0, 0.7) 25%,
                rgba(0, 0, 0, 0.35) 50%,
                transparent 75%
              );
            }
            .promoContent {
              top: auto;
              right: 0;
              bottom: 0;
              left: 0;
              width: 100%;
              padding: 24px 22px 46px;
              justify-content: flex-end;
              gap: 10px;
            }
          }
          @media (max-width: 560px) {
            .promoCarousel {
              aspect-ratio: 3 / 4;
              min-height: 420px;
              border-radius: 18px;
            }
            .promoContent {
              padding: 20px 18px 44px;
            }
            .promoCardTitle { font-size: 1.15rem; }
            .promoCardDesc  { font-size: 0.78rem; -webkit-line-clamp: 2; }
            .promoOfferNum  { font-size: 2rem; }
            .promoBtn       { padding: 9px 22px; font-size: 0.78rem; }
          }
        `}</style>
      </section>
    </SectionWrapper>
  );
}



/* ═══════════════════════════════════════
   5. CATEGORY
═══════════════════════════════════════ */
function CategorySection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['category'] || {};
  const secTitle = s.title       || 'Shop By Category';
  const secEmoji = s.emoji       || '🛍️';
  const secDesc  = s.description || '';

  const DEFAULT_CATEGORIES = [
    { id:'d1', title:'Clothing',        image:{ url:'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500&h=600&fit=crop&auto=format' }, buttonLink:'/products?category=clothing',           color:'#FF6B35' },
    { id:'d2', title:'Toys & Games',    image:{ url:'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=500&h=600&fit=crop&auto=format'  }, buttonLink:'/products?category=toys',               color:'#EF4444' },
    { id:'d3', title:'Baby Food',       image:{ url:'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=500&h=600&fit=crop&auto=format' }, buttonLink:'/products?category=food',              color:'#10B981' },
    { id:'d4', title:'Personal Care',   image:{ url:'https://images.unsplash.com/photo-1599735362298-10f9a84d3e89?w=500&h=600&fit=crop&auto=format' }, buttonLink:'/products?category=personal-care',     color:'#7B2FBE' },
    { id:'d5', title:'Skin Care',       image:{ url:'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=600&fit=crop&auto=format'  }, buttonLink:'/products?category=health-care',       color:'#0EA5E9' },
    { id:'d6', title:'Electric Rides',  image:{ url:'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=600&fit=crop&auto=format' }, buttonLink:'/products?category=electric-vehicles', color:'#F59E0B' },
    { id:'d7', title:'Cradles & Cribs', image:{ url:'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=500&h=600&fit=crop&auto=format'  }, buttonLink:'/products?category=cradles-cribs',     color:'#EC4899' },
  ];

  const categories = banners?.length > 0 ? banners : DEFAULT_CATEGORIES;
  const cols = Math.min(categories.length, 7);

  return (
    <section style={{ padding: 'clamp(36px,5vw,52px) clamp(12px,2vw,16px)', background: 'linear-gradient(180deg,#fff 0%,#f8f9fb 100%)' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: 'clamp(1.1rem,2.5vw,1.8rem)', fontWeight: '900', color: '#1a1a2e', margin: '0 0 8px', fontFamily: 'Nunito, sans-serif', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {secEmoji} {secTitle}
          </h2>
          {secDesc && <p style={{ fontSize: '0.85rem', color: '#9585B0', margin: '0 0 10px', fontWeight: '500', fontFamily: 'Nunito, sans-serif' }}>{secDesc}</p>}
          <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg,#FF6B35,#7B2FBE)', borderRadius: '999px', margin: '0 auto' }} />
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
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow=`0 14px 36px ${color}25`; e.currentTarget.style.borderColor=color; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor=`${color}30`; }}
                >
                  <div className="promoImgWrap">
                    {imgUrl
                      ? <img src={imgUrl} alt={name} style={{ width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block',transition:'transform 0.4s ease' }} />
                      : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'3rem',background:`${color}15`,color,fontWeight:'900' }}>{name.charAt(0)}</div>}
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
          .promoGrid { display:grid; grid-template-columns:repeat(var(--cols,7),1fr); gap:14px; }
          .promoImgWrap { width:100%; height:320px; overflow:hidden; background:#f8f8f8; }
          @media(max-width:1200px){.promoGrid{grid-template-columns:repeat(5,1fr);gap:12px}.promoImgWrap{height:240px}}
          @media(max-width:900px) {.promoGrid{grid-template-columns:repeat(4,1fr);gap:10px}.promoImgWrap{height:220px}}
          @media(max-width:640px) {.promoGrid{grid-template-columns:repeat(3,1fr);gap:10px}.promoImgWrap{height:200px}}
          @media(max-width:420px) {.promoGrid{grid-template-columns:repeat(2,1fr);gap:10px}.promoImgWrap{height:210px}}
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   7. BABY FOOD
═══════════════════════════════════════ */
function BabyFoodSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['baby-food'] || {};
  const secTitle = s.title       || 'Baby Food & Nutrition';
  const secEmoji = s.emoji       || '🍼';
  const secDesc  = s.description || '';
  const secBtn   = s.buttonText  || 'View All Baby Food';

  if (!banners?.length) return null;
  const foodColors = ['#FF6B35','#10B981','#EF4444','#0EA5E9','#F59E0B','#7B2FBE'];

  return (
    <section style={{ padding: 'clamp(40px,6vw,60px) 20px', background: 'linear-gradient(135deg,#FFFBF5 0%,#F0FDF4 50%,#F3E8FF 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ display:'inline-block', padding:'5px 18px', background:'linear-gradient(135deg,#FFFBF5,#F0FDF4)', border:'1.5px solid #BBF7D0', borderRadius:'999px', fontSize:'0.72rem', fontWeight:'800', color:'#166534', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px', fontFamily:'Nunito,sans-serif' }}>
            🍎 Nutrition First
          </span>
          <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.6rem)', fontWeight:'800', color:'#2D1A4A', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' }}>{secEmoji} {secTitle}</h2>
          {secDesc && <p style={{ fontSize:'0.88rem', color:'#9585B0', margin:0, fontWeight:'500', fontFamily:'Nunito,sans-serif' }}>{secDesc}</p>}
        </div>

        <div className="bfGrid">
          {banners.map((banner, i) => {
            const color    = banner.color || foodColors[i % foodColors.length];
            const frontImg = banner.image?.url || null;
            const backImg  = banner.mobileImage?.url || frontImg;
            const link     = banner.buttonLink || '/products?category=food';
            return (
              <FlipCard key={banner.id || i} sceneClassName="bfFlipScene" href={link}>
                <div className="flipFace flipFront bfCard" style={{ borderColor: `${color}40` }}>
                  <div className="bfImgWrap" style={{ background: frontImg ? '#f8f8f8' : `${color}12` }}>
                    {frontImg
                      ? <img src={frontImg} alt={banner.title} style={{ width:'100%',height:'100%',objectFit:'contain',padding:'8px',boxSizing:'border-box' }} />
                      : <span style={{ fontSize:'4rem' }}>{banner.emoji||'🍼'}</span>}
                  </div>
                  <div className="bfInfo">
                    <h3 style={{ fontSize:'0.92rem', fontWeight:'800', color:'#2D1A4A', margin:'0 0 4px', fontFamily:'Nunito,sans-serif' }}>{banner.title}</h3>
                    <span style={{ fontSize:'0.78rem', fontWeight:'800', color, fontFamily:'Nunito,sans-serif' }}>Shop Now →</span>
                  </div>
                </div>
                <div className="flipFace flipBack bfCard" style={{ borderColor: color }}>
                  <div className="bfImgWrap" style={{ background: backImg ? '#f8f8f8' : `${color}25` }}>
                    {backImg
                      ? <img src={backImg} alt={banner.title} style={{ width:'100%',height:'100%',objectFit:'contain',padding:'8px',boxSizing:'border-box' }} />
                      : <span style={{ fontSize:'4rem' }}>🍎</span>}
                  </div>
                  <div className="bfInfo" style={{ background: color }}>
                    <h3 style={{ fontSize:'0.92rem', fontWeight:'800', margin:'0 0 4px', color:'white', fontFamily:'Nunito,sans-serif' }}>{banner.title}</h3>
                    <span style={{ fontSize:'0.78rem', fontWeight:'800', color:'white', fontFamily:'Nunito,sans-serif' }}>View Details →</span>
                  </div>
                </div>
              </FlipCard>
            );
          })}
        </div>

        <div style={{ textAlign:'center', marginTop:'32px' }}>
          <Link href="/products?category=food" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'11px 28px', background:'linear-gradient(135deg,#10B981,#059669)', color:'white', borderRadius:'999px', textDecoration:'none', fontWeight:'800', fontSize:'0.90rem', boxShadow:'0 6px 18px rgba(16,185,129,0.28)', fontFamily:'Nunito,sans-serif' }}>
            {secBtn} 🍎
          </Link>
        </div>

        <style>{`
          .bfGrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:18px; }
          .bfFlipScene { height:280px; }
          .bfCard { background:white; border:2px solid transparent; border-radius:20px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.07); display:flex; flex-direction:column; }
          .bfImgWrap { flex:1; display:flex; align-items:center; justify-content:center; overflow:hidden; }
          .bfInfo { padding:12px 14px; background:white; }
          @media(max-width:700px){.bfGrid{grid-template-columns:repeat(2,1fr);gap:12px}.bfFlipScene{height:260px}}
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   8. TOYS
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
    <section style={{ position:'relative', padding:'clamp(36px,5vw,68px) clamp(12px,2vw,20px)', overflow:'hidden' }}>
      {sectionBg
        ? <img src={sectionBg} alt="bg" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.18, filter:'blur(1px)' }} />
        : <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#FEF2F2 0%,#FFF7ED 50%,#FDF4FF 100%)' }} />}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0.82))' }} />

      <div style={{ maxWidth:'1200px', margin:'0 auto', position:'relative', zIndex:2 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <span style={{ display:'inline-block', padding:'4px 14px', background:'rgba(255,255,255,0.72)', border:'1.5px solid #FCA5A5', borderRadius:'999px', fontSize:'0.70rem', fontWeight:'800', color:'#DC2626', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'8px', fontFamily:'Nunito,sans-serif' }}>
              🎠 Play Time
            </span>
            <h2 style={{ fontSize:'clamp(1.3rem,2.5vw,2rem)', fontWeight:'800', color:'#2D1A4A', margin:'0 0 4px', fontFamily:'Nunito,sans-serif' }}>{secEmoji} {secTitle}</h2>
            {secDesc && <p style={{ fontSize:'0.84rem', color:'#9585B0', margin:0, fontWeight:'500', fontFamily:'Nunito,sans-serif' }}>{secDesc}</p>}
          </div>
          <Link href="/products?category=toys" style={{ padding:'9px 20px', background:'linear-gradient(135deg,#EF4444,#7B2FBE)', color:'white', borderRadius:'999px', textDecoration:'none', fontSize:'0.82rem', fontWeight:'700', fontFamily:'Nunito,sans-serif' }}>
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
                  <div className="toysImgWrap" style={{ background: frontImg ? '#fffaf9' : 'linear-gradient(135deg,#FEF2F2,#FFF7ED)' }}>
                    {frontImg
                      ? <img src={frontImg} alt={banner.title} style={{ width:'100%',height:'100%',objectFit:'contain',padding:'12px',boxSizing:'border-box' }} />
                      : <span style={{ fontSize:'4rem' }}>{banner.emoji||'🧸'}</span>}
                    <div style={{ position:'absolute', top:'10px', left:'10px', padding:'4px 10px', borderRadius:'999px', background:color, color:'white', fontSize:'10px', fontWeight:'800', fontFamily:'Nunito,sans-serif' }}>Play</div>
                  </div>
                  <div className="toysInfo">
                    <h3 style={{ fontSize:'0.92rem', fontWeight:'800', color:'#2D1A4A', margin:'0 0 5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'Nunito,sans-serif' }}>{banner.title}</h3>
                    <span style={{ fontSize:'0.80rem', fontWeight:'800', color, fontFamily:'Nunito,sans-serif' }}>Shop Now →</span>
                  </div>
                </div>
                <div className="flipFace flipBack toysCard" style={{ border:`2px solid ${color}` }}>
                  <div className="toysImgWrap" style={{ background: backImg ? '#fffaf9' : `${color}15` }}>
                    {backImg
                      ? <img src={backImg} alt={banner.title} style={{ width:'100%',height:'100%',objectFit:'contain',padding:'12px',boxSizing:'border-box' }} />
                      : <span style={{ fontSize:'4rem' }}>🎁</span>}
                  </div>
                  <div className="toysInfo" style={{ background: color }}>
                    <h3 style={{ fontSize:'0.92rem', fontWeight:'800', color:'white', margin:'0 0 5px', fontFamily:'Nunito,sans-serif' }}>{banner.title}</h3>
                    <span style={{ fontSize:'0.80rem', fontWeight:'800', color:'white', fontFamily:'Nunito,sans-serif' }}>View Details →</span>
                  </div>
                </div>
              </FlipCard>
            );
          })}
        </div>

        <style>{`
          .toysGrid { display:grid; grid-template-columns:repeat(5,1fr); gap:18px; }
          .toysFlipScene { height:320px; }
          .toysCard { background:rgba(255,255,255,0.86); backdrop-filter:blur(12px); border:2px solid #b8e6f0; border-radius:22px; overflow:hidden; display:flex; flex-direction:column; }
          .toysImgWrap { flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
          .toysInfo { padding:12px 14px; background:white; }
          @media(max-width:1024px){.toysGrid{grid-template-columns:repeat(3,1fr);gap:14px}.toysFlipScene{height:270px}}
          @media(max-width:700px) {.toysGrid{grid-template-columns:repeat(2,1fr);gap:12px}.toysFlipScene{height:260px}}
          @media(max-width:380px) {.toysGrid{grid-template-columns:1fr}}
        `}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   9. CARE
═══════════════════════════════════════ */
function CareSection({ personalCareBanners, healthCareBanners, sectionSettings = {} }) {
  const ws            = sectionSettings['wellness']      || {};
  const wellnessBadge = ws.badge       || '🌿 Baby Wellness';
  const wellnessTitle = ws.title       || 'Wellness & Care Products';
  const wellnessDesc  = ws.description || "Trusted products for your little one's health & happiness";

  const ps          = sectionSettings['personal-care'] || {};
  const personalSub   = ps.subtitle    || '🧴 Baby Care Essentials';
  const personalTitle = ps.title       || 'Personal Baby Care';
  const personalDesc  = ps.description || 'Safe and gentle baby care products';
  const personalBtn   = ps.buttonText  || 'View All';

  const hs        = sectionSettings['health-care']   || {};
  const healthSub   = hs.subtitle    || '💊 Stay Safe & Healthy';
  const healthTitle = hs.title       || 'Health & Safety';
  const healthDesc  = hs.description || 'Keep your baby safe and healthy';
  const healthBtn   = hs.buttonText  || 'View All';

  const getImageItems = (arr, fallback) =>
    (arr || []).map(b => ({ front: b.image?.url||'', back: b.mobileImage?.url||b.image?.url||'', link: b.buttonLink||fallback })).filter(it => it.front);

  const personalItems = getImageItems(personalCareBanners, '/products?category=personal-care');
  const healthItems   = getImageItems(healthCareBanners,   '/products?category=health-care');

  if (!personalItems.length && !healthItems.length) return null;

  const PureImageCard = ({ item, accentColor, fallbackEmoji = '🖼️' }) => (
    <FlipCard href={item.link} sceneClassName="careFlipScene">
      <div className="flipFace flipFront" style={{ borderRadius:'20px', background:'#fff', border:`2px solid ${accentColor}30`, overflow:'hidden' }}>
        {item.front
          ? <img src={item.front} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block' }} />
          : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'3.5rem',background:`${accentColor}10` }}>{fallbackEmoji}</div>}
      </div>
      <div className="flipFace flipBack" style={{ borderRadius:'20px', background:'#fff', border:`2px solid ${accentColor}`, overflow:'hidden' }}>
        {item.back
          ? <img src={item.back} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',objectPosition:'center',display:'block' }} />
          : <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'3.5rem',background:`${accentColor}20` }}>{fallbackEmoji}</div>}
      </div>
    </FlipCard>
  );

  const SectionHeader = ({ title, subtitle, description, accentColor, linkAll, btnText }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'14px', minWidth:0, flex:1 }}>
        <div style={{ width:'5px', height:'38px', borderRadius:'999px', background:accentColor, boxShadow:`0 0 12px ${accentColor}80`, flexShrink:0 }} />
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:'0.68rem', fontWeight:'800', color:accentColor, margin:'0 0 2px', textTransform:'uppercase', letterSpacing:'1.2px', fontFamily:'Nunito,sans-serif' }}>{subtitle}</p>
          <h3 style={{ fontSize:'clamp(1.15rem,2.2vw,1.5rem)', fontWeight:'800', color:'#2D1A4A', margin:'0 0 2px', fontFamily:'Nunito,sans-serif' }}>{title}</h3>
          {description && <p style={{ fontSize:'0.80rem', color:'#9585B0', margin:0, fontWeight:'500', fontFamily:'Nunito,sans-serif' }}>{description}</p>}
        </div>
      </div>
      <Link href={linkAll} style={{ padding:'8px 20px', background:`linear-gradient(135deg,${accentColor},${accentColor}DD)`, color:'white', borderRadius:'999px', textDecoration:'none', fontSize:'0.78rem', fontWeight:'800', fontFamily:'Nunito,sans-serif', boxShadow:`0 6px 16px ${accentColor}45`, whiteSpace:'nowrap', flexShrink:0 }}>
        {btnText} →
      </Link>
    </div>
  );

  const BentoGrid = ({ items, accentColor }) => {
    const d = [...items];
    while (d.length < 4) d.push(d[0] || { front:'',back:'',link:'/products' });
    return (
      <div className="bentoGrid">
        <div className="bentoBig"><PureImageCard item={d[0]} accentColor={accentColor} fallbackEmoji="🧴" /></div>
        <div className="bentoTop1"><PureImageCard item={d[1]} accentColor={accentColor} fallbackEmoji="🧴" /></div>
        <div className="bentoTop2"><PureImageCard item={d[2]} accentColor={accentColor} fallbackEmoji="🧴" /></div>
        <div className="bentoWide"><PureImageCard item={d[3]} accentColor={accentColor} fallbackEmoji="🧴" /></div>
      </div>
    );
  };

  /* 🆕 FULL-WIDTH AUTO-SCROLLING HEALTH MARQUEE */
  const HealthMarquee = ({ items, accentColor }) => {
    const scrollItems = [...items, ...items, ...items];
    const duration = Math.max(25, items.length * 7);

    return (
      <div className="healthMarqueeFullWidth">
        <div className="healthFadeLeft" />
        <div className="healthFadeRight" />

        <div
          className="healthMarqueeTrack"
          style={{ animation: `healthScroll ${duration}s linear infinite` }}
          onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
          onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
          onTouchStart={e => (e.currentTarget.style.animationPlayState = 'paused')}
          onTouchEnd={e => (e.currentTarget.style.animationPlayState = 'running')}
        >
          {scrollItems.map((item, i) => (
            <div key={i} className="healthMarqueeItem">
              <PureImageCard item={item} accentColor={accentColor} fallbackEmoji="💊" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section style={{ padding:'clamp(42px,6vw,68px) 0', background:'linear-gradient(135deg,#FAFAFA 0%,#F8F4FF 50%,#F0FDF4 100%)', overflow:'hidden' }}>
      {/* Centered header & personal care */}
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 20px' }}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <span style={{ display:'inline-block', padding:'6px 20px', background:'linear-gradient(135deg,#F3E8FF,#ECFDF5)', border:'1.5px solid #DFC5F8', borderRadius:'999px', fontSize:'0.72rem', fontWeight:'800', color:'#7B2FBE', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:'12px', fontFamily:'Nunito,sans-serif' }}>
            {wellnessBadge}
          </span>
          <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)', fontWeight:'800', color:'#2D1A4A', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' }}>{wellnessTitle}</h2>
          <p style={{ fontSize:'0.92rem', color:'#9585B0', margin:0, fontWeight:'500', fontFamily:'Nunito,sans-serif' }}>{wellnessDesc}</p>
        </div>

        {personalItems.length > 0 && (
          <div style={{ marginBottom:'48px' }}>
            <SectionHeader title={personalTitle} subtitle={personalSub} description={personalDesc} accentColor="#7B2FBE" linkAll="/products?category=personal-care" btnText={personalBtn} />
            <BentoGrid items={personalItems} accentColor="#7B2FBE" />
          </div>
        )}

        {personalItems.length > 0 && healthItems.length > 0 && (
          <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,#C8E6D0,transparent)', margin:'0 0 48px' }} />
        )}

        {/* Health Care HEADER stays within container */}
        {healthItems.length > 0 && (
          <SectionHeader title={healthTitle} subtitle={healthSub} description={healthDesc} accentColor="#10B981" linkAll="/products?category=health-care" btnText={healthBtn} />
        )}
      </div>

      {/* 🆕 FULL-WIDTH MARQUEE — OUTSIDE the 1200px container */}
      {healthItems.length > 0 && (
        <HealthMarquee items={healthItems} accentColor="#10B981" />
      )}

      <style>{`
        .careFlipScene { height:100%; }

        /* Personal Care Bento Grid */
        .bentoGrid { display:grid; grid-template-columns:1.4fr 1fr 1fr; grid-template-rows:185px 185px; gap:12px; height:382px; }
        .bentoBig  { grid-column:1; grid-row:1/span 2; }
        .bentoTop1 { grid-column:2; grid-row:1; }
        .bentoTop2 { grid-column:3; grid-row:1; }
        .bentoWide { grid-column:2/span 2; grid-row:2; }

        /* 🆕 FULL-WIDTH Health Care Marquee */
        .healthMarqueeFullWidth {
          position: relative;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          overflow: hidden;
          padding: 16px 0;
        }
        .healthFadeLeft,
        .healthFadeRight {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 120px;
          z-index: 3;
          pointer-events: none;
        }
        .healthFadeLeft {
          left: 0;
          background: linear-gradient(to right, #F0FDF4 0%, rgba(240,253,244,0.7) 50%, transparent 100%);
        }
        .healthFadeRight {
          right: 0;
          background: linear-gradient(to left, #F0FDF4 0%, rgba(240,253,244,0.7) 50%, transparent 100%);
        }
        .healthMarqueeTrack {
          display: flex;
          gap: 20px;
          width: max-content;
          will-change: transform;
          padding: 0 10px;
        }
        .healthMarqueeItem {
          flex-shrink: 0;
          width: 300px;
          height: 320px;
        }
        @keyframes healthScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }

        @media(max-width:1024px){
          .healthMarqueeItem { width: 260px; height: 280px; }
          .healthFadeLeft, .healthFadeRight { width: 80px; }
        }
        @media(max-width:900px){
          .bentoGrid{grid-template-columns:1fr 1fr;grid-template-rows:200px 160px 160px;height:auto}
          .bentoBig{grid-column:1/span 2;grid-row:1}.bentoTop1{grid-column:1;grid-row:2}.bentoTop2{grid-column:2;grid-row:2}.bentoWide{grid-column:1/span 2;grid-row:3}

          .healthMarqueeItem { width: 220px; height: 240px; }
          .healthFadeLeft, .healthFadeRight { width: 60px; }
        }
        @media(max-width:560px){
          .bentoGrid{grid-template-columns:1fr;grid-template-rows:200px 160px 160px 160px}
          .bentoBig{grid-column:1;grid-row:1}.bentoTop1{grid-column:1;grid-row:2}.bentoTop2{grid-column:1;grid-row:3}.bentoWide{grid-column:1;grid-row:4}

          .healthMarqueeItem { width: 180px; height: 200px; }
          .healthFadeLeft, .healthFadeRight { width: 40px; }
          .healthMarqueeTrack { gap: 14px; }
        }
      `}</style>
    </section>
  );
}
/* ═══════════════════════════════════════
   10. ELECTRIC VEHICLES
═══════════════════════════════════════ */
function EVSection({ banners, sectionSettings = {} }) {
  const s        = sectionSettings['electric'] || {};
  const secTitle = s.title       || 'Electric Vehicles for Kids';
  const secEmoji = s.emoji       || '🚗';
  const secDesc  = s.description || '';
  const secBtn   = s.buttonText  || 'View All Electric Vehicles';

  if (!banners?.length) return null;

  return (
    <section style={{ position:'relative', padding:'clamp(40px,6vw,60px) 20px', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#E8F4FD 0%,#F0E6FF 30%,#FFF0F5 60%,#E8FFF5 100%)', zIndex:0 }} />

      <div style={{ maxWidth:'1200px', margin:'0 auto', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <span style={{ display:'inline-block', padding:'5px 18px', background:'rgba(255,255,255,0.80)', border:'1.5px solid rgba(14,165,233,0.30)', borderRadius:'999px', fontSize:'0.72rem', fontWeight:'800', color:'#0c4a6e', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px', fontFamily:'Nunito,sans-serif' }}>
            ⚡ Kids Electric Rides
          </span>
          <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.6rem)', fontWeight:'800', color:'#2D1A4A', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' }}>{secEmoji} {secTitle}</h2>
          {secDesc && <p style={{ fontSize:'0.88rem', color:'#9585B0', margin:0, fontWeight:'500', fontFamily:'Nunito,sans-serif' }}>{secDesc}</p>}
        </div>

        <div className="evGrid">
          {banners.slice(0, 4).map((item, i) => {
            const frontImg = item.image?.url || null;
            const backImg  = item.mobileImage?.url || frontImg;
            return (
              <FlipCard key={i} sceneClassName="evFlipScene" href={item.buttonLink || '/products?category=electric-vehicles'}>
                <div className="flipFace flipFront evRedBorder">
                  <div className="evImgWrap" style={{ background: frontImg ? '#f0f8ff' : 'linear-gradient(135deg,#E0F2FE,#F3E8FF)' }}>
                    {frontImg
                      ? <img src={frontImg} alt={item.title} style={{ width:'100%',height:'100%',objectFit:'contain',padding:'12px',boxSizing:'border-box' }} />
                      : <span style={{ fontSize:'5rem' }}>{item.emoji||'🚗'}</span>}
                    {item.ageGroup && (
                      <div style={{ position:'absolute', top:'10px', right:'10px', padding:'4px 10px', background:'rgba(0,0,0,0.45)', color:'white', borderRadius:'999px', fontSize:'10px', fontWeight:'700', fontFamily:'Nunito,sans-serif', backdropFilter:'blur(4px)' }}>
                        👶 {item.ageGroup}
                      </div>
                    )}
                  </div>
                  <div className="evInfo">
                    <h3 style={{ fontSize:'0.92rem', fontWeight:'800', color:'#2D1A4A', margin:'0 0 8px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'Nunito,sans-serif' }}>{item.title}</h3>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'1.1rem', fontWeight:'900', color:'#0EA5E9', fontFamily:'Nunito,sans-serif' }}>
                        {item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'View'}
                      </span>
                      <span style={{ padding:'6px 14px', background:'linear-gradient(135deg,#0EA5E9,#7B2FBE)', color:'white', borderRadius:'999px', fontSize:'0.76rem', fontWeight:'800', fontFamily:'Nunito,sans-serif' }}>🛒 Shop</span>
                    </div>
                  </div>
                </div>
                <div className="flipFace flipBack evRedBorder">
                  <div className="evImgWrap" style={{ background: backImg ? '#f0f8ff' : 'linear-gradient(135deg,#F0E6FF,#FFE0F0)' }}>
                    {backImg
                      ? <img src={backImg} alt={item.title} style={{ width:'100%',height:'100%',objectFit:'contain',padding:'12px',boxSizing:'border-box' }} />
                      : <span style={{ fontSize:'5rem' }}>⚡</span>}
                  </div>
                  <div className="evInfo" style={{ background:'linear-gradient(135deg,#0EA5E9,#7B2FBE)' }}>
                    <h3 style={{ fontSize:'0.92rem', fontWeight:'800', color:'white', margin:'0 0 4px', fontFamily:'Nunito,sans-serif' }}>{item.title}</h3>
                    <span style={{ fontSize:'0.78rem', fontWeight:'800', color:'white', fontFamily:'Nunito,sans-serif' }}>Click to View →</span>
                  </div>
                </div>
              </FlipCard>
            );
          })}
        </div>

        <div style={{ textAlign:'center', marginTop:'32px' }}>
          <Link href="/products?category=electric-vehicles" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'12px 30px', background:'linear-gradient(135deg,#0EA5E9,#7B2FBE)', color:'white', borderRadius:'999px', textDecoration:'none', fontWeight:'800', fontSize:'0.92rem', boxShadow:'0 6px 20px rgba(14,165,233,0.28)', fontFamily:'Nunito,sans-serif' }}>
            {secBtn} ⚡
          </Link>
        </div>

        <style>{`
          .evGrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:20px; }
          .evFlipScene { height:350px; }
          .evRedBorder { border:3px solid #E03F4F; background:rgba(255,255,255,0.95); backdrop-filter:blur(12px); box-sizing:border-box; display:flex; flex-direction:column; border-radius:24px; box-shadow:0 6px 18px rgba(224,63,79,0.18); transition:box-shadow 0.3s ease; }
          .flipScene.isFlipped .evRedBorder,.flipScene:hover .evRedBorder{border-color:#C92A3A;box-shadow:0 18px 44px rgba(224,63,79,0.35)}
          .evImgWrap { flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; border-radius:16px; }
          .evInfo { padding:14px 16px; background:white; }
          @media(max-width:700px){.evGrid{grid-template-columns:repeat(2,1fr);gap:14px}.evFlipScene{height:300px}}
          @media(max-width:380px){.evGrid{grid-template-columns:1fr}}
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
  const secDesc  = s.description || "This week's hottest picks";

  const allProducts = [];
  const maxLen = Math.max(trending?.length || 0, featured?.length || 0);
  for (let i = 0; i < maxLen; i++) {
    if (trending?.[i]) allProducts.push({ ...trending[i], _label: 'trending' });
    if (featured?.[i]) allProducts.push({ ...featured[i], _label: 'featured' });
  }
  const display = allProducts.slice(0, 8);
  if (!display.length) return null;

  return (
    <section style={{ padding:'clamp(40px,6vw,60px) 20px', background:'white' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <span style={{ display:'block', padding:'4px 14px', background:'linear-gradient(135deg,#FFF3EC,#F3E8FF)', border:'1.5px solid #FFD4B8', borderRadius:'999px', fontSize:'0.70rem', fontWeight:'800', color:'#FF6B35', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'8px', fontFamily:'Nunito,sans-serif', width:'fit-content' }}>
              This Week
            </span>
            <h2 style={{ fontSize:'clamp(1.3rem,2.5vw,2rem)', fontWeight:'800', color:'#2D1A4A', margin:'0 0 4px', fontFamily:'Nunito,sans-serif' }}>{secEmoji} {secTitle}</h2>
            {secDesc && <p style={{ fontSize:'0.84rem', color:'#9585B0', margin:0, fontWeight:'500', fontFamily:'Nunito,sans-serif' }}>{secDesc}</p>}
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <Link href="/products?trending=true" style={{ padding:'8px 16px', background:'linear-gradient(135deg,#FF6B35,#FF8C5A)', color:'white', borderRadius:'999px', textDecoration:'none', fontSize:'0.78rem', fontWeight:'700', fontFamily:'Nunito,sans-serif' }}>🔥 Trending →</Link>
            <Link href="/products?featured=true" style={{ padding:'8px 16px', background:'linear-gradient(135deg,#7B2FBE,#9B4FDE)', color:'white', borderRadius:'999px', textDecoration:'none', fontSize:'0.78rem', fontWeight:'700', fontFamily:'Nunito,sans-serif' }}>⭐ Featured →</Link>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'18px' }}>
          {display.map(p => (
            <div key={`${p._label}-${p.id}`} style={{ position:'relative' }}>
              <div style={{ position:'absolute', top:'10px', left:'10px', zIndex:10, padding:'3px 9px', borderRadius:'999px', fontSize:'10px', fontWeight:'800', background: p._label==='trending' ? 'linear-gradient(135deg,#FF6B35,#FF8C5A)' : 'linear-gradient(135deg,#7B2FBE,#9B4FDE)', color:'white', fontFamily:'Nunito,sans-serif', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
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
  const s        = sectionSettings['cta'] || {};
  const secTitle = s.title       || 'Get 10% Off Your First Order!';
  const secDesc  = s.description || 'Sign up now and unlock exclusive deals, early access to sales, and personalised recommendations.';
  const secBtn   = s.buttonText  || 'Create Free Account';

  return (
    <section style={{ position:'relative', overflow:'hidden' }}>
      <div style={{ background:'linear-gradient(135deg,#FF6B35 0%,#FF8C5A 25%,#7B2FBE 65%,#9B4FDE 100%)', padding:'clamp(48px,8vw,88px) 20px', position:'relative' }}>
        {[{ top:'-80px', right:'-80px', size:'320px' }, { bottom:'-60px', left:'-60px', size:'280px' }].map((b, i) => (
          <div key={i} style={{ position:'absolute', top:b.top, bottom:b.bottom, left:b.left, right:b.right, width:b.size, height:b.size, borderRadius:'50%', background:'rgba(255,255,255,0.10)', pointerEvents:'none' }} />
        ))}
        <div style={{ maxWidth:'1100px', margin:'0 auto', position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'40px', flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:'260px' }}>
              <span style={{ display:'inline-flex', alignItems:'center', padding:'6px 18px', background:'rgba(255,255,255,0.18)', border:'2px solid rgba(255,255,255,0.35)', borderRadius:'999px', fontSize:'0.82rem', fontWeight:'800', color:'white', marginBottom:'16px', fontFamily:'Nunito,sans-serif' }}>
                🎁 Special Offer
              </span>
              <h2 style={{ fontSize:'clamp(1.5rem,3.5vw,2.8rem)', fontWeight:'800', color:'white', margin:'0 0 16px', lineHeight:1.18, fontFamily:'Nunito,sans-serif' }}>{secTitle}</h2>
              <p style={{ fontSize:'clamp(0.88rem,1.5vw,1rem)', color:'rgba(255,255,255,0.92)', margin:'0 0 28px', lineHeight:1.75, fontWeight:'500', maxWidth:'480px', fontFamily:'Nunito,sans-serif' }}>{secDesc}</p>
              <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
                <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'clamp(11px,2vw,14px) clamp(22px,3vw,32px)', background:'white', color:'#FF6B35', borderRadius:'999px', textDecoration:'none', fontWeight:'800', fontSize:'clamp(0.88rem,1.5vw,0.96rem)', boxShadow:'0 10px 32px rgba(0,0,0,0.18)', fontFamily:'Nunito,sans-serif' }}>
                  {secBtn} →
                </Link>
                <Link href="/products" style={{ color:'rgba(255,255,255,0.92)', fontWeight:'700', fontSize:'0.92rem', textDecoration:'none', borderBottom:'2px solid rgba(255,255,255,0.45)', paddingBottom:'2px', fontFamily:'Nunito,sans-serif' }}>
                  Browse Products ↗
                </Link>
              </div>
              <div style={{ display:'flex', gap:'20px', marginTop:'28px', flexWrap:'wrap' }}>
                {[{ icon:'🛡️', text:'100% Safe & Certified' }, { icon:'🚚', text:'Free delivery ₹499+' }, { icon:'↩️', text:'30-day returns' }].map((b, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.80rem', color:'rgba(255,255,255,0.85)', fontWeight:'600', fontFamily:'Nunito,sans-serif' }}>
                    <span>{b.icon}</span>{b.text}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:'clamp(200px,28vw,260px)', height:'clamp(260px,35vw,340px)', borderRadius:'22px', overflow:'hidden', boxShadow:'0 20px 56px rgba(0,0,0,0.25)', border:'4px solid rgba(255,255,255,0.28)' }}>
                <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?w=520&h=680&fit=crop&auto=format" alt="Happy Baby" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              {[{ top:'16px', left:'-16px', icon:'🧸', num:'12k+', sub:'Happy Families', delay:'0s' }, { bottom:'16px', right:'-16px', icon:'⭐', num:'4.9', sub:'500+ Reviews', delay:'1.5s' }].map((b, i) => (
                <div key={i} style={{ position:'absolute', top:b.top, bottom:b.bottom, left:b.left, right:b.right, background:'white', borderRadius:'12px', padding:'8px 12px', boxShadow:'0 8px 20px rgba(0,0,0,0.14)', display:'flex', alignItems:'center', gap:'7px', animation:`badgeFloat 3s ease-in-out infinite ${b.delay}` }}>
                  <span style={{ fontSize:'1.2rem' }}>{b.icon}</span>
                  <div>
                    <p style={{ margin:0, fontSize:'0.68rem', fontWeight:'700', color:'#FF6B35', fontFamily:'Nunito,sans-serif' }}>{b.num}</p>
                    <p style={{ margin:0, fontSize:'0.60rem', color:'#888', fontFamily:'Nunito,sans-serif' }}>{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes badgeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }`}</style>
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
    { key: 'hero',      render: <HeroBanner banners={heroBanners} /> },
    { key: 'brands',    render: <BrandsSection brands={brands} sectionSettings={sectionSettings} /> },
    { key: 'category',  render: <CategorySection banners={categoryBanners} sectionSettings={sectionSettings} /> },
    { key: 'budget',    render: <BudgetSection banners={budgetBanners} sectionSettings={sectionSettings} /> },
    { key: 'sunny',     render: <SunnySection banners={sunnyBanners} sectionSettings={sectionSettings} /> },
    { key: 'gender',    render: <GenderSection banners={genderBanners} sectionSettings={sectionSettings} /> }, 
    { key: 'festival',  render: <SeasonBanner banners={festivalBanners} sectionSettings={sectionSettings} /> },
    { key: 'promo',     render: <PromoSection banners={promoBanners} sectionSettings={sectionSettings} /> },
    { key: 'baby-food', render: <BabyFoodSection banners={babyFoodBanners} sectionSettings={sectionSettings} /> },
    { key: 'toys',      render: <ToysSection banners={toysBanners} sectionSettings={sectionSettings} /> },
    { key: 'care',      render: <CareSection personalCareBanners={personalCareBanners} healthCareBanners={healthCareBanners} sectionSettings={sectionSettings} /> },
    { key: 'electric',  render: <EVSection banners={evBanners} sectionSettings={sectionSettings} /> },
    { key: 'trending',  render: <TrendingFeaturedSection trending={trending} featured={featured} sectionSettings={sectionSettings} /> },
    { key: 'cta',       render: <CTASection sectionSettings={sectionSettings} /> },
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
        {allSections.map(section =>
          isVisible(section.key) && (
            <div key={section.key}>{section.render}</div>
          )
        )}
      </div>
    </>
  );
}