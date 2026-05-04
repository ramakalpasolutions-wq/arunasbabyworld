'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import HeroBanner from '@/components/home/HeroBanner';
import ProductCard from '@/components/products/ProductCard';
import styles from './HomeClient.module.css';

const topBrands = [
  { name: 'Mothercare',    color: '#FF6B35' },
  { name: 'Babyhug',       color: '#7B2FBE' },
  { name: 'Ed-a-Mamma',    color: '#FF8C5A' },
  { name: 'Gini & Jony',   color: '#9B4FDE' },
  { name: 'Chicco',        color: '#FF6B35' },
  { name: 'Mee Mee',       color: '#7B2FBE' },
  { name: 'Himalaya Baby', color: '#FF8C5A' },
  { name: 'Mamaearth',     color: '#9B4FDE' },
  { name: 'Fisher-Price',  color: '#FF6B35' },
  { name: 'Funskool',      color: '#7B2FBE' },
];

const defaultBudgetItems = [
  { price: 299, emoji: '🎀', color: '#FF6B35', bg: '#FFF3EC', offer: 'Under' },
  { price: 599, emoji: '🧸', color: '#7B2FBE', bg: '#F3E8FF', offer: 'Under' },
  { price: 799, emoji: '🍼', color: '#FF8C5A', bg: '#FFF6F0', offer: 'Under' },
  { price: 999, emoji: '🎁', color: '#9B4FDE', bg: '#F5EEFF', offer: 'Under' },
];

const defaultSunnyItems = [
  { title: 'Tops',     slug: 'tops',       emoji: '👕', color: '#FF6B35' },
  { title: 'T-Shirts', slug: 't-shirts',   emoji: '👚', color: '#7B2FBE' },
  { title: 'Sets',     slug: 'sets-suits', emoji: '🩱', color: '#FF8C5A' },
  { title: 'Shirts',   slug: 'shirts',     emoji: '🧥', color: '#9B4FDE' },
];

const defaultGenderItems = [
  {
    gender: 'girl', title: 'For Her 👧',
    subtitle: 'Cute & stylish picks for girls',
    link: '/products?search=girl', color: '#FF6B35',
    bg: 'linear-gradient(135deg, #FFF3EC 0%, #FFD4B8 50%, #FF6B35 100%)',
    emoji: '👧',
    image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&h=700&fit=crop&auto=format',
  },
  {
    gender: 'boy', title: 'For Him 👦',
    subtitle: 'Cool & fun picks for boys',
    link: '/products?search=boy', color: '#7B2FBE',
    bg: 'linear-gradient(135deg, #F3E8FF 0%, #DFC5F8 50%, #7B2FBE 100%)',
    emoji: '👦',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=700&fit=crop&auto=format',
  },
];

const offerBanners = [
  {
    title: '🎀 New Born Essentials',
    subtitle: 'Everything your newborn needs',
    link: '/products?category=clothing',
    bg: 'linear-gradient(135deg, #FFF3EC, #FFD4B8)',
    borderColor: '#FFD4B8', iconBg: '#FF6B35',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=300&fit=crop&auto=format',
  },
  {
    title: '🏆 Best Sellers',
    subtitle: 'Most loved by parents',
    link: '/products?featured=true',
    bg: 'linear-gradient(135deg, #F3E8FF, #DFC5F8)',
    borderColor: '#DFC5F8', iconBg: '#7B2FBE',
    image: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?w=400&h=300&fit=crop&auto=format',
  },
  {
    title: '⚡ Flash Sale',
    subtitle: 'Up to 60% off today only!',
    link: '/products',
    bg: 'linear-gradient(135deg, #FFF3B0, #FFE066)',
    borderColor: '#FFE066', iconBg: '#F59E0B',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop&auto=format',
  },
];

/* ════════════════════════════════════════
   MATERNITY SECTION
   ════════════════════════════════════════ */
function MaternitySection({ banners }) {
  if (!banners?.length) return null;
  const mainBanner = banners[0];
  const gridItems  = banners.flatMap(b =>
    (b.gridImages || []).map(img => ({
      ...img,
      link: img.link || b.buttonLink || '/products?category=maternity',
    }))
  );

  return (
    <section style={{ padding: '60px 20px', background: 'linear-gradient(135deg, #FFF5F9, #FDF4FF)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)', border: '1.5px solid #FFD4B8', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              For Moms
            </span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: '800', color: '#2D1A4A', margin: 0 }}>
              🤰 Maternity Collection
            </h2>
          </div>
          <Link href={mainBanner.buttonLink || '/products?category=maternity'} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.84rem', fontWeight: '700', boxShadow: '0 4px 14px rgba(255,107,53,0.28)' }}>
            View All →
          </Link>
        </div>

        <Link href={mainBanner.buttonLink || '/products?category=maternity'}
          style={{ display: 'block', borderRadius: '24px', overflow: 'hidden', height: '380px', position: 'relative', textDecoration: 'none', marginBottom: '20px', transition: 'transform 0.35s ease, box-shadow 0.35s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {mainBanner.image?.url ? (
            <img src={mainBanner.image.url} alt={mainBanner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FF6B35, #FF8C5A, #7B2FBE)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8rem' }}>🤰</div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.20) 55%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 48px' }}>
            {mainBanner.subtitle && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', marginBottom: '8px' }}>{mainBanner.subtitle}</p>}
            <h2 style={{ color: 'white', fontWeight: '900', fontSize: 'clamp(1.6rem, 3vw, 2.6rem)', margin: '0 0 20px', textShadow: '0 3px 20px rgba(0,0,0,0.25)' }}>{mainBanner.title}</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: 'white', color: '#FF6B35', borderRadius: '999px', fontSize: '0.92rem', fontWeight: '800', boxShadow: '0 4px 18px rgba(0,0,0,0.18)' }}>
              {mainBanner.buttonText || 'Shop Now'} →
            </span>
          </div>
        </Link>

        {gridItems.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {gridItems.map((item, i) => (
              <Link key={i} href={item.link || '/products?category=maternity'} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', background: 'white', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                >
                  {item.url ? (
                    <img src={item.url} alt={item.title || `Maternity ${i + 1}`} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '220px', background: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🤰</div>
                  )}
                  <div style={{ padding: '14px' }}>
                    {item.title && <h4 style={{ fontSize: '0.90rem', fontWeight: '700', color: '#2D1A4A', margin: '0 0 6px', lineHeight: 1.3 }}>{item.title}</h4>}
                    {item.price && <p style={{ fontSize: '0.95rem', fontWeight: '800', color: '#FF6B35', margin: 0 }}>₹{item.price}</p>}
                    <span style={{ display: 'inline-block', marginTop: '8px', padding: '5px 14px', background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)', color: 'white', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                      Shop Now →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   PERSONAL CARE SECTION
   ════════════════════════════════════════ */
function PersonalCareSection({ banners }) {
  if (!banners?.length) return null;

  const items = banners.flatMap(b =>
    (b.gridImages || []).map(img => ({
      ...img,
      link: img.link || b.buttonLink || '/products?category=personal-care',
    }))
  );

  if (!items.length) return null;

  const loopItems = [...items, ...items, ...items];

  return (
    <section style={{ padding: '60px 0', background: 'white', overflow: 'hidden' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'linear-gradient(135deg, #F3E8FF, #FFF3EC)', border: '1.5px solid #DFC5F8', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#7B2FBE', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              Baby Care
            </span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: '800', color: '#2D1A4A', margin: 0 }}>
              🧴 Personal Care
            </h2>
          </div>
          <Link href={banners[0]?.buttonLink || '/products?category=personal-care'} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #7B2FBE, #FF6B35)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.84rem', fontWeight: '700' }}>
            View All →
          </Link>
        </div>
      </div>

      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to right, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to left, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />

        <div
          style={{ display: 'flex', gap: '18px', animation: 'personalScroll 35s linear infinite', width: 'max-content', padding: '8px 0 16px' }}
          onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
          onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
        >
          {loopItems.map((item, i) => (
            <Link key={i} href={item.link}
              style={{ flexShrink: 0, width: '200px', display: 'block', textDecoration: 'none', transition: 'transform 0.3s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(123,47,190,0.10)', background: 'white' }}>
                {item.url ? (
                  <img src={item.url} alt={item.title || `Personal Care ${i + 1}`} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: '200px', background: `linear-gradient(135deg, ${['#FF6B35','#7B2FBE','#FF8C5A','#9B4FDE'][i % 4]}20, ${['#FF6B35','#7B2FBE','#FF8C5A','#9B4FDE'][i % 4]}40)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🧴</div>
                )}
                <div style={{ padding: '12px' }}>
                  {item.brand && (
                    <p style={{ fontSize: '0.68rem', fontWeight: '800', color: '#7B2FBE', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      {item.brand}
                    </p>
                  )}
                  {item.title && (
                    <h4 style={{ fontSize: '0.84rem', fontWeight: '700', color: '#2D1A4A', margin: '0 0 4px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </h4>
                  )}
                  {item.price && (
                    <p style={{ fontSize: '0.90rem', fontWeight: '800', color: '#FF6B35', margin: 0 }}>
                      ₹{item.price}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes personalScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
      `}</style>
    </section>
  );
}

/* ════════════════════════════════════════
   HEALTH CARE SECTION
   ════════════════════════════════════════ */
function HealthCareSection({ banners }) {
  if (!banners?.length) return null;

  const allGridImages = banners.flatMap(b => b.gridImages || []);
  const childImg = allGridImages[0] || null;
  const womenImg = allGridImages[1] || allGridImages[0] || null;
  const mainBanner = banners[0];

  const cards = [
    {
      img:          childImg,
      label:        '👶 Child',
      subtitle:     childImg?.title || 'Baby care, monitors & safety',
      color:        '#FF6B35',
      link:         childImg?.link || '/products?search=child+health',
      defaultEmoji: '👶',
      defaultBg:    'linear-gradient(135deg, #FFF3EC, #FFD4B8)',
    },
    {
      img:          womenImg,
      label:        '👩 Women',
      subtitle:     womenImg?.title || 'Personal care, hygiene & wellness',
      color:        '#7B2FBE',
      link:         womenImg?.link || '/products?search=women+health',
      defaultEmoji: '👩',
      defaultBg:    'linear-gradient(135deg, #F3E8FF, #DFC5F8)',
    },
  ];

  return (
    <section style={{ padding: '60px 20px', background: 'linear-gradient(135deg, #F0FDF4, #F3E8FF)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '4px 14px', background: 'linear-gradient(135deg, #F0FDF4, #F3E8FF)', border: '1.5px solid #BBF7D0', borderRadius: '999px', fontSize: '0.70rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
              Stay Safe
            </span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: '800', color: '#2D1A4A', margin: 0 }}>
              🏥 Health & Safety
            </h2>
          </div>
          <Link href={mainBanner?.buttonLink || '/products?category=health-care'} style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)', color: 'white', borderRadius: '999px', textDecoration: 'none', fontSize: '0.84rem', fontWeight: '700', boxShadow: '0 4px 14px rgba(255,107,53,0.28)' }}>
            View All →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {cards.map((card, i) => (
            <Link key={i} href={card.link} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', transition: 'transform 0.35s ease, box-shadow 0.35s ease', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.12)'; }}
              >
                {card.img?.url ? (
                  <img src={card.img.url} alt={card.label} style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  />
                ) : (
                  <div style={{ height: '360px', background: card.defaultBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8rem' }}>
                    {card.defaultEmoji}
                  </div>
                )}
                <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 18px', background: card.color, color: 'white', borderRadius: '999px', fontSize: '0.86rem', fontWeight: '800', boxShadow: '0 4px 14px rgba(0,0,0,0.20)' }}>
                  {card.label}
                </div>
                <div style={{ padding: '20px 24px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2D1A4A', margin: '0 0 4px' }}>
                      {card.label} Health Care
                    </h3>
                    <p style={{ color: '#9585B0', margin: 0, fontSize: '0.88rem', fontWeight: '500' }}>
                      {card.subtitle}
                    </p>
                  </div>
                  <span style={{ flexShrink: 0, padding: '10px 20px', background: card.color, color: 'white', borderRadius: '999px', fontSize: '0.84rem', fontWeight: '800' }}>
                    Shop →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   MAIN HOME CLIENT
   ════════════════════════════════════════ */
export default function HomeClient({
  banners             = [],
  budgetBanners       = [],
  sunnyBanners        = [],
  promoBanners        = [],
  genderBanners       = [],
  twoHeroBanners      = [],
  gradientBanners     = [],
  horizontalBanners   = [],
  fullPromoBanners    = [],
  asymmetricBanners   = [],
  maternityBanners    = [],
  personalCareBanners = [],
  healthCareBanners   = [],
  featured            = [],
  trending            = [],
}) {
  const [promoIndex,   setPromoIndex]   = useState(0);
  const [hoveredBrand, setHoveredBrand] = useState(null);

  useEffect(() => {
    if (promoBanners.length <= 1) return;
    const timer = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promoBanners.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [promoBanners.length]);

  const displayBudget = budgetBanners.length > 0
    ? budgetBanners.map((b, i) => ({
        price: b.price  || defaultBudgetItems[i]?.price || 299,
        emoji: b.emoji  || defaultBudgetItems[i]?.emoji || '🎀',
        color: b.color  || defaultBudgetItems[i]?.color || '#FF6B35',
        bg:    defaultBudgetItems[i]?.bg || '#FFF3EC',
        offer: b.offer  || 'Under',
        image: b.image?.url || null,
        link:  b.buttonLink || `/products?maxPrice=${b.price}`,
      }))
    : defaultBudgetItems;

  const displaySunny = sunnyBanners.length > 0
    ? sunnyBanners.map((b, i) => ({
        title: b.title,
        slug:  b.slug || b.buttonLink?.replace('/products?category=', '') || b.title.toLowerCase(),
        emoji: b.emoji || defaultSunnyItems[i]?.emoji || '👕',
        color: defaultSunnyItems[i]?.color || '#FF6B35',
        image: b.image?.url || null,
      }))
    : defaultSunnyItems;

  const girlBanner = genderBanners.find(b => b.gender === 'girl') || defaultGenderItems[0];
  const boyBanner  = genderBanners.find(b => b.gender === 'boy')  || defaultGenderItems[1];
  const genderItems = [
    { ...defaultGenderItems[0], title: girlBanner.title || 'For Her 👧', subtitle: girlBanner.subtitle || 'Cute & stylish picks for girls', image: girlBanner.image?.url || defaultGenderItems[0].image, link: girlBanner.buttonLink || '/products?search=girl' },
    { ...defaultGenderItems[1], title: boyBanner.title  || 'For Him 👦', subtitle: boyBanner.subtitle  || 'Cool & fun picks for boys',    image: boyBanner.image?.url  || defaultGenderItems[1].image, link: boyBanner.buttonLink  || '/products?search=boy' },
  ];

  return (
    <div className={styles.home}>

      {/* ── HERO ── */}
      <div className={styles.heroWrapper}>
        <HeroBanner banners={banners} />
      </div>

      {/* ── TOP BRANDS ── */}
      <section className={styles.brandSection}>
        <div className="container">
          <div className={styles.brandHeader}>
            <div className={styles.sectionLabelWrap}>
              <span className={styles.sectionLabel}>Trusted by Parents</span>
            </div>
            <h2 className={styles.brandTitle}>🏷️ Top Baby Brands</h2>
            <p className={styles.brandSub}>Shop from the most loved baby brands in India</p>
          </div>
        </div>
        <div className={styles.brandMarquee}>
          <div className={styles.brandTrack}>
            {[...topBrands, ...topBrands].map((brand, i) => (
              <Link
                key={i}
                href={`/products?brand=${encodeURIComponent(brand.name)}`}
                className={styles.brandCard}
                style={{ '--brand-color': brand.color }}
                onMouseEnter={() => setHoveredBrand(i)}
                onMouseLeave={() => setHoveredBrand(null)}
              >
                <div className={styles.brandDot} style={{ background: brand.color }} />
                <span className={styles.brandName}>{brand.name}</span>
                <span className={styles.brandArrow}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUDGET STORE ── */}
      <section className={styles.budgetSection}>
        <div className={styles.budgetBg}>
          <div className={styles.budgetShape1} />
          <div className={styles.budgetShape2} />
          <div className={styles.budgetShape3} />
          <div className={`container ${styles.budgetContent}`}>
            <div className={styles.budgetHeader}>
              <span className={styles.sectionLabel}>Save More</span>
              <h2 className={styles.budgetTitle}>🏪 Budget Store</h2>
              <p className={styles.budgetSub}>Best baby deals under your budget!</p>
            </div>
            <div className={styles.budgetGrid}>
              {displayBudget.map((item, i) => (
                <Link
                  key={i}
                  href={item.link || `/products?maxPrice=${item.price}`}
                  className={styles.budgetCard}
                  style={{ '--card-color': item.color, '--card-bg': item.bg, animationDelay: `${i * 0.1}s` }}
                >
                  <div className={styles.budgetRing} style={{ borderColor: item.color }} />
                  {item.image ? (
                    <img src={item.image} alt={`Under ₹${item.price}`} className={styles.budgetImg} style={{ borderColor: item.color }} />
                  ) : (
                    <div className={styles.cardEmoji}>{item.emoji}</div>
                  )}
                  <div className={styles.cardLabel}>{item.offer}</div>
                  <div className={styles.cardPrice} style={{ color: item.color }}>₹{item.price}</div>
                  <div className={styles.cardBtn} style={{ background: item.color }}>Shop Now →</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SUNNY PLAY DAYS ── */}
      <section className={styles.sunnySection}>
        <div className="container">
          <div className={styles.sunnyHeader}>
            <span className={styles.sectionLabel}>Collections</span>
            <h2 className={styles.sunnyTitle}>☀️ Sunny Play Days</h2>
          </div>
          <div className={styles.sunnyGrid}>
            {displaySunny.map((cat, i) => (
              <Link
                key={i}
                href={`/products?category=${cat.slug}`}
                className={styles.sunnyCard}
                style={{ '--sunny-color': cat.color, animationDelay: `${i * 0.1}s` }}
              >
                <div className={styles.sunnyBg} style={{ background: `linear-gradient(160deg, ${cat.color}15 0%, ${cat.color}30 100%)` }} />
                <div className={styles.sunnyImg}>
                  {cat.image
                    ? <img src={cat.image} alt={cat.title} className={styles.sunnyImgEl} />
                    : <span className={styles.sunnyEmoji}>{cat.emoji}</span>
                  }
                </div>
                <div className={styles.sunnyInfo}>
                  <span className={styles.sunnyLabel} style={{ color: cat.color }}>{cat.title}</span>
                  <span className={styles.sunnyShop} style={{ background: cat.color }}>Shop →</span>
                </div>
                <div className={styles.sunnyBorder} style={{ background: cat.color }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMO SLIDER ── */}
      {promoBanners.length > 0 && (
        <section className={styles.promoSection}>
          <div className="container">
            <div className={styles.promoSlider}>
              {promoBanners.map((promo, i) => (
                <Link
                  key={promo.id || i}
                  href={promo.buttonLink || '/products'}
                  className={`${styles.promoCard} ${i === promoIndex ? styles.promoActive : styles.promoHidden}`}
                >
                  <div className={styles.promoImageWrap}>
                    {promo.image?.url
                      ? <img src={promo.image.url} alt={promo.title} className={styles.promoImage} />
                      : <div className={styles.promoPlaceholder}><span>{promo.emoji || '🎁'}</span></div>
                    }
                    {promo.offer && (
                      <div className={styles.promoBadge} style={{ background: promo.color || '#FF6B35' }}>
                        <span className={styles.promoBadgeText}>{promo.offer}</span>
                        <span className={styles.promoBadgeOff}>OFF</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.promoInfo}>
                    <h3 className={styles.promoTitle}>{promo.title}</h3>
                    {promo.subtitle && <p className={styles.promoSubtitle}>{promo.subtitle}</p>}
                    <span className={styles.promoBtn}>{promo.buttonText || 'Shop Now'} →</span>
                  </div>
                </Link>
              ))}
              {promoBanners.length > 1 && (
                <div className={styles.promoDots}>
                  {promoBanners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPromoIndex(i)}
                      className={`${styles.promoDot} ${i === promoIndex ? styles.promoDotActive : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── GENDER SECTION ── */}
      <section className={styles.genderSection}>
        <div className="container">
          <div className={styles.genderHeader}>
            <span className={styles.sectionLabel}>Shop By Style</span>
            <h2 className={styles.sectionTitle}>Shop by Style 👗👕</h2>
            <p className={styles.sectionSub}>Find perfect picks for every little one</p>
          </div>
          <div className={styles.genderGrid}>
            {genderItems.map((item, i) => (
              <Link key={i} href={item.link} className={styles.genderCard} style={{ '--gender-color': item.color }}>
                <div className={styles.genderImgWrap}>
                  {item.image
                    ? <img src={item.image} alt={item.title} className={styles.genderImg} />
                    : <div className={styles.genderPlaceholder} style={{ background: item.bg }}><span className={styles.genderEmoji}>{item.emoji}</span></div>
                  }
                  <div className={styles.genderCorner} style={{ background: item.color }} />
                </div>
                <div className={styles.genderInfo}>
                  <h3 className={styles.genderTitle}>{item.title}</h3>
                  <p className={styles.genderSub}>{item.subtitle}</p>
                  <span className={styles.genderBtn} style={{ background: item.color }}>Shop Now →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── MATERNITY ── */}
      <MaternitySection banners={maternityBanners} />

      {/* ── PERSONAL CARE ── */}
      <PersonalCareSection banners={personalCareBanners} />

      {/* ── HEALTH CARE ── */}
      <HealthCareSection banners={healthCareBanners} />

      {/* ── OFFER BANNERS ── */}
      <section className={`${styles.offerSection} container`}>
        <div className={styles.offerGrid}>
          {offerBanners.map((offer, i) => (
            <Link
              key={i}
              href={offer.link}
              className={styles.offerCard}
              style={{
                background: offer.bg,
                borderColor: offer.borderColor,
                animationDelay: `${i * 0.12}s`,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div className={styles.offerImgWrap}>
                <img src={offer.image} alt={offer.title} className={styles.offerImg} />
                <div
                  className={styles.offerImgOverlay}
                  style={{ background: `linear-gradient(to top, ${offer.iconBg}99 0%, transparent 60%)` }}
                />
              </div>
              <div className={styles.offerContent}>
                <h3>{offer.title}</h3>
                <p>{offer.subtitle}</p>
                <span className={styles.offerArrow} style={{ color: 'white' }}>Shop Now →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      {featured?.length > 0 && (
        <section className={`${styles.section} container`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionLabel}>Handpicked</span>
              <h2 className={styles.sectionTitle}>⭐ Featured Products</h2>
              <p className={styles.sectionSub}>Handpicked just for you</p>
            </div>
            <Link href="/products?featured=true" className={styles.viewAll}>View All →</Link>
          </div>
          <div className="products-grid">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── TRENDING ── */}
      {trending?.length > 0 && (
        <section className={`${styles.section} container`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionLabel}>This Week</span>
              <h2 className={styles.sectionTitle}>🔥 Trending Now</h2>
              <p className={styles.sectionSub}>What parents are buying this week</p>
            </div>
            <Link href="/products?trending=true" className={styles.viewAll}>View All →</Link>
          </div>
          <div className="products-grid">
            {trending.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaShape1} />
          <div className={styles.ctaShape2} />
          <div className={styles.ctaShape3} />
          <div className="container">
            <div className={styles.ctaContent}>
              <div className={styles.ctaText}>
                <span className={styles.ctaTag}>🎁 Special Offer</span>
                <h2>Get 10% Off Your First Order!</h2>
                <p>Sign up now and unlock exclusive deals, early access to sales, and personalised recommendations.</p>
                <div className={styles.ctaActions}>
                  <Link href="/register" className={`btn btn-primary ${styles.ctaPrimaryBtn}`}>Create Free Account →</Link>
                  <Link href="/products" className={styles.ctaLink}>Browse Products ↗</Link>
                </div>
              </div>
              <div className={styles.ctaVisual}>
                <div style={{ position: 'relative', width: '320px', height: '380px', flexShrink: 0 }}>
                  <div style={{ width: '260px', height: '340px', borderRadius: '24px', overflow: 'hidden', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '4px solid rgba(255,255,255,0.3)' }}>
                    <img
                      src="https://images.unsplash.com/photo-1519689680058-324335c77eba?w=520&h=680&fit=crop&auto=format"
                      alt="Happy Baby"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(255,107,53,0.3) 0%, transparent 60%)' }} />
                  </div>

                  <div style={{ position: 'absolute', top: '16px', left: '0', background: 'white', borderRadius: '14px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'badgeFloat 3s ease-in-out infinite' }}>
                    <span style={{ fontSize: '1.4rem' }}>🧸</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.70rem', fontWeight: '700', color: '#FF6B35' }}>12k+</p>
                      <p style={{ margin: 0, fontSize: '0.62rem', color: '#888', fontWeight: '500' }}>Happy Families</p>
                    </div>
                  </div>

                  <div style={{ position: 'absolute', bottom: '10px', right: '0', background: 'white', borderRadius: '14px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'badgeFloat 3s ease-in-out infinite 1.5s' }}>
                    <span style={{ fontSize: '1.4rem' }}>⭐</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.70rem', fontWeight: '700', color: '#7B2FBE' }}>4.9 Rating</p>
                      <p style={{ margin: 0, fontSize: '0.62rem', color: '#888', fontWeight: '500' }}>500+ Reviews</p>
                    </div>
                  </div>

                  <div style={{ position: 'absolute', top: '80px', right: '0', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '2px solid rgba(255,255,255,0.3)', animation: 'badgeFloat 4s ease-in-out infinite 0.5s' }}>
                    🍼
                  </div>

                  <div style={{ position: 'absolute', bottom: '80px', left: '0', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '2px solid rgba(255,255,255,0.3)', animation: 'badgeFloat 4s ease-in-out infinite 2s' }}>
                    🎀
                  </div>
                </div>

                <style>{`
                  @keyframes badgeFloat {
                    0%, 100% { transform: translateY(0); }
                    50%       { transform: translateY(-8px); }
                  }
                `}</style>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}