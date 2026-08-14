'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import styles from './ProductCard.module.css';

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

function getCategoryAccent(categoryName = '', categorySlug = '') {
  if (categorySlug) {
    if (CATEGORY_ACCENTS[categorySlug]) return CATEGORY_ACCENTS[categorySlug];
    for (const [k, v] of Object.entries(CATEGORY_ACCENTS)) {
      if (k === 'default') continue;
      if (categorySlug.includes(k) || k.includes(categorySlug)) return v;
    }
  }
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

export function ProductCardSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonImage} />
      <div className={styles.skeletonBody}>
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

  const [imgLoaded,  setImgLoaded]  = useState(false);
  const [cartAdding, setCartAdding] = useState(false);

  if (!product) return null;

  const inWishlist = isWishlisted
    ? isWishlisted(product.id)
    : isInWishlist
      ? isInWishlist(product.id)
      : false;

  // ✅ Smart image resolver (checks color variants too)
  const getProductImage = () => {
    if (product.images?.[0]?.url) return product.images[0].url;
    if (product.hasVariants && product.colorVariants?.length > 0) {
      for (const variant of product.colorVariants) {
        if (variant.images?.[0]?.url) return variant.images[0].url;
      }
    }
    return null;
  };

  // ✅ Smart price resolver
  const getProductPrice = () => {
    if (product.hasVariants && product.colorVariants?.length > 0) {
      const firstVariant = product.colorVariants[0];
      return {
        price:         firstVariant.price         ?? product.price,
        discountPrice: firstVariant.discountPrice ?? product.discountPrice,
      };
    }
    return {
      price:         product.price,
      discountPrice: product.discountPrice,
    };
  };

  const imageUrl = getProductImage();
  const { price: displayPrice, discountPrice: displayDiscountPrice } = getProductPrice();

  const accent = getCategoryAccent(
    product.category?.name || '',
    product.category?.slug || ''
  );

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartAdding || product.stock === 0) return;
    setCartAdding(true);
    const addFn = addItem || addToCart;
    addFn({ ...product, quantity: 1 });
    toast.success('Added to cart! 🛒', {
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
    });
    setTimeout(() => setCartAdding(false), 1200);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
    if (inWishlist) {
      toast('Removed from wishlist 💔', { duration: 1500 });
    } else {
      toast.success('Saved ❤️', {
        style: {
          background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
          color: 'white',
          fontWeight: 700,
          borderRadius: 999,
        },
        icon: null,
        duration: 1500,
      });
    }
  };

  const discount = product.discountPercent > 0
    ? product.discountPercent
    : displayDiscountPrice && displayPrice
      ? Math.round((1 - displayDiscountPrice / displayPrice) * 100)
      : 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className={styles.card}
      style={{
        '--accent':        accent.color,
        '--accent-pastel': accent.pastel,
      }}
    >

      {/* ═══ IMAGE ═══ */}
      <div className={styles.imageWrap} style={{ background: accent.pastel }}>
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
              width={240}
              height={240}
              className={`${styles.image} ${imgLoaded ? styles.imageVisible : styles.imageHidden}`}
              style={{ objectFit: 'cover' }}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className={styles.noImage}>
            <span className={styles.noImageEmoji}>{accent.emoji}</span>
          </div>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <span className={styles.badgeDiscount}>-{discount}%</span>
        )}

        {/* Wishlist button */}
        <button
          className={`${styles.wishBtn} ${inWishlist ? styles.wishActive : ''}`}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          type="button"
        >
          <span className={styles.wishIcon}>{inWishlist ? '❤️' : '🤍'}</span>
        </button>

        {/* OOS Overlay */}
        {product.stock === 0 && (
          <div className={styles.oos}>
            <span>Out of Stock</span>
          </div>
        )}
      </div>

      {/* ═══ INFO — COMPACT ═══ */}
      <div className={styles.info}>

        {/* Title */}
        <h3 className={styles.name} title={product.name}>
          {product.name}
        </h3>

        {/* Prices */}
        <div className={styles.priceRow}>
          <span className={styles.price}>
            ₹{Math.round(displayDiscountPrice || displayPrice)?.toLocaleString('en-IN')}
          </span>

          {displayDiscountPrice && displayDiscountPrice < displayPrice && (
            <span className={styles.priceOld}>
              ₹{Math.round(displayPrice)?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
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
                  background: `linear-gradient(135deg, ${accent.color} 0%, #7B2FBE 100%)`,
                }
              : {}
          }
        >
          <span className={styles.cartInner}>
            <span className={`${styles.cartIcon} ${cartAdding ? styles.cartIconSpin : ''}`}>
              {cartAdding ? '✓' : product.stock === 0 ? '✕' : '🛒'}
            </span>
            <span className={styles.cartLabel}>
              {cartAdding ? 'Added!' : product.stock === 0 ? 'Out' : 'Add'}
            </span>
          </span>
        </button>
      </div>
    </Link>
  );
}