'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import styles from './HeroBanner.module.css';

const defaultBanners = [
  {
    id: '1',
    tag: '✨ New Arrivals 2025',
    title: 'Soft & Stylish\nBaby Essentials',
    subtitle:
      'Discover premium organic cotton outfits designed for comfort, warmth, and everyday adventures.',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    secondaryText: 'Explore Collection',
    secondaryLink: '/products',
    panels: [
      {
        label: '',
        sublabel: '',
        link: '/products',
        bg: '#F5EFE4',
        isBig: true,
        url: '',
        emoji: '🍼',
      },
    ],
    theme: 'cream',
  },
];

const themeMap = {
  cream: {
    panelBg: 'linear-gradient(135deg, #FBF3E4 0%, #F5E6D3 50%, #EDD9C0 100%)',
    btnPrimary: '#FFFFFF',
    btnPrimaryText: '#1A1A1A',
    btnSecondary: 'rgba(255, 255, 255, 0.55)',
    btnSecondaryText: '#1A1A1A',
    titleColor: '#1A1A1A',
    subtitleColor: '#5A4A3A',
    cloudColor: '#FFFFFF',
    accentDot: '#F5B5C5',
  },
  orange: {
    panelBg: 'linear-gradient(135deg, #FFF3E8 0%, #FFE4CC 100%)',
    btnPrimary: '#FFFFFF',
    btnPrimaryText: '#E8650A',
    btnSecondary: 'rgba(255, 255, 255, 0.55)',
    btnSecondaryText: '#E8650A',
    titleColor: '#2A1810',
    subtitleColor: '#5A4030',
    cloudColor: '#FFFFFF',
    accentDot: '#F47B20',
  },
  purple: {
    panelBg: 'linear-gradient(135deg, #F7F0FF 0%, #EBE0FA 100%)',
    btnPrimary: '#FFFFFF',
    btnPrimaryText: '#7D3C98',
    btnSecondary: 'rgba(255, 255, 255, 0.55)',
    btnSecondaryText: '#7D3C98',
    titleColor: '#2D1A4A',
    subtitleColor: '#5A4570',
    cloudColor: '#FFFFFF',
    accentDot: '#9B59B6',
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
        style={{
          background:
            panel?.bg || 'linear-gradient(135deg, #FFF5EE 0%, #FEF0FF 100%)',
        }}
      >
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
    const themeKeys = Object.keys(themeMap);
    return rawSlides.map((b, i) => {
      const def = defaultBanners[0];
      const allPanels = b.panels?.length > 0 ? b.panels : def.panels;
      const bigPanel =
        allPanels.find((p) => p.isBig) || allPanels[0] || def.panels[0];

      return {
        ...def,
        ...b,
        theme: b.theme || themeKeys[i % themeKeys.length],
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

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  const slide = slides[current];
  const theme = themeMap[slide?.theme] || themeMap.cream;
  const media = slide?.bigMedia;

  if (!slide) return null;

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
        {/* LEFT — IMAGE/VIDEO (full bleed, no badges) */}
        <div
          className={`${styles.mediaPane} ${
            animating ? styles.mediaOut : styles.mediaIn
          }`}
        >
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
          </Link>
        </div>

        {/* RIGHT — TEXT CONTENT (cream panel with floating clouds) */}
        <div
          className={`${styles.contentPane} ${
            animating ? styles.textOut : styles.textIn
          }`}
          style={{ background: theme.panelBg }}
        >
          {/* Floating decorative clouds + shapes */}
          {/* Floating decorative clouds + shapes */}
{/* ☁️ Clouds — exact positions from reference image */}
<span className={`${styles.cloud} ${styles.cloud1}`} aria-hidden="true" />
<span className={`${styles.cloud} ${styles.cloud2}`} aria-hidden="true" />
<span className={`${styles.cloud} ${styles.cloud3}`} aria-hidden="true" />

{/* 🌸 Pink/Peach decorative shapes — exact positions from reference */}
<span className={`${styles.shape} ${styles.shape1}`} aria-hidden="true" />
<span className={`${styles.shape} ${styles.shape2}`} aria-hidden="true" />
<span className={`${styles.shape} ${styles.shape3}`} aria-hidden="true" />
<span className={`${styles.shape} ${styles.shape4}`} aria-hidden="true" />
<span className={`${styles.shape} ${styles.shape5}`} aria-hidden="true" />

          <div className={styles.contentInner}>
            {slide.tag && (
              <div className={styles.tagRow}>
                <span
                  className={styles.tag}
                  style={{ color: theme.titleColor }}
                >
                  <span
                    className={styles.tagDot}
                    style={{ background: theme.accentDot }}
                  />
                  {slide.tag}
                </span>
              </div>
            )}

            <h1
              className={styles.headline}
              style={{ color: theme.titleColor }}
            >
              {slide.title.split('\n').map((line, i) => (
                <span key={i} className={styles.headlineLine}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </h1>

            <p
              className={styles.subtitle}
              style={{ color: theme.subtitleColor }}
            >
              {slide.subtitle}
            </p>

            <div className={styles.ctaRow}>
              <Link
                href={slide.buttonLink || '/products'}
                className={styles.btnPrimary}
                style={{
                  background: theme.btnPrimary,
                  color: theme.btnPrimaryText,
                }}
              >
                {slide.buttonText || 'Shop Now'}
              </Link>

              <Link
                href={slide.secondaryLink || '/products'}
                className={styles.btnSecondary}
                style={{
                  background: theme.btnSecondary,
                  color: theme.btnSecondaryText,
                }}
              >
                {slide.secondaryText || 'Explore Collection'}
              </Link>
            </div>
          </div>
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
          <div className={styles.indicators} role="tablist">
            {slides.map((item, i) => (
              <button
                key={item.id || i}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Go to slide ${i + 1}`}
                className={`${styles.dot} ${
                  i === current ? styles.dotActive : ''
                }`}
                onClick={() => go(i)}
              />
            ))}

            <div className={styles.progressTrack} aria-hidden="true">
              <div
                className={styles.progressBar}
                key={`${current}-${autoplay}`}
                style={{
                  animationPlayState:
                    paused || !autoplay ? 'paused' : 'running',
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