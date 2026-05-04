'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './HeroBanner.module.css';

const defaultBanners = [
  {
    id: '1',
    title: 'Soft & Safe for Every\nLittle Adventure',
    subtitle: 'Gentle fabrics, safe certified materials, and designs that let your baby explore the world with comfort and joy.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    secondaryText: 'Explore Collection',
    secondaryLink: '/products',
    tag: '✨ New Arrivals 2025',
    badgeText: 'Summer Collection',
    badgeSubText: 'Just dropped',
    deliveryText: 'Free delivery above ₹499',
    stats: [
      { number: '12k+', label: 'Happy families' },
      { number: '500+', label: 'Products' },
      { number: '100%', label: 'Safe certified' },
    ],
    theme: 'orange',
    emoji: '🍊',
    decorEmoji1: '⭐',
    decorEmoji2: '🌸',
    decorEmoji3: '🍀',
  },
  {
    id: '2',
    title: 'Comfort & Style for\nEvery Beautiful Mom',
    subtitle: 'Premium quality pieces made for the journey of motherhood — comfort meets style through every beautiful stage.',
    buttonText: 'Shop Maternity',
    buttonLink: '/products?category=maternity',
    secondaryText: 'View Collections',
    secondaryLink: '/products',
    tag: '💜 Mom\'s Special',
    badgeText: 'Maternity Picks',
    badgeSubText: 'New season',
    deliveryText: 'Free delivery above ₹499',
    stats: [
      { number: '12k+', label: 'Happy families' },
      { number: '500+', label: 'Products' },
      { number: '100%', label: 'Safe certified' },
    ],
    theme: 'purple',
    emoji: '🌷',
    decorEmoji1: '💜',
    decorEmoji2: '🌙',
    decorEmoji3: '✨',
  },
  {
    id: '3',
    title: 'Toys That Spark Joy\n& Little Smiles',
    subtitle: 'Educational and fun toys for every explorer — safe, colourful, and designed to grow with your child.',
    buttonText: 'Shop Toys',
    buttonLink: '/products?category=toys-games',
    secondaryText: 'View Collections',
    secondaryLink: '/products',
    tag: '🎉 Best Sellers',
    badgeText: 'Top Rated Toys',
    badgeSubText: 'Kids love it',
    deliveryText: 'Free delivery above ₹499',
    stats: [
      { number: '12k+', label: 'Happy families' },
      { number: '500+', label: 'Products' },
      { number: '100%', label: 'Safe certified' },
    ],
    theme: 'peach',
    emoji: '🧸',
    decorEmoji1: '🌈',
    decorEmoji2: '⭐',
    decorEmoji3: '🎈',
  },
];

const themeMap = {
  orange: {
    bg: 'linear-gradient(135deg, #FFF5EE 0%, #FFF8F2 50%, #FEF0FF 100%)',
    accent: '#F47B20',
    accentSoft: '#FDE8D0',
    accentLight: '#FFF3E8',
    accentGlow: 'rgba(244,123,32,0.18)',
    btnGrad: 'linear-gradient(135deg, #F47B20 0%, #E8650A 100%)',
    cardBg: 'linear-gradient(145deg, #FFF8F2 0%, #FEF0FF 100%)',
    circleBg: 'linear-gradient(135deg, #FDE8D0 0%, #F9D5F5 100%)',
    tagBg: '#FFF3E8',
    tagColor: '#C45F10',
    tagBorder: '#F9CBAA',
    pillActiveBg: '#F47B20',
  },
  purple: {
    bg: 'linear-gradient(135deg, #FAF5FF 0%, #F8F0FF 50%, #FFF5F9 100%)',
    accent: '#9B59B6',
    accentSoft: '#EDD6F9',
    accentLight: '#F7F0FF',
    accentGlow: 'rgba(155,89,182,0.18)',
    btnGrad: 'linear-gradient(135deg, #9B59B6 0%, #7D3C98 100%)',
    cardBg: 'linear-gradient(145deg, #FAF5FF 0%, #FFF0FB 100%)',
    circleBg: 'linear-gradient(135deg, #EDD6F9 0%, #FFD6E7 100%)',
    tagBg: '#F7F0FF',
    tagColor: '#6C3483',
    tagBorder: '#D7A9F0',
    pillActiveBg: '#9B59B6',
  },
  peach: {
    bg: 'linear-gradient(135deg, #FFF8F5 0%, #FFF4EE 50%, #FFF9F0 100%)',
    accent: '#E8773A',
    accentSoft: '#FAD9C4',
    accentLight: '#FFF4EE',
    accentGlow: 'rgba(232,119,58,0.18)',
    btnGrad: 'linear-gradient(135deg, #E8773A 0%, #D45F20 100%)',
    cardBg: 'linear-gradient(145deg, #FFF8F5 0%, #FFFAF0 100%)',
    circleBg: 'linear-gradient(135deg, #FAD9C4 0%, #FAE8C4 100%)',
    tagBg: '#FFF4EE',
    tagColor: '#B05020',
    tagBorder: '#F5C4A0',
    pillActiveBg: '#E8773A',
  },
};

export default function HeroBanner({ banners = [] }) {
  const rawSlides = banners.length > 0 ? banners : defaultBanners;

  const slides = rawSlides.map((b, i) => ({
    ...defaultBanners[i % defaultBanners.length],
    ...b,
    theme: b.theme || defaultBanners[i % defaultBanners.length].theme,
  }));

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState('next');

  const go = useCallback((idx, dir = 'next') => {
    if (animating || idx === current) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 400);
  }, [animating, current]);

  const goNext = useCallback(() => {
    go((current + 1) % slides.length, 'next');
  }, [current, slides.length, go]);

  const goPrev = useCallback(() => {
    go((current - 1 + slides.length) % slides.length, 'prev');
  }, [current, slides.length, go]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(goNext, 5500);
    return () => clearInterval(timer);
  }, [goNext, paused]);

  const slide = slides[current];
  const theme = themeMap[slide.theme] || themeMap.orange;

  const categories = [
    { icon: '👶', label: 'All', link: '/products' },
    { icon: '👗', label: 'Clothing', link: '/products?category=clothing' },
    { icon: '👟', label: 'Footwear', link: '/products?category=footwear' },
    { icon: '🧴', label: 'Care', link: '/products?category=health-care' },
    { icon: '🧸', label: 'Toys', link: '/products?category=toys-games' },
    { icon: '🍼', label: 'Feeding', link: '/products?category=feeding' },
    { icon: '🛏️', label: 'Bedding', link: '/products?category=bedding' },
    { icon: '🎒', label: 'Gear', link: '/products?category=gear' },
  ];

  return (
    <section
      className={styles.hero}
      style={{ '--accent': theme.accent, '--accent-soft': theme.accentSoft, '--accent-glow': theme.accentGlow }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Animated gradient background */}
      <div
        className={styles.heroBg}
        style={{ background: theme.bg }}
      />

      {/* Soft wave pattern */}
      <div className={styles.wavePattern} />

      {/* Floating soft blobs */}
      <div className={styles.blob1} style={{ background: theme.accentSoft, opacity: 0.35 }} />
      <div className={styles.blob2} style={{ background: theme.circleBg, opacity: 0.25 }} />
      <div className={styles.blob3} style={{ background: theme.accentSoft, opacity: 0.2 }} />

      {/* ===== MAIN LAYOUT ===== */}
      <div className={`container ${styles.layout}`}>

        {/* ===== LEFT — TEXT CONTENT ===== */}
        <div className={`${styles.textCol} ${animating ? styles.textOut : styles.textIn}`}>

          {/* Tag pill */}
          <div className={styles.tagRow}>
            <span
              className={styles.tag}
              style={{
                background: theme.tagBg,
                color: theme.tagColor,
                border: `1.5px solid ${theme.tagBorder}`,
              }}
            >
              <span className={styles.tagDot} style={{ background: theme.accent }} />
              {slide.tag}
            </span>
          </div>

          {/* Headline */}
          <h1 className={styles.headline}>
            {slide.title.split('\n').map((line, i) => (
              <span key={i} className={i === 1 ? styles.headlineAccent : ''} style={i === 1 ? { color: theme.accent } : {}}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className={styles.subtitle}>{slide.subtitle}</p>

          {/* CTA Buttons */}
          <div className={styles.ctaRow}>
            <Link
              href={slide.buttonLink || '/products'}
              className={styles.btnPrimary}
              style={{ background: theme.btnGrad, boxShadow: `0 8px 28px ${theme.accentGlow}` }}
            >
              <span>{slide.buttonText || 'Shop Now'}</span>
              <span className={styles.btnArrow}>→</span>
            </Link>

            <Link
              href={slide.secondaryLink || '/products'}
              className={styles.btnSecondary}
              style={{ color: theme.accent, borderColor: `${theme.accent}40`, background: theme.accentLight }}
            >
              {slide.secondaryText || 'View Collections'}
            </Link>
          </div>

          {/* Trust badges */}
          <div className={styles.trustRow}>
            <div className={styles.trustBadge}>
              <span className={styles.trustIcon}>🛡️</span>
              <span>100% Safe & Certified</span>
            </div>
            <div className={styles.trustBadge}>
              <span className={styles.trustIcon}>🚚</span>
              <span>Free delivery ₹499+</span>
            </div>
            <div className={styles.trustBadge}>
              <span className={styles.trustIcon}>↩️</span>
              <span>Easy returns</span>
            </div>
          </div>

          {/* Stats */}
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

        {/* ===== RIGHT — VISUAL COLUMN ===== */}
        <div className={`${styles.imageCol} ${animating ? styles.imageOut : styles.imageIn}`}>

          {/* Main visual card */}
          <div className={styles.imageCard} style={{ background: theme.cardBg }}>

            {/* Soft circle bg */}
            <div className={styles.circleBg} style={{ background: theme.circleBg }} />

            {/* Product image or emoji */}
            {slide.image?.url ? (
              <img
                src={slide.image.url}
                alt={slide.title}
                className={styles.productImage}
              />
            ) : (
              <div className={styles.emojiWrap}>
                <span className={styles.mainEmoji}>{slide.emoji}</span>
                {/* Decorative floating emojis inside card */}
                <span className={`${styles.decorEmoji} ${styles.decor1}`}>{slide.decorEmoji1}</span>
                <span className={`${styles.decorEmoji} ${styles.decor2}`}>{slide.decorEmoji2}</span>
                <span className={`${styles.decorEmoji} ${styles.decor3}`}>{slide.decorEmoji3}</span>
              </div>
            )}

            {/* Floating badge top-left */}
            <div className={styles.floatBadge} style={{ top: '16px', left: '16px' }}>
              <div className={styles.floatBadgeDot} style={{ background: theme.accent }} />
              <div>
                <div className={styles.floatBadgeTitle}>{slide.badgeText}</div>
                <div className={styles.floatBadgeSub}>{slide.badgeSubText}</div>
              </div>
            </div>

            {/* Delivery badge bottom */}
            <div className={styles.floatDelivery} style={{ background: theme.accentSoft, color: theme.tagColor }}>
              <span>🚚</span>
              <span>{slide.deliveryText}</span>
            </div>

            {/* Soft dots corner decoration */}
            <div className={styles.dotGrid}>
              {[...Array(9)].map((_, i) => (
                <div key={i} className={styles.dotCell} style={{ background: `${theme.accent}30` }} />
              ))}
            </div>
          </div>

          {/* Floating soft shapes outside card */}
          <div className={`${styles.outerShape} ${styles.outerShape1}`} style={{ background: theme.accentSoft, opacity: 0.5 }} />
          <div className={`${styles.outerShape} ${styles.outerShape2}`} style={{ background: `${theme.accent}15` }} />
        </div>
      </div>

      {/* ===== BOTTOM CONTROLS ===== */}
      <div className={styles.controls}>
        <div className={styles.dots}>
          {slides.map((s, i) => {
            const t = themeMap[s.theme] || themeMap.orange;
            return (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={i === current ? { background: theme.accent, width: '28px' } : {}}
              />
            );
          })}
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              key={current}
              style={{
                background: theme.btnGrad,
                animationPlayState: paused ? 'paused' : 'running',
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== ARROW BUTTONS ===== */}
      <button
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={goPrev}
        aria-label="Previous"
        style={{ '--arrow-accent': theme.accent }}
      >
        ‹
      </button>

      <button
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={goNext}
        aria-label="Next"
        style={{ '--arrow-accent': theme.accent }}
      >
        ›
      </button>

      {/* ===== CATEGORY PILLS ===== */}
      <div className={styles.pillStrip}>
        <div className={styles.pillScroll}>
          {categories.map((item, i) => (
            <Link
              key={i}
              href={item.link}
              className={`${styles.pill} ${i === 0 ? styles.pillActive : ''}`}
              style={i === 0 ? {
                background: theme.btnGrad,
                color: 'white',
                borderColor: theme.accent,
                boxShadow: `0 4px 14px ${theme.accentGlow}`,
              } : {}}
            >
              <span className={styles.pillIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}