'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);

  // ✅ Get image URL from Cloudinary
  const imageUrl = product.images?.[0]?.url || null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
    toast.success('Added to cart! 🛒');
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist ❤️');
    }
  };

  return (
    <Link href={`/products/${product.id}`} className={styles.card}>
      {/* ===== IMAGE ===== */}
      <div className={styles.imageWrap}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            width={300}
            height={300}
            className={styles.image}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className={styles.noImage}>
            <span>📦</span>
            <p>No Image</p>
          </div>
        )}

        {/* Badges */}
        <div className={styles.badges}>
          {product.discountPercent > 0 && (
            <span className={styles.discountBadge}>
              -{product.discountPercent}%
            </span>
          )}
          {product.isTrending && (
            <span className={styles.trendingBadge}>🔥 Trending</span>
          )}
          {product.isFeatured && (
            <span className={styles.featuredBadge}>⭐ Featured</span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className={`${styles.wishlistBtn} ${inWishlist ? styles.wishlisted : ''}`}
          onClick={handleWishlist}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {inWishlist ? '❤️' : '🤍'}
        </button>
      </div>

      {/* ===== INFO ===== */}
      <div className={styles.info}>
        <p className={styles.category}>
          {product.category?.name || 'Baby Products'}
        </p>
        <h3 className={styles.name}>{product.name}</h3>

        {product.shortDescription && (
          <p className={styles.desc}>{product.shortDescription}</p>
        )}

        {/* Price */}
        <div className={styles.priceRow}>
          <span className={styles.price}>
            ₹{product.discountPrice || product.price}
          </span>
          {product.discountPrice && (
            <span className={styles.originalPrice}>
              ₹{product.price}
            </span>
          )}
        </div>

        {/* Rating */}
        {product.rating > 0 && (
          <div className={styles.rating}>
            {'⭐'.repeat(Math.round(product.rating))}
            <span>({product.numReviews})</span>
          </div>
        )}

        {/* Add to Cart */}
        <button
          className={styles.cartBtn}
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </Link>
  );
}