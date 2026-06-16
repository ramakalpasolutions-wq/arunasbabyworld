'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import styles from './HeroBanner.module.css';



const defaultBanners = [
  {
    id: '1',
    tag: '✨ New Arrivals 2025',
    title: 'Soft & Safe for\nEvery Little One',
    subtitle:
      'Gentle fabrics, safe certified materials, and adorable designs that let your baby explore the world with comfort and joy.',
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
      {
        label: '🔥 Trending Now',
        sublabel: '2.4k sold this week',
        link: '/products',
        bg: '#FFF3E8',
        isBig: true,
        url: '',
        emoji: '🍼',
      },
    ],
    theme: 'orange',
  },
  {
    id: '2',
    tag: "💜 Mom's Special",
    title: 'Comfort & Style\nfor Growing Kids',
    subtitle:
      'Premium quality pieces crafted for every stage of childhood — comfort meets style through every beautiful moment.',
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
      {
        label: '🌟 Best Sellers',
        sublabel: '1.8k sold this week',
        link: '/products',
        bg: '#F7F0FF',
        isBig: true,
        url: '',
        emoji: '💜',
      },
    ],
    theme: 'purple',
  },
  {
    id: '3',
    tag: '🎉 Best Sellers',
    title: 'Toys & Essentials\nKids Will Love',
    subtitle:
      'Educational and fun toys for every explorer — safe, colourful, and designed to grow with your child every step.',
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
      {
        label: '🎉 Top Picks',
        sublabel: '3.1k sold this week',
        link: '/products',
        bg: '#FFF4EE',
        isBig: true,
        url: '',
        emoji: '🌈',
      },
    ],
    theme: 'peach',
  },
];

const themeMap = {
  orange: {
    accentGlow: 'rgba(244,123,32,0.22)',
    btnGrad: 'linear-gradient(135deg, #F47B20 0%, #E8650A 100%)',
    chipBg: 'rgba(244,123,32,0.16)',
  },
  purple: {
    accentGlow: 'rgba(155,89,182,0.22)',
    btnGrad: 'linear-gradient(135deg, #9B59B6 0%, #7D3C98 100%)',
    chipBg: 'rgba(155,89,182,0.16)',
  },
  peach: {
    accentGlow: 'rgba(232,119,58,0.22)',
    btnGrad: 'linear-gradient(135deg, #E8773A 0%, #D45F20 100%)',
    chipBg: 'rgba(232,119,58,0.16)',
  },
};

const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().split('?')[0];
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.includes('/video/')
  );
};

function HeroMedia({ panel, isActive, muted, onToggleMute }) {
  const videoRef = useRef(null);
  const hasMedia = !!(panel?.url && panel.url.trim() !== '');
  const isVideo = hasMedia && isVideoUrl(panel.url);

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
      <div
        className={styles.emojiWrap}
        style={{ background: panel?.bg || 'linear-gradient(135deg, #FFF5EE 0%, #FEF0FF 100%)' }}
      >
        <span className={styles.bigEmoji}>{panel?.emoji || '🍼'}</span>
      </div>
    );
  }

  if (isVideo) {
    return (
      <>
        <video
          className={styles.mediaBackdrop}
          src={panel.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleMute();
          }}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </>
    );
  }

  return (
    <>
      <img
        src={panel.url}
        alt=""
        aria-hidden="true"
        className={styles.mediaBackdrop}
      />
      <img
        src={panel.url}
        alt={panel.label || 'Hero banner'}
        className={styles.heroMedia}
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </>
  );
}

export default function HeroBanner({ banners = [] }) {
  const rawSlides = banners.length > 0 ? banners : defaultBanners;

  const slides = useMemo(() => {
    return rawSlides.slice(0, 3).map((b, i) => {
      const def = defaultBanners[i % defaultBanners.length];
      const allPanels = b.panels?.length > 0 ? b.panels : def.panels;
      const bigPanel = allPanels.find((p) => p.isBig) || allPanels[0] || def.panels[0];

      return {
        ...def,
        ...b,
        theme: b.theme || def.theme,
        bigMedia: bigPanel,
      };
    });
  }, [rawSlides]);

  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [muted, setMuted] = useState(true);

  const touchStartX = useRef(null);

  const go = useCallback(
    (idx) => {
      if (animating || idx === current || slides.length <= 1) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(idx);
        setAnimating(false);
      }, 320);
    },
    [animating, current, slides.length]
  );

  const goNext = useCallback(() => {
    if (slides.length <= 1) return;
    go((current + 1) % slides.length);
  }, [current, slides.length, go]);

  const goPrev = useCallback(() => {
    if (slides.length <= 1) return;
    go((current - 1 + slides.length) % slides.length);
  }, [current, slides.length, go]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goNext() : goPrev();
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (paused || !autoplay || slides.length <= 1) return;
    const timer = setInterval(goNext, 5500);
    return () => clearInterval(timer);
  }, [goNext, paused, autoplay, slides.length]);

  const slide = slides[current];
  const theme = themeMap[slide.theme] || themeMap.orange;
  const media = slide.bigMedia;

  return (
    <section className={styles.heroWrap} aria-label="Featured promotions">
    

      <div
        className={styles.heroShell}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`${styles.contentPane} ${animating ? styles.textOut : styles.textIn}`}>
          <div className={styles.tagRow}>
            <span className={styles.tag} style={{ background: theme.chipBg }}>
              <span className={styles.tagDot} />
              {slide.tag}
            </span>
          </div>

          <h1 className={styles.headline}>
            {slide.title.split('\n').map((line, i) => (
              <span key={i} className={i === 1 ? styles.headlineAccent : ''}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h1>

          <p className={styles.subtitle}>{slide.subtitle}</p>

          <div className={styles.ctaRow}>
            <Link
              href={slide.buttonLink || '/products'}
              className={styles.btnPrimary}
              style={{
                background: theme.btnGrad,
                boxShadow: `0 16px 40px ${theme.accentGlow}`,
              }}
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
                <span className={styles.statNum}>{stat.number}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.mediaPane} ${animating ? styles.mediaOut : styles.mediaIn}`}>
          <Link
            href={media?.link || '/products'}
            className={styles.mediaCard}
            aria-label={media?.label || 'Featured collection'}
          >
            <HeroMedia
              panel={media}
              isActive={!animating}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
            />

            {media?.label && (
              <div
                className={styles.mediaBadge}
                style={{ background: theme.btnGrad }}
              >
                <span>{media.label}</span>
                {media?.sublabel && (
                  <small className={styles.mediaSubbadge}>{media.sublabel}</small>
                )}
              </div>
            )}
          </Link>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowLeft}`}
              onClick={goPrev}
              aria-label="Previous slide"
            >
              ‹
            </button>

            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowRight}`}
              onClick={goNext}
              aria-label="Next slide"
            >
              ›
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className={styles.controls} aria-label="Hero slider controls">
          <div className={styles.indicators} role="tablist" aria-label="Select slide">
            {slides.map((item, i) => (
              <button
                key={item.id || i}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}`}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => go(i)}
              />
            ))}

            <div className={styles.progressTrack} aria-hidden="true">
              <div
                className={styles.progressBar}
                key={`${current}-${autoplay}`}
                style={{
                  animationPlayState: paused || !autoplay ? 'paused' : 'running',
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className={styles.autoBtn}
            onClick={() => setAutoplay((s) => !s)}
            aria-label={autoplay ? 'Pause slideshow' : 'Play slideshow'}
          >
            {autoplay ? 'Pause' : 'Play'}
          </button>
        </div>
      )}
    </section>
  );
}