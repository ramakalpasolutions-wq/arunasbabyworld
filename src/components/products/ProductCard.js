'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import styles from './ProductCard.module.css';

/* ── baby accent per category ── */
const CATEGORY_ACCENTS = {
  clothing:  { color: '#FF6B35', emoji: '👕', pastel: '#FFF2EB' },
  toys:      { color: '#7B2FBE', emoji: '🧸', pastel: '#F3E8FF' },
  feeding:   { color: '#22C55E', emoji: '🍼', pastel: '#ECFDF5' },
  nursery:   { color: '#0EA5E9', emoji: '🛏️', pastel: '#E0F2FE' },
  health:    { color: '#F59E0B', emoji: '🏥', pastel: '#FFFBEB' },
  maternity: { color: '#EC4899', emoji: '🤰', pastel: '#FDF2F8' },
  default:   { color: '#FF6B35', emoji: '🎁', pastel: '#FFF2EB' },
};

function getCategoryAccent(categoryName = '') {
  const key = categoryName.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_ACCENTS)) {
    if (key.includes(k)) return v;
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
  // ✅ Both function names work — using the ones that exist
  const { addItem, addToCart } = useCart();
  const { toggle, isWishlisted, isInWishlist } = useWishlist();

  const cardRef = useRef(null);
  const [tilt, setTilt]               = useState({ x: 0, y: 0 });
  const [isHovered, setHovered]       = useState(false);
  const [imgParallax, setImgParallax] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded]     = useState(false);
  const [cartAdding, setCartAdding]   = useState(false);

  if (!product) return null;

  // ✅ Support both isWishlisted and isInWishlist
  const inWishlist = isWishlisted
    ? isWishlisted(product.id)
    : isInWishlist
      ? isInWishlist(product.id)
      : false;

  const imageUrl = product.images?.[0]?.url || null;
  const accent   = getCategoryAccent(product.category?.name);

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

  /* ── cart — stops event bubbling ── */
  const handleAddToCart = (e) => {
    // ✅ Stop click from going to product page
    e.preventDefault();
    e.stopPropagation();

    if (cartAdding || product.stock === 0) return;
    setCartAdding(true);

    // ✅ Use whichever function exists
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

  /* ── wishlist — stops event bubbling ── */
  const handleWishlist = (e) => {
    // ✅ Stop click from going to product page
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
      {/* ── gloss layer ── */}
      <div className={styles.gloss} />

      {/* ── IMAGE AREA ── */}
      <div
        className={styles.imageWrap}
        style={{ background: accent.pastel }}
      >
        {/* Dot pattern */}
        <div className={styles.dotPattern} />

        {/* Product image with parallax */}
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

        {/* ✅ Wishlist button — e.stopPropagation() added */}
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

        {/* ✅ Add to Cart button — e.stopPropagation() added */}
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