'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import HeroBanner from '@/components/home/HeroBanner';
import ProductCard from '@/components/products/ProductCard';
import useScrollReveal from '@/hooks/useScrollReveal';
import styles from './HomeClient.module.css';

const defaultCategories = [
  { _id: 'c1', name: 'Clothing', icon: '👕', color: '#ff6b9d', slug: 'clothing' },
  { _id: 'c2', name: 'Toys & Games', icon: '🧸', color: '#7c3aed', slug: 'toys-games' },
  { _id: 'c3', name: 'Baby Gear', icon: '🍼', color: '#0ea5e9', slug: 'baby-gear' },
  { _id: 'c4', name: 'Feeding', icon: '🥛', color: '#10b981', slug: 'feeding' },
  { _id: 'c5', name: 'Health & Safety', icon: '🏥', color: '#f59e0b', slug: 'health-safety' },
  { _id: 'c6', name: 'Nursery', icon: '🛏️', color: '#ef4444', slug: 'nursery' },
];

const defaultBudgetItems = [
  { price: 299, emoji: '🎀', color: '#ff6b9d', offer: 'Under' },
  { price: 599, emoji: '🧸', color: '#7c3aed', offer: 'Under' },
  { price: 799, emoji: '🍼', color: '#0ea5e9', offer: 'Under' },
  { price: 999, emoji: '🎁', color: '#10b981', offer: 'Under' },
];

const defaultSunnyItems = [
  { title: 'Tops', slug: 'tops', emoji: '👕', image: null },
  { title: 'T-Shirts', slug: 't-shirts', emoji: '👚', image: null },
  { title: 'Sets & Suits', slug: 'sets-suits', emoji: '🩱', image: null },
  { title: 'Shirts', slug: 'shirts', emoji: '🧥', image: null },
];

const offerBanners = [
  { title: '🎀 New Born Essentials', subtitle: 'Everything your newborn needs', link: '/products?category=clothing', bg: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' },
  { title: '🏆 Best Sellers', subtitle: 'Most loved by parents', link: '/products?featured=true', bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' },
  { title: '⚡ Flash Sale', subtitle: 'Up to 60% off today only!', link: '/products', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)' },
];

const defaultGenderItems = [
  { gender: 'girl', title: 'For Her 👧', subtitle: 'Cute & stylish picks for girls', link: '/products?search=girl', image: null, color: '#ff6b9d', bg: 'linear-gradient(135deg, #fce7f3, #ff6b9d)' },
  { gender: 'boy', title: 'For Him 👦', subtitle: 'Cool & fun picks for boys', link: '/products?search=boy', image: null, color: '#0ea5e9', bg: 'linear-gradient(135deg, #e0f2fe, #0ea5e9)' },
];

const topBrands = [
  { name: 'Mothercare', color: '#ff6b9d' },
  { name: 'Babyhug', color: '#7c3aed' },
  { name: 'Ed-a-Mamma', color: '#10b981' },
  { name: 'Gini & Jony', color: '#0ea5e9' },
  { name: 'Chicco', color: '#f59e0b' },
  { name: 'Mee Mee', color: '#ef4444' },
  { name: 'Himalaya Baby', color: '#22c55e' },
  { name: 'Mamaearth', color: '#14b8a6' },
  { name: 'Fisher-Price', color: '#8b5cf6' },
  { name: 'Funskool', color: '#ec4899' },
];

// ✅ Reusable Special Section Component
function SpecialSection({ cat }) {
  if (!cat) return null;
  return (
    <div>
      {/* Long Banner */}
      {cat.banner?.url && (
        <section className={styles.longBannerSection}>
          <Link href={`/products?category=${cat.slug}`}>
            <div className={styles.longBanner} style={{ backgroundImage: `url(${cat.banner.url})` }}>
              <div className={styles.longBannerOverlay}>
                <h2 className={styles.longBannerTitle}>{cat.banner.title || cat.name}</h2>
                {(cat.banner.subtitle || cat.description) && (
                  <p className={styles.longBannerSub}>{cat.banner.subtitle || cat.description}</p>
                )}
                <span className={styles.longBannerBtn}>Shop Now →</span>
              </div>
            </div>
          </Link>
        </section>
      )}
      {/* Grid Images */}
      {cat.gridImages?.length > 0 && (
        <section className={styles.specialGrid}>
          <div className="container">
            <div className={styles.specialImgGrid}>
              {cat.gridImages.map((img, i) => (
                <Link key={i} href={`/products?category=${cat.slug}`} className={styles.specialImgCard}>
                  <img src={img.url} alt={img.title || `${cat.name} ${i + 1}`} className={styles.specialImg} />
                  <div className={styles.specialImgOverlay}>
                    <span>{img.title || 'Shop Now →'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function HomeClient({
  banners = [],
  budgetBanners = [],
  sunnyBanners = [],
  promoBanners = [],
  genderBanners = [],
  featured = [],
  trending = [],
  categories = [],
  maternityCats = [],
  personalCareCats = [],
  healthyCareCats = [],
}) {
  useScrollReveal();

  const [promoIndex, setPromoIndex] = useState(0);

  useEffect(() => {
    if (promoBanners.length <= 1) return;
    const timer = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promoBanners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [promoBanners.length]);

  const displayCategories = categories?.length > 0 ? categories : defaultCategories;

  const displayBudget = budgetBanners.length > 0
    ? budgetBanners.map(b => ({
        price: b.price || 299,
        emoji: b.emoji || '🎀',
        color: b.color || '#ff6b9d',
        offer: b.offer || 'Under',
        image: b.image?.url || null,
        link: b.buttonLink || `/products?maxPrice=${b.price}`,
      }))
    : defaultBudgetItems;

  const displaySunny = sunnyBanners.length > 0
    ? sunnyBanners.map(b => ({
        title: b.title,
        slug: b.slug || b.buttonLink?.replace('/products?category=', '') || b.title.toLowerCase(),
        emoji: b.emoji || '👕',
        image: b.image?.url || null,
      }))
    : defaultSunnyItems;

  const girlBanner = genderBanners.find(b => b.gender === 'girl') || defaultGenderItems[0];
  const boyBanner = genderBanners.find(b => b.gender === 'boy') || defaultGenderItems[1];

  const genderItems = [
    {
      ...defaultGenderItems[0],
      title: girlBanner.title || 'For Her 👧',
      subtitle: girlBanner.subtitle || 'Cute & stylish picks for girls',
      image: girlBanner.image?.url || null,
      link: girlBanner.buttonLink || '/products?search=girl',
      color: girlBanner.color || '#ff6b9d',
    },
    {
      ...defaultGenderItems[1],
      title: boyBanner.title || 'For Him 👦',
      subtitle: boyBanner.subtitle || 'Cool & fun picks for boys',
      image: boyBanner.image?.url || null,
      link: boyBanner.buttonLink || '/products?search=boy',
      color: boyBanner.color || '#0ea5e9',
    },
  ];

  return (
    <div className={styles.home}>

      {/* ===== HERO ===== */}
      <div className={styles.heroWrapper}>
        <HeroBanner banners={banners} />
      </div>

      {/* ===== TOP BRANDS ===== */}
      <section className={styles.brandSection}>
        <div className="container">
          <div className={styles.brandHeader}>
            <h2 className={styles.brandTitle}>🏷️ Top Brands</h2>
            <p className={styles.brandSub}>Shop from parents' favorite baby brands</p>
          </div>
        </div>
        <div className={styles.brandMarquee}>
          <div className={styles.brandTrack}>
            {topBrands.map((brand, i) => (
              <Link key={`a-${i}`} href={`/products?brand=${encodeURIComponent(brand.name)}`} className={styles.brandCard} style={{ '--brand-color': brand.color }}>
                <span className={styles.brandName}>{brand.name}</span>
              </Link>
            ))}
            {topBrands.map((brand, i) => (
              <Link key={`b-${i}`} href={`/products?brand=${encodeURIComponent(brand.name)}`} className={styles.brandCard} style={{ '--brand-color': brand.color }}>
                <span className={styles.brandName}>{brand.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BUDGET STORE ===== */}
      <section className={styles.budgetSection}>
        <div className={styles.budgetBg}>
          <div className={`container ${styles.budgetContent}`}>
            <div className={styles.budgetHeader}>
              <h2 className={styles.budgetTitle}>🏪 Budget Store</h2>
              <p className={styles.budgetSub}>Best deals under your budget!</p>
            </div>
            <div className={styles.budgetGrid}>
              {displayBudget.map((item, i) => (
                <Link
                  key={i}
                  href={item.link || `/products?maxPrice=${item.price}`}
                  className={styles.budgetCard}
                  style={{
                    '--card-color': item.color,
                    '--card-bg': `linear-gradient(135deg, ${item.color}15, ${item.color}30)`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  {item.image ? (
                    <img src={item.image} alt={`Under ₹${item.price}`} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '14px', border: `3px solid ${item.color}`, marginBottom: '4px' }} />
                  ) : (
                    <div className={styles.cardEmoji}>{item.emoji}</div>
                  )}
                  <div className={styles.cardLabel}>{item.offer}</div>
                  <div className={styles.cardPrice}>₹{item.price}</div>
                  <div className={styles.cardBtn}>Shop Now →</div>
                </Link>
              ))}
            </div>
          </div>
          <div className={styles.sandFloor} />
        </div>
      </section>

      {/* ===== SUNNY PLAY DAYS ===== */}
      <section className={styles.sunnySection}>
        <div className="container">
          <h2 className={styles.sunnyTitle}>☀️ Sunny Play Days</h2>
          <div className={styles.sunnyGrid}>
            {displaySunny.map((cat, i) => (
              <Link key={i} href={`/products?category=${cat.slug}`} className={styles.sunnyCard} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={styles.sunnyBg} />
                <div className={styles.sunnyLabel}>
                  <span>{cat.title}</span>
                  <span className={styles.sunnyChevron}>›</span>
                </div>
                <div className={styles.sunnyImg}>
                  {cat.image ? (
                    <img src={cat.image} alt={cat.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className={styles.sunnyEmoji}>{cat.emoji}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROMO OFFERS ===== */}
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
                    {promo.image?.url ? (
                      <img src={promo.image.url} alt={promo.title} className={styles.promoImage} />
                    ) : (
                      <div className={styles.promoPlaceholder}><span>{promo.emoji || '🎁'}</span></div>
                    )}
                    {promo.offer && (
                      <div className={styles.promoBadge} style={{ backgroundColor: promo.color || '#ff6b9d' }}>
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
                    <button key={i} onClick={() => setPromoIndex(i)} className={`${styles.promoDot} ${i === promoIndex ? styles.promoDotActive : ''}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===== GENDER SECTION ===== */}
      <section className={styles.genderSection}>
        <div className="container">
          <div className={styles.genderHeader}>
            <h2 className={styles.sectionTitle}>Shop by Style 👗👕</h2>
            <p className={styles.sectionSub}>Find perfect picks for every little one</p>
          </div>
          <div className={styles.genderGrid}>
            {genderItems.map((item, i) => (
              <Link key={i} href={item.link} className={styles.genderCard} style={{ '--gender-color': item.color }}>
                <div className={styles.genderImgWrap}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} className={styles.genderImg} />
                  ) : (
                    <div className={styles.genderPlaceholder} style={{ background: item.bg }}>
                      <span className={styles.genderEmoji}>{item.gender === 'girl' ? '👧' : '👦'}</span>
                    </div>
                  )}
                  <div className={styles.genderOverlay} />
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

      {/* ===== 🤰 MATERNITY SECTION ===== */}
      {maternityCats.length > 0 && maternityCats.map(cat => (
        <SpecialSection key={cat.id} cat={cat} />
      ))}

      {/* ===== 💄 WOMEN PERSONAL CARE SECTION ===== */}
      {personalCareCats.length > 0 && personalCareCats.map(cat => (
        <SpecialSection key={cat.id} cat={cat} />
      ))}

      {/* ===== 💊 HEALTHY CARE SECTION ===== */}
      {healthyCareCats.length > 0 && healthyCareCats.map(cat => (
        <SpecialSection key={cat.id} cat={cat} />
      ))}

      {/* ===== CATEGORIES ===== */}
      <section className={`${styles.section} container`}>
        <div className={`${styles.sectionHeader} reveal`}>
          <div>
            <h2 className={styles.sectionTitle}>Shop by Category</h2>
            <p className={styles.sectionSub}>Find everything your little one needs</p>
          </div>
          <Link href="/products" className={styles.viewAll}>View All →</Link>
        </div>
        <div className={styles.categoryGrid}>
          {displayCategories.slice(0, 8).map((cat, i) => (
            <Link
              key={cat.id || cat._id}
              href={`/products?category=${cat.slug || cat.name.toLowerCase()}`}
              className={`${styles.categoryCard} reveal`}
              style={{ animationDelay: `${i * 0.08}s`, '--cat-color': cat.color || '#ff6b9d' }}
            >
              <div className={styles.categoryIcon} style={{ background: `${cat.color}20` }}>
                {cat.image?.url ? <img src={cat.image.url} alt={cat.name} /> : <span>{cat.icon || '📦'}</span>}
              </div>
              <span className={styles.categoryName}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== OFFER BANNERS ===== */}
      <section className={`${styles.offerSection} container`}>
        <div className={styles.offerGrid}>
          {offerBanners.map((offer, i) => (
            <Link key={i} href={offer.link} className={`${styles.offerCard} reveal`} style={{ background: offer.bg, animationDelay: `${i * 0.1}s` }}>
              <h3>{offer.title}</h3>
              <p>{offer.subtitle}</p>
              <span className={styles.offerArrow}>Shop Now →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== FEATURED ===== */}
      {featured?.length > 0 && (
        <section className={`${styles.section} container`}>
          <div className={`${styles.sectionHeader} reveal`}>
            <div>
              <h2 className={styles.sectionTitle}>⭐ Featured Products</h2>
              <p className={styles.sectionSub}>Handpicked just for you</p>
            </div>
            <Link href="/products?featured=true" className={styles.viewAll}>View All →</Link>
          </div>
          <div className="products-grid reveal">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ===== TRENDING ===== */}
      {trending?.length > 0 && (
        <section className={`${styles.section} container`}>
          <div className={`${styles.sectionHeader} reveal`}>
            <div>
              <h2 className={styles.sectionTitle}>🔥 Trending Now</h2>
              <p className={styles.sectionSub}>What parents are buying this week</p>
            </div>
            <Link href="/products?trending=true" className={styles.viewAll}>View All →</Link>
          </div>
          <div className="products-grid reveal">
            {trending.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className={`${styles.ctaBanner} reveal`}>
        <div className="container">
          <div className={styles.ctaContent}>
            <div className={styles.ctaText}>
              <h2>🎁 Get 10% Off Your First Order!</h2>
              <p>Sign up now and unlock exclusive deals.</p>
              <div className={styles.ctaActions}>
                <Link href="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                  Create Free Account
                </Link>
                <Link href="/products" className={styles.ctaLink}>Browse Products →</Link>
              </div>
            </div>
            <div className={styles.ctaEmojis}>
              <span>👶</span><span>🧸</span><span>🍼</span><span>🎀</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}