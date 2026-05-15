'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import styles from './ProductCard.module.css';

/* ── baby accent per category — all 9 required categories ── */
const CATEGORY_ACCENTS = {
  'clothing':          { color: '#FF6B35', emoji: '👗', pastel: '#FFF2EB' },
  'personal-care':     { color: '#7B2FBE', emoji: '🧴', pastel: '#F3E8FF' },
  'personal':          { color: '#7B2FBE', emoji: '🧴', pastel: '#F3E8FF' },
  'health-care':       { color: '#0EA5E9', emoji: '💊', pastel: '#E0F2FE' },
  'health':            { color: '#0EA5E9', emoji: '💊', pastel: '#E0F2FE' },
  'baby-gear':         { color: '#10B981', emoji: '🎒', pastel: '#ECFDF5' },
  'baby':              { color: '#10B981', emoji: '🎒', pastel: '#ECFDF5' },
  'walkers':           { color: '#F59E0B', emoji: '🚶', pastel: '#FFFBEB' },
  'walker':            { color: '#F59E0B', emoji: '🚶', pastel: '#FFFBEB' },
  'toys':              { color: '#EF4444', emoji: '🎠', pastel: '#FEF2F2' },
  'toy':               { color: '#EF4444', emoji: '🎠', pastel: '#FEF2F2' },
  'cradles-cribs':     { color: '#8B5CF6', emoji: '🛏️', pastel: '#EDE9FE' },
  'cradles':           { color: '#8B5CF6', emoji: '🛏️', pastel: '#EDE9FE' },
  'cribs':             { color: '#8B5CF6', emoji: '🛏️', pastel: '#EDE9FE' },
  'electric-vehicles': { color: '#059669', emoji: '🚗', pastel: '#ECFDF5' },
  'electric':          { color: '#059669', emoji: '🚗', pastel: '#ECFDF5' },
  'food':              { color: '#F97316', emoji: '🍎', pastel: '#FFF7ED' },
  'default':           { color: '#FF6B35', emoji: '🎁', pastel: '#FFF2EB' },
};

/* ── Get accent by slug first, then name ── */
function getCategoryAccent(categoryName = '', categorySlug = '') {
  // Try exact slug match first
  if (categorySlug) {
    if (CATEGORY_ACCENTS[categorySlug]) return CATEGORY_ACCENTS[categorySlug];
    // Try partial slug match
    for (const [k, v] of Object.entries(CATEGORY_ACCENTS)) {
      if (k === 'default') continue;
      if (categorySlug.includes(k) || k.includes(categorySlug)) return v;
    }
  }
  // Try name match
  if (categoryName) {
    const key = categoryName.toLowerCase().replace(/\s+/g, '-');
    if (CATEGORY_ACCENTS[key]) return CATEGORY_ACCENTS[key];
    for (const [k, v] of Object.entries(CATEGORY_ACCENTS)) {
      if (k === 'default') continue;
      if (key.includes(k) || k.includes(key)) return v;
    }
  }
  return CATEGORY_ACCENTS.default;
}

/* ── Skeleton loader ── */
export function ProductCardSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonBody}>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineFull}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineMid}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineBtn}`} />
      </div>
    </div>
  );
}

export default function ProductCard({ product }) {
  const { addItem, addToCart } = useCart();
  const { toggle, isWishlisted, isInWishlist } = useWishlist();

  const cardRef = useRef(null);
  const [tilt,        setTilt]        = useState({ x: 0, y: 0 });
  const [isHovered,   setHovered]     = useState(false);
  const [imgParallax, setImgParallax] = useState({ x: 0, y: 0 });
  const [imgLoaded,   setImgLoaded]   = useState(false);
  const [cartAdding,  setCartAdding]  = useState(false);

  if (!product) return null;

  // Support both isWishlisted and isInWishlist
  const inWishlist = isWishlisted
    ? isWishlisted(product.id)
    : isInWishlist
      ? isInWishlist(product.id)
      : false;

  const imageUrl = product.images?.[0]?.url || null;

  // ✅ Use slug first, then name
  const accent = getCategoryAccent(
    product.category?.name || '',
    product.category?.slug || ''
  );

  /* ── 3D tilt handler ── */
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;
    const y = (e.clientY - top)  / height - 0.5;
    setTilt({ x: y * -14, y: x * 14 });
    setImgParallax({ x: x * 12, y: y * 12 });
  };

  const handleMouseEnter = () => setHovered(true);

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
    setImgParallax({ x: 0, y: 0 });
  };

  /* ── Add to cart ── */
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (cartAdding || product.stock === 0) return;
    setCartAdding(true);

    const addFn = addItem || addToCart;
    addFn({ ...product, quantity: 1 });

    toast.success(
      <span>Added to cart! 🛒</span>,
      {
        style: {
          background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
          color: 'white',
          fontWeight: 700,
          borderRadius: 999,
          padding: '12px 20px',
          fontSize: '0.9rem',
        },
        icon: null,
        duration: 2000,
      }
    );
    setTimeout(() => setCartAdding(false), 1200);
  };

  /* ── Wishlist ── */
  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    toggle(product);

    if (inWishlist) {
      toast('Removed from wishlist 💔', { duration: 1500 });
    } else {
      toast.success('Saved to wishlist ❤️', {
        style: {
          background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
          color: 'white',
          fontWeight: 700,
          borderRadius: 999,
        },
        icon: null,
        duration: 1800,
      });
    }
  };

  const discount = product.discountPercent > 0
    ? product.discountPercent
    : product.discountPrice && product.price
      ? Math.round((1 - product.discountPrice / product.price) * 100)
      : 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className={`${styles.card} ${isHovered ? styles.cardHovered : ''}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        '--accent':        accent.color,
        '--accent-pastel': accent.pastel,
        transform: isHovered
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-10px) scale(1.02)`
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)',
      }}
    >
      {/* Gloss layer */}
      <div className={styles.gloss} />

      {/* ── IMAGE AREA ── */}
      <div
        className={styles.imageWrap}
        style={{ background: accent.pastel }}
      >
        <div className={styles.dotPattern} />

        <div
          className={styles.imageInner}
          style={{
            transform: isHovered
              ? `translate(${imgParallax.x}px, ${imgParallax.y}px) scale(1.06)`
              : 'translate(0,0) scale(1)',
          }}
        >
          {imageUrl ? (
            <>
              {!imgLoaded && (
                <div className={styles.imgSkeleton}>
                  <span className={styles.imgSkeletonEmoji}>{accent.emoji}</span>
                </div>
              )}
              <Image
                src={imageUrl}
                alt={product.name}
                width={320}
                height={320}
                className={`${styles.image} ${imgLoaded ? styles.imageVisible : styles.imageHidden}`}
                style={{ objectFit: 'cover' }}
                onLoad={() => setImgLoaded(true)}
              />
            </>
          ) : (
            <div className={styles.noImage}>
              <span className={styles.noImageEmoji}>{accent.emoji}</span>
              <p>No Image</p>
            </div>
          )}
        </div>

        {/* Shine sweep */}
        <div className={`${styles.shine} ${isHovered ? styles.shineActive : ''}`} />

        {/* Badges */}
        <div className={styles.badges}>
          {discount > 0 && (
            <span className={styles.badgeDiscount}>-{discount}%</span>
          )}
          {product.isTrending && (
            <span className={styles.badgeTrending}>🔥 Hot</span>
          )}
          {product.isFeatured && (
            <span className={styles.badgeFeatured}>⭐ Top Pick</span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          className={`${styles.wishBtn} ${inWishlist ? styles.wishActive : ''}`}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          type="button"
        >
          <span className={styles.wishIcon}>{inWishlist ? '❤️' : '🤍'}</span>
          <span className={styles.wishRipple} />
        </button>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className={styles.oos}>
            <span>Out of Stock</span>
          </div>
        )}

        {/* Category emoji */}
        <span className={styles.catEmoji}>{accent.emoji}</span>

        {/* Accent glow */}
        <div
          className={`${styles.imgGlow} ${isHovered ? styles.imgGlowActive : ''}`}
          style={{ '--accent': accent.color }}
        />
      </div>

      {/* ── INFO AREA ── */}
      <div className={styles.info}>
        {/* Gradient separator */}
        <div
          className={styles.separator}
          style={{
            background: `linear-gradient(90deg, ${accent.color}60, #7B2FBE40, transparent)`
          }}
        />

        {/* Category label */}
        <p className={styles.category} style={{ color: accent.color }}>
          {product.category?.name || 'Baby Products'}
        </p>

        {/* Product name */}
        <h3 className={styles.name}>{product.name}</h3>

        {/* Short description */}
        {product.shortDescription && (
          <p className={styles.desc}>{product.shortDescription}</p>
        )}

        {/* Price row */}
        <div className={styles.priceRow}>
          <span
            className={styles.price}
            style={{ '--accent': accent.color, '--purple': '#7B2FBE' }}
          >
            ₹{product.discountPrice || product.price}
          </span>

          {product.discountPrice && product.discountPrice < product.price && (
            <span className={styles.priceOld}>₹{product.price}</span>
          )}

          {discount > 0 && (
            <span className={styles.saveBadge}>{discount}% off</span>
          )}
        </div>

        {/* Rating */}
        {product.rating > 0 && (
          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map(s => (
                <span
                  key={s}
                  className={
                    s <= Math.round(product.rating)
                      ? styles.starOn
                      : styles.starOff
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <span className={styles.ratingCount}>
              ({product.numReviews || 0})
            </span>
          </div>
        )}

        {/* Low stock warning */}
        {product.stock > 0 && product.stock <= 10 && (
          <p className={styles.lowStock}>
            Only {product.stock} left!
          </p>
        )}

        {/* Add to Cart button */}
        <button
          className={`
            ${styles.cartBtn}
            ${product.stock === 0 ? styles.cartDisabled : ''}
            ${cartAdding ? styles.cartAdding : ''}
          `}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          type="button"
          style={
            product.stock > 0
              ? {
                  '--accent': accent.color,
                  background: `linear-gradient(135deg, ${accent.color} 0%, #7B2FBE 100%)`,
                }
              : {}
          }
        >
          <span className={styles.cartInner}>
            <span
              className={`${styles.cartIcon} ${cartAdding ? styles.cartIconSpin : ''}`}
            >
              {cartAdding
                ? '✓'
                : product.stock === 0
                  ? '✕'
                  : '🛒'}
            </span>
            <span className={styles.cartLabel}>
              {cartAdding
                ? 'Added!'
                : product.stock === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'}
            </span>
          </span>
          <span
            className={`${styles.cartShine} ${isHovered ? styles.cartShineActive : ''}`}
          />
        </button>
      </div>
    </Link>
  );
}