'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useLocation } from '@/context/LocationContext';
import toast from 'react-hot-toast';
import styles from './ProductCard.module.css';

const BABY_FOOD_CATEGORY_ID = '6a5473f71736df8447776561';

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
  'baby-food':         { color: '#F97316', emoji: '🍼', pastel: '#FFF7ED' },
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

function isFoodProduct(product) {
  const catId = String(product.categoryId || product.category?.id || product.category?._id || product.category || '');
  const catSlug = (product.category?.slug || product.categorySlug || '').toLowerCase();
  const catName = (product.category?.name || product.categoryName || (typeof product.category === 'string' ? product.category : '')).toLowerCase();
  const foodCat = (product.foodCategory || '').toLowerCase();

  return (
    product.isFood === true ||
    catId === BABY_FOOD_CATEGORY_ID ||
    catSlug.includes('food') ||
    catName.includes('food') ||
    catSlug.includes('baby-food') ||
    catName.includes('baby food') ||
    Boolean(foodCat)
  );
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

  // ✅ Location Context for Guntur discount detection
  const locationCtx = useLocation();
  const isGuntur = locationCtx?.isGuntur || false;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [cartAdding, setCartAdding] = useState(false);

  if (!product) return null;

  const inWishlist = isWishlisted
    ? isWishlisted(product.id)
    : isInWishlist
      ? isInWishlist(product.id)
      : false;

  const getProductImage = () => {
    if (product.images?.[0]?.url) return product.images[0].url;
    if (product.hasVariants && product.colorVariants?.length > 0) {
      for (const variant of product.colorVariants) {
        if (variant.images?.[0]?.url) return variant.images[0].url;
      }
    }
    return null;
  };

  const getProductPrice = () => {
    if (product.hasVariants && product.colorVariants?.length > 0) {
      const firstVariant = product.colorVariants[0];
      return {
        price: firstVariant.price ?? product.price,
        discountPrice: firstVariant.discountPrice ?? product.discountPrice,
      };
    }
    return {
      price: product.price,
      discountPrice: product.discountPrice,
    };
  };

  const imageUrl = getProductImage();
  const { price: displayPrice, discountPrice: displayDiscountPrice } = getProductPrice();

  const isFood = isFoodProduct(product);
  const hasGunturDiscount = isGuntur && isFood;

  const standardActivePrice = displayDiscountPrice || displayPrice;
  const finalPrice = hasGunturDiscount ? Math.round(standardActivePrice * 0.9) : standardActivePrice;

  const showOldPrice = hasGunturDiscount
    ? (displayPrice > finalPrice ? displayPrice : (standardActivePrice > finalPrice ? standardActivePrice : null))
    : (displayDiscountPrice && displayDiscountPrice < displayPrice ? displayPrice : null);

  const discountPercent = displayPrice > finalPrice
    ? Math.round(((displayPrice - finalPrice) / displayPrice) * 100)
    : 0;

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

    const categorySlug = product.category?.slug || product.categorySlug || (typeof product.category === 'string' ? product.category : '');
    const categoryName = product.category?.name || product.categoryName || '';
    const categoryId = product.categoryId || product.category?.id || product.category?._id || '';

    addFn({
      ...product,
      quantity: 1,
      categorySlug,
      categoryName,
      categoryId,
      foodCategory: product.foodCategory || null,
      category: categorySlug || categoryName || product.category,
      isFood,
    });

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

  return (
    <Link
      href={`/products/${product.id}`}
      className={styles.card}
      style={{
        '--accent': accent.color,
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
              unoptimized={true} // ✅ Bypasses Next.js image server, delivers from Cloudflare CDN directly
              loading="lazy"
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

        {/* Guntur Special or Standard Discount Badge */}
        {hasGunturDiscount ? (
          <span
            className={styles.badgeDiscount}
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
              fontSize: '0.72rem',
              fontWeight: '900',
            }}
          >
            🎉 -{discountPercent}% GUNTUR
          </span>
        ) : discountPercent > 0 ? (
          <span className={styles.badgeDiscount}>-{discountPercent}%</span>
        ) : null}

        <button
          className={`${styles.wishBtn} ${inWishlist ? styles.wishActive : ''}`}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          type="button"
        >
          <span className={styles.wishIcon}>{inWishlist ? '❤️' : '🤍'}</span>
        </button>

        {product.stock === 0 && (
          <div className={styles.oos}>
            <span>Out of Stock</span>
          </div>
        )}
      </div>

      {/* ═══ INFO ═══ */}
      <div className={styles.info}>
        <h3 className={styles.name} title={product.name}>
          {product.name}
        </h3>

        <div className={styles.priceRow}>
          <span className={styles.price}>
            ₹{Math.round(finalPrice)?.toLocaleString('en-IN')}
          </span>

          {showOldPrice && (
            <span className={styles.priceOld}>
              ₹{Math.round(showOldPrice)?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

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