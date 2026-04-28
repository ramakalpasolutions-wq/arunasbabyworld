'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './HeroBanner.module.css';

const defaultBanners = [
  {
    id: '1',
    title: 'New Arrivals for Little Stars',
    subtitle: 'Discover premium baby clothing, toys & more',
    buttonText: 'Shop Now',
    buttonLink: '/products',
    bgColor: 'linear-gradient(135deg, #ff6b9d 0%, #c44dff 50%, #7c3aed 100%)',
  },
  {
    id: '2',
    title: 'Toys That Spark Imagination',
    subtitle: 'Educational & fun toys for every age group',
    buttonText: 'Explore Toys',
    buttonLink: '/products?category=toys-games',
    bgColor: 'linear-gradient(135deg, #f59e0b 0%, #ff6b35 50%, #ef4444 100%)',
  },
  {
    id: '3',
    title: 'Safe. Stylish. Comfortable.',
    subtitle: 'Baby gear designed with love and safety in mind',
    buttonText: 'Shop Baby Gear',
    buttonLink: '/products?category=baby-gear',
    bgColor: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 50%, #6366f1 100%)',
  },
];

export default function HeroBanner({ banners = [] }) {
  const slides = banners.length > 0 ? banners : defaultBanners;
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);

  // ✅ Go to specific slide
  const go = useCallback((idx) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 600);
  }, [animating]);

  // ✅ Auto slide - goes automatically every 3 seconds
  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const slide = slides[current];

  return (
    <div
      className={styles.hero}
      // ✅ Pause on hover - resume when mouse leaves
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={styles.slider}
        style={{
          background: slide.bgColor ||
            'linear-gradient(135deg, #ff6b9d, #7c3aed)',
        }}
      >
        <div className={styles.overlay} />

        {/* ✅ Content */}
        <div className={`container ${styles.content}`}>

          {/* LEFT - Text */}
          <div className={`${styles.textSide} ${animating ? styles.animating : ''}`}>
            <h1 className={styles.title}>{slide.title}</h1>
            {slide.subtitle && (
              <p className={styles.subtitle}>{slide.subtitle}</p>
            )}
            <div className={styles.actions}>
              <Link
                href={slide.buttonLink || '/products'}
                className={styles.primaryBtn}
              >
                {slide.buttonText || 'Shop Now'} →
              </Link>
              <Link href="/products" className={styles.secondaryBtn}>
                View All Products
              </Link>
            </div>
            <div className={styles.trustBadges}>
              <span>✅ 50k+ Happy Families</span>
              <span>🚚 Free Delivery ₹499+</span>
              <span>↩️ 30-Day Returns</span>
            </div>
          </div>

          {/* ✅ RIGHT - Image */}
          <div className={`${styles.imageSide} ${animating ? styles.animating : ''}`}>
            {slide.image?.url ? (
              <img
                src={slide.image.url}
                alt={slide.title}
                className={styles.bannerImage}
              />
            ) : (
              <div className={styles.defaultImage}>
                <span>🍼</span>
                <span>👶</span>
                <span>🧸</span>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Progress Bar - shows auto slide timing */}
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            key={current}
            style={{
              animationDuration: paused ? '0s' : '3s',
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>

        {/* ✅ DOTS */}
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.activeDot : ''}`}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* ✅ ARROWS */}
        <button
          className={`${styles.arrow} ${styles.prev}`}
          onClick={() => go((current - 1 + slides.length) % slides.length)}
        >
          ‹
        </button>
        <button
          className={`${styles.arrow} ${styles.next}`}
          onClick={() => go((current + 1) % slides.length)}
        >
          ›
        </button>
      </div>

      
    </div>
  );
}