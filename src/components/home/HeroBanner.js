'use client';
import { useState, useEffect, useCallback } from 'react';
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
// DEFAULT BANNERS (used as fallback)
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
      { label: '👶 Newborn',      sublabel: 'Shop Now →',         link: '/products?category=newborn',  emoji: '🍼', bg: '#FDE8D0', isBig: false, url: '' },
      { label: '👗 Clothing',     sublabel: 'Shop Now →',         link: '/products?category=clothing', emoji: '👕', bg: '#F9D5F5', isBig: false, url: '' },
      { label: '🔥 Trending Now', sublabel: '2.4k sold this week', link: '/products',                  emoji: '⭐', bg: '#FFF3E8', isBig: true,  url: '' },
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
      { label: '👦 Boys',         sublabel: 'Shop Now →',         link: '/products?category=boys',     emoji: '🎽', bg: '#EDD6F9', isBig: false, url: '' },
      { label: '👧 Girls',        sublabel: 'Shop Now →',         link: '/products?category=girls',    emoji: '👗', bg: '#FFD6E7', isBig: false, url: '' },
      { label: '🌟 Best Sellers', sublabel: '1.8k sold this week', link: '/products',                  emoji: '💜', bg: '#F7F0FF', isBig: true,  url: '' },
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
      { label: '🧸 Toys',      sublabel: 'Shop Now →',         link: '/products?category=toys',     emoji: '🧸', bg: '#FAD9C4', isBig: false, url: '' },
      { label: '📚 Learning',  sublabel: 'Shop Now →',         link: '/products?category=learning', emoji: '📚', bg: '#FAE8C4', isBig: false, url: '' },
      { label: '🎉 Top Picks', sublabel: '3.1k sold this week', link: '/products',                  emoji: '🌈', bg: '#FFF4EE', isBig: true,  url: '' },
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
// MAIN COMPONENT
// ============================================================
export default function HeroBanner({ banners = [] }) {
  const rawSlides = banners.length > 0 ? banners : defaultBanners;

  const slides = rawSlides.map((b, i) => {
    const def = defaultBanners[i % defaultBanners.length];

    const panels = b.panels?.length > 0
      ? b.panels.map((p, pi) => ({
          ...def.panels[pi % def.panels.length],
          ...p,
        }))
      : def.panels;

    return {
      ...def,
      ...b,
      theme: b.theme || def.theme,
      panels,
    };
  });

  const [current,   setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused,    setPaused]    = useState(false);

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

  const hasImage = (panel) => !!(panel?.url && panel.url.trim() !== '');

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
      <div className={styles.hero} style={{ background: theme.bg }}>
        <div className={styles.blob1} style={{ background: theme.accentSoft }} />
        <div className={styles.blob2} style={{ background: theme.accentSoft }} />

        <div className={`container ${styles.layout}`}>

          {/* ── LEFT TEXT ── */}
          <div className={`${styles.textCol} ${animating ? styles.textOut : styles.textIn}`}>

            <div className={styles.tagRow}>
              <span className={styles.tag} style={{ background: theme.tagBg, color: theme.tagColor, border: `1.5px solid ${theme.tagBorder}` }}>
                <span className={styles.tagDot} style={{ background: theme.accent }} />
                {slide.tag}
              </span>
            </div>

            <h1 className={styles.headline}>
              {slide.title.split('\n').map((line, i) => (
                <span key={i} className={i === 1 ? styles.headlineAccent : ''} style={i === 1 ? { color: theme.accent } : {}}>
                  {line}{i === 0 && <br />}
                </span>
              ))}
            </h1>

            <p className={styles.subtitle}>{slide.subtitle}</p>

            <div className={styles.ctaRow}>
              <Link href={slide.buttonLink || '/products'} className={styles.btnPrimary} style={{ background: theme.btnGrad, boxShadow: `0 8px 28px ${theme.accentGlow}` }}>
                <span>{slide.buttonText || 'Shop Now'}</span>
                <span className={styles.btnArrow}>→</span>
              </Link>
              <Link href={slide.secondaryLink || '/products'} className={styles.btnSecondary} style={{ color: theme.accent, borderColor: `${theme.accent}40`, background: theme.accentLight }}>
                {slide.secondaryText || 'View Lookbook'}
              </Link>
            </div>

            <div className={styles.statsRow}>
              {slide.stats?.map((stat, i) => (
                <div key={i} className={styles.statItem}>
                  <span className={styles.statNum} style={{ color: theme.accent }}>{stat.number}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                  {i < slide.stats.length - 1 && <div className={styles.statDivider} />}
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL GRID ── */}
          <div className={`${styles.panelGrid} ${animating ? styles.panelOut : styles.panelIn}`}>

            {/* Top 2 small panels */}
            <div className={styles.topPanels}>
              {slide.panels?.filter(p => !p.isBig).map((panel, i) => (
                <Link
                  key={i}
                  href={panel.link || '/products'}
                  className={styles.smallPanel}
                  style={{ background: panel.bg || '#FDE8D0' }}
                >
           {hasImage(panel) ? (
  <>
    {/* ✅ FULL IMAGE FILLS PANEL */}
    <img
      src={panel.url}
      alt={panel.label || ''}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',         // ✅ Fills entire panel
        objectPosition: 'center',
        borderRadius: '18px',
        zIndex: 1,
      }}
    />

                      {/* Dark gradient overlay for text readability */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                        borderRadius: '18px',
                        zIndex: 2,
                      }} />
                    </>
                  ) : (
                    <span className={styles.panelEmoji}>{panel.emoji}</span>
                  )}

                  <div className={styles.panelInfo} style={{ position: 'relative', zIndex: 3 }}>
                    <span className={styles.panelLabel} style={{
                      color: hasImage(panel) ? 'white' : '#2D1B4E',
                      textShadow: hasImage(panel) ? '0 2px 6px rgba(0,0,0,0.8)' : 'none',
                    }}>
                      {panel.label}
                    </span>
                    <span className={styles.panelSub} style={{
                      color: hasImage(panel) ? 'rgba(255,255,255,0.92)' : '#7A6080',
                      textShadow: hasImage(panel) ? '0 1px 4px rgba(0,0,0,0.7)' : 'none',
                    }}>
                      {panel.sublabel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom big panel */}
            {slide.panels?.filter(p => p.isBig).map((panel, i) => (
              <Link
                key={i}
                href={panel.link || '/products'}
                className={styles.bigPanel}
                style={{ background: panel.bg || '#FFF3E8' }}
              >
           {hasImage(panel) ? (
  <>
    {/* ✅ FULL IMAGE FILLS PANEL */}
    <img
      src={panel.url}
      alt={panel.label || ''}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',         // ✅ Fills entire panel
        objectPosition: 'center',
        borderRadius: '18px',
        zIndex: 1,
      }}
    />

                    {/* Dark gradient overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                      borderRadius: '18px',
                      zIndex: 2,
                    }} />
                  </>
                ) : (
                  <span className={styles.bigPanelEmoji}>{panel.emoji}</span>
                )}

                <div className={styles.trendingBadge} style={{ background: theme.btnGrad, position: 'relative', zIndex: 3 }}>
                  <span>{panel.label}</span>
                </div>

                <div className={styles.bigPanelInfo} style={{ position: 'relative', zIndex: 3 }}>
                  <span className={styles.bigPanelSub} style={{
                    color: hasImage(panel) ? 'rgba(255,255,255,0.95)' : '#5A4570',
                    textShadow: hasImage(panel) ? '0 1px 4px rgba(0,0,0,0.7)' : 'none',
                  }}>
                    {panel.sublabel}
                  </span>
                  <span className={styles.bigPanelShop} style={{
                    color: hasImage(panel) ? 'white' : theme.accent,
                    textShadow: hasImage(panel) ? '0 2px 6px rgba(0,0,0,0.8)' : 'none',
                  }}>
                    Shop Now →
                  </span>
                </div>
              </Link>
            ))}

            {/* Slide indicators */}
            <div className={styles.indicators}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                  onClick={() => go(i)}
                  aria-label={`Slide ${i + 1}`}
                  style={i === current ? { background: theme.accent, width: '28px' } : {}}
                />
              ))}
              <div className={styles.progressTrack}>
                <div className={styles.progressBar} key={current} style={{ background: theme.btnGrad, animationPlayState: paused ? 'paused' : 'running' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Arrow buttons */}
        <button className={`${styles.arrow} ${styles.arrowLeft}`}  onClick={goPrev} aria-label="Previous" style={{ '--arrow-accent': theme.accent }}>‹</button>
        <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={goNext} aria-label="Next"     style={{ '--arrow-accent': theme.accent }}>›</button>
      </div>
    </section>
  );
}