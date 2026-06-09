'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import styles from './HeroBanner.module.css';

// ============================================================
// MARQUEE ITEMS
// ============================================================
const marqueeItems = [
  '🔥 Summer Sale Live',
  '👶 New Baby Collection 2025',
  '🌟 100% Safe & Certified',
  '🎁 Easy Returns & Exchange',
  '✨ Premium Quality Products',
  '🍼 Shop Baby & Kids Essentials',
  '💜 Trusted by 12k+ Families',
];

// ============================================================
// DEFAULT BANNERS (fallback)
// ============================================================
const defaultBanners = [
  {
    id: '1',
    tag: '✨ New Arrivals 2025',
    title: 'Soft & Safe for\nEvery Little One',
    subtitle: 'Gentle fabrics, safe certified materials, and adorable designs that let your baby explore the world with comfort and joy.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    secondaryText: 'View Lookbook',
    secondaryLink: '/products',
    stats: [
      { number: '12k+', label: 'Happy Families' },
      { number: '500+', label: 'Products' },
      { number: '4.9★', label: 'Rating' },
    ],
    panels: [
      { label: '🔥 Trending Now', sublabel: '2.4k sold this week', link: '/products', bg: '#FFF3E8', isBig: true, url: '', emoji: '⭐' },
    ],
    theme: 'orange',
  },
  {
    id: '2',
    tag: '💜 Mom\'s Special',
    title: 'Comfort & Style\nfor Growing Kids',
    subtitle: 'Premium quality pieces crafted for every stage of childhood — comfort meets style through every beautiful moment.',
    buttonText: 'Shop Kids',
    buttonLink: '/products?category=kids',
    secondaryText: 'View Lookbook',
    secondaryLink: '/products',
    stats: [
      { number: '12k+', label: 'Happy Families' },
      { number: '500+', label: 'Products' },
      { number: '4.9★', label: 'Rating' },
    ],
    panels: [
      { label: '🌟 Best Sellers', sublabel: '1.8k sold this week', link: '/products', bg: '#F7F0FF', isBig: true, url: '', emoji: '💜' },
    ],
    theme: 'purple',
  },
  {
    id: '3',
    tag: '🎉 Best Sellers',
    title: 'Toys & Essentials\nKids Will Love',
    subtitle: 'Educational and fun toys for every explorer — safe, colourful, and designed to grow with your child every step.',
    buttonText: 'Shop Toys',
    buttonLink: '/products?category=toys',
    secondaryText: 'View Lookbook',
    secondaryLink: '/products',
    stats: [
      { number: '12k+', label: 'Happy Families' },
      { number: '500+', label: 'Products' },
      { number: '4.9★', label: 'Rating' },
    ],
    panels: [
      { label: '🎉 Top Picks', sublabel: '3.1k sold this week', link: '/products', bg: '#FFF4EE', isBig: true, url: '', emoji: '🌈' },
    ],
    theme: 'peach',
  },
];

// ============================================================
// THEME MAP
// ============================================================
const themeMap = {
  orange: {
    bg: 'linear-gradient(135deg, #FFF5EE 0%, #FFF8F2 50%, #FEF0FF 100%)',
    accent: '#F47B20', accentSoft: '#FDE8D0', accentLight: '#FFF3E8',
    accentGlow: 'rgba(244,123,32,0.18)',
    btnGrad: 'linear-gradient(135deg, #F47B20 0%, #E8650A 100%)',
    tagBg: '#FFF3E8', tagColor: '#C45F10', tagBorder: '#F9CBAA',
  },
  purple: {
    bg: 'linear-gradient(135deg, #FAF5FF 0%, #F8F0FF 50%, #FFF5F9 100%)',
    accent: '#9B59B6', accentSoft: '#EDD6F9', accentLight: '#F7F0FF',
    accentGlow: 'rgba(155,89,182,0.18)',
    btnGrad: 'linear-gradient(135deg, #9B59B6 0%, #7D3C98 100%)',
    tagBg: '#F7F0FF', tagColor: '#6C3483', tagBorder: '#D7A9F0',
  },
  peach: {
    bg: 'linear-gradient(135deg, #FFF8F5 0%, #FFF4EE 50%, #FFF9F0 100%)',
    accent: '#E8773A', accentSoft: '#FAD9C4', accentLight: '#FFF4EE',
    accentGlow: 'rgba(232,119,58,0.18)',
    btnGrad: 'linear-gradient(135deg, #E8773A 0%, #D45F20 100%)',
    tagBg: '#FFF4EE', tagColor: '#B05020', tagBorder: '#F5C4A0',
  },
};

// ============================================================
// HELPER — Detect video URLs
// ============================================================
const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().split('?')[0];
  return (
    lower.endsWith('.mp4')  || lower.endsWith('.webm') ||
    lower.endsWith('.mov')  || lower.endsWith('.m4v')  ||
    lower.includes('/video/')
  );
};

// ============================================================
// MEDIA COMPONENT (Image or Video)
// ============================================================
function HeroMedia({ panel, isActive, muted, onToggleMute }) {
  const videoRef = useRef(null);
  const hasMedia = !!(panel?.url && panel.url.trim() !== '');
  const isVideo  = hasMedia && isVideoUrl(panel.url);

  useEffect(() => {
    if (!videoRef.current || !isVideo) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = muted;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive, isVideo, muted]);

  if (!hasMedia) {
    return (
      <div className={styles.emojiWrap}>
        <span className={styles.bigEmoji}>{panel?.emoji || '🍼'}</span>
      </div>
    );
  }

  if (isVideo) {
    return (
      <>
        <video
          ref={videoRef}
          className={styles.heroMedia}
          src={panel.url}
          autoPlay
          muted={muted}
          loop
          playsInline
          preload="metadata"
        />
        <button
          type="button"
          className={styles.muteBtn}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleMute(); }}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <span className={styles.liveBadge}>
          <span className={styles.liveDot} />
          LIVE
        </span>
      </>
    );
  }

  return (
    <img
      src={panel.url}
      alt={panel.label || ''}
      className={styles.heroMedia}
      loading="lazy"
    />
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function HeroBanner({ banners = [] }) {
  const rawSlides = banners.length > 0 ? banners : defaultBanners;

  const slides = rawSlides.map((b, i) => {
    const def       = defaultBanners[i % defaultBanners.length];
    const allPanels = b.panels?.length > 0 ? b.panels : def.panels;
    const bigPanel  = allPanels.find(p => p.isBig) || allPanels[0] || def.panels[0];

    return {
      ...def,
      ...b,
      theme:    b.theme || def.theme,
      bigMedia: bigPanel,
    };
  });

  const [current,   setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused,    setPaused]    = useState(false);
  const [muted,     setMuted]     = useState(true);

  const go = useCallback((idx) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 420);
  }, [animating, current]);

  const goNext = useCallback(() => go((current + 1) % slides.length), [current, slides.length, go]);
  const goPrev = useCallback(() => go((current - 1 + slides.length) % slides.length), [current, slides.length, go]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(goNext, 5500);
    return () => clearInterval(timer);
  }, [goNext, paused]);

  const slide = slides[current];
  const theme = themeMap[slide.theme] || themeMap.orange;
  const media = slide.bigMedia;

  return (
    <section
      className={styles.heroWrap}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── MARQUEE BAR ── */}
      <div className={styles.marqueeBar} style={{ background: theme.btnGrad }}>
        <div className={styles.marqueeTrack}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className={styles.marqueeItem}>
              {item}
              <span className={styles.marqueeDot}>•</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO MAIN ── */}
      <div className={styles.hero}>

        {/* ── FULL-SCREEN MEDIA (Background layer) ── */}
        <div className={`${styles.mediaCol} ${animating ? styles.mediaOut : styles.mediaIn}`}>
          <Link
            href={media?.link || '/products'}
            className={styles.mediaCard}
            style={{ background: media?.bg || '#FFF3E8' }}
            aria-label={media?.label || 'Hero'}
          >
            <HeroMedia
              panel={media}
              isActive={!animating}
              muted={muted}
              onToggleMute={() => setMuted(m => !m)}
            />

            {media?.url && <div className={styles.mediaOverlay} />}
          </Link>

          {/* Trending badge */}
          {media?.label && (
            <div className={styles.trendingBadge} style={{ background: theme.btnGrad }}>
              <span>{media.label}</span>
            </div>
          )}
        </div>

        {/* ── TEXT OVERLAY (On top of media) ── */}
        <div className={styles.layout}>
          <div className={`${styles.textCol} ${animating ? styles.textOut : styles.textIn}`}>

            <div className={styles.tagRow}>
              <span className={styles.tag}>
                <span className={styles.tagDot} />
                {slide.tag}
              </span>
            </div>

            <h1 className={styles.headline}>
              {slide.title.split('\n').map((line, i) => (
                <span
                  key={i}
                  className={i === 1 ? styles.headlineAccent : ''}
                >
                  {line}{i === 0 && <br />}
                </span>
              ))}
            </h1>

            <p className={styles.subtitle}>{slide.subtitle}</p>

            <div className={styles.ctaRow}>
              <Link
                href={slide.buttonLink || '/products'}
                className={styles.btnPrimary}
                style={{ background: theme.btnGrad, boxShadow: `0 12px 36px ${theme.accentGlow}` }}
              >
                <span>{slide.buttonText || 'Shop Now'}</span>
                <span className={styles.btnArrow}>→</span>
              </Link>
              <Link
                href={slide.secondaryLink || '/products'}
                className={styles.btnSecondary}
              >
                {slide.secondaryText || 'View Lookbook'}
              </Link>
            </div>

            <div className={styles.statsRow}>
              {slide.stats?.map((stat, i) => (
                <div key={i} className={styles.statItem}>
                  <div>
                    <span className={styles.statNum}>{stat.number}</span>
                    <span className={styles.statLabel}>{stat.label}</span>
                  </div>
                  {i < slide.stats.length - 1 && <div className={styles.statDivider} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide indicators */}
        <div className={styles.indicators}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              key={current}
              style={{ animationPlayState: paused ? 'paused' : 'running' }}
            />
          </div>
        </div>

        {/* Arrow buttons */}
        <button
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={goPrev}
          aria-label="Previous"
        >‹</button>
        <button
          className={`${styles.arrow} ${styles.arrowRight}`}
          onClick={goNext}
          aria-label="Next"
        >›</button>
      </div>
    </section>
  );
}