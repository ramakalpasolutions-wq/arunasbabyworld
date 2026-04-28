'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import styles from './ProductDetailClient.module.css';

export default function ProductDetailClient({ id }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('description');
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className={`container ${styles.loading}`}>
      <div className={styles.skeletonLayout}>
        <div className={`skeleton ${styles.skeletonImages}`} />
        <div className={styles.skeletonInfo}>
          <div className={`skeleton ${styles.skeletonTitle}`} />
          <div className={`skeleton ${styles.skeletonPrice}`} />
          <div className={`skeleton ${styles.skeletonDesc}`} />
          <div className={`skeleton ${styles.skeletonBtn}`} />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className={`container ${styles.notFound}`}>
      <span>😕</span>
      <h2>Product not found</h2>
      <Link href="/products" className="btn btn-primary">
        Browse Products
      </Link>
    </div>
  );

  // ✅ Use all images for gallery
  const images = product.images?.length > 0
    ? product.images
    : [{ url: `https://via.placeholder.com/500x500?text=${encodeURIComponent(product.name)}` }];

  const finalPrice = product.discountPrice || product.price;
  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (product.stock === 0) return;
    addItem({ ...product, quantity });
    toast.success(`${product.name} added to cart!`, { icon: '🛒' });
  };

  // ✅ Use product.id instead of product._id
  const inWishlist = isWishlisted(product.id);

  const handleWishlist = () => {
    toggle(product);
    toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist! ❤️');
  };

  return (
    <div className={`container ${styles.page}`}>

      {/* ===== BREADCRUMB ===== */}
      <nav className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        {' / '}
        <Link href="/products">Products</Link>
        {' / '}
        {product.category && (
          <>
            {/* ✅ Use category.id instead of category._id */}
            <Link href={`/products?category=${product.category?.id}`}>
              {product.category.name}
            </Link>
            {' / '}
          </>
        )}
        <span>{product.name}</span>
      </nav>

      <div className={styles.layout}>

        {/* ===== IMAGES SECTION ===== */}
        <div className={styles.imagesSection}>
          {/* Main Image */}
          <div className={styles.mainImage}>
            <Image
              src={images[selectedImage]?.url || images[0]?.url}
              alt={product.name}
              width={500}
              height={500}
              className={styles.mainImg}
              style={{ objectFit: 'cover' }}
            />
            {discount > 0 && (
              <span className={styles.discountTag}>{discount}% OFF</span>
            )}
          </div>

          {/* ✅ Thumbnails - show ALL images */}
          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`${styles.thumbnail} ${i === selectedImage ? styles.activeThumbnail : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} ${i + 1}`}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Image count indicator */}
          {images.length > 1 && (
            <p className={styles.imageCount}>
              📸 {selectedImage + 1} / {images.length} images
            </p>
          )}
        </div>

        {/* ===== INFO SECTION ===== */}
        <div className={styles.infoSection}>

          {/* Category */}
          {product.category && (
            <Link
              href={`/products?category=${product.category?.id}`}
              className={styles.categoryLink}
            >
              {product.category.name}
            </Link>
          )}

          {/* Product Name */}
          <h1 className={styles.productName}>{product.name}</h1>

          {/* Rating */}
          {product.rating > 0 && (
            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map(s => (
                  <span
                    key={s}
                    style={{
                      color: s <= Math.round(product.rating)
                        ? '#f59e0b'
                        : '#e2e8f0',
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className={styles.reviewCount}>
                {product.rating.toFixed(1)} ({product.numReviews} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className={styles.priceSection}>
            <span className={styles.currentPrice}>
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
            {product.discountPrice && (
              <>
                <span className={styles.originalPrice}>
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className={styles.discountLabel}>
                  Save ₹{(product.price - finalPrice).toLocaleString('en-IN')}
                </span>
              </>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className={styles.shortDesc}>{product.shortDescription}</p>
          )}

          {/* Stock */}
          <div className={styles.stockInfo}>
            {product.stock > 0 ? (
              <span className={styles.inStock}>
                ✅ In Stock ({product.stock} available)
              </span>
            ) : (
              <span className={styles.outOfStock}>❌ Out of Stock</span>
            )}
          </div>

          {/* Quantity */}
          {product.stock > 0 && (
            <div className={styles.quantityRow}>
              <span>Quantity:</span>
              <div className={styles.quantityControl}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* ✅ Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={`btn btn-primary ${styles.addCartBtn}`}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              🛒 Add to Cart
            </button>
            {/* ✅ Fixed wishlist - using product.id */}
            <button
              className={`${styles.wishlistBtn} ${inWishlist ? styles.wishlisted : ''}`}
              onClick={handleWishlist}
            >
              {inWishlist ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Highlights */}
          <div className={styles.highlights}>
            <div className={styles.highlight}>
              <span>🚚</span> Free delivery on orders above ₹499
            </div>
            <div className={styles.highlight}>
              <span>↩️</span> 30-day easy returns
            </div>
            <div className={styles.highlight}>
              <span>🔒</span> 100% secure payment
            </div>
            {product.brand && (
              <div className={styles.highlight}>
                <span>🏷️</span> Brand: <strong>{product.brand}</strong>
              </div>
            )}
            {product.ageGroup && (
              <div className={styles.highlight}>
                <span>👶</span> Age Group: <strong>{product.ageGroup}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className={styles.tabs}>
        <div className={styles.tabHeader}>
          {['description', 'specifications', 'reviews'].map(t => (
            <button
              key={t}
              className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {/* Description Tab */}
          {tab === 'description' && (
            <div className={styles.description}>
              <p>{product.description}</p>
              {product.features?.length > 0 && (
                <>
                  <h4>Key Features</h4>
                  <ul>
                    {product.features.map((f, i) => (
                      <li key={i}>✅ {f}</li>
                    ))}
                  </ul>
                </>
              )}
              {product.tags?.length > 0 && (
                <div className={styles.tags}>
                  {product.tags.map((tag, i) => (
                    <span key={i} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Specifications Tab */}
          {tab === 'specifications' && (
            <div className={styles.specs}>
              {product.specifications?.length > 0 ? (
                <table className={styles.specTable}>
                  <tbody>
                    {product.specifications.map((spec, i) => (
                      <tr key={i}>
                        <td className={styles.specKey}>{spec.key}</td>
                        <td>{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No specifications available.</p>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {tab === 'reviews' && (
            <div className={styles.reviews}>
              {product.reviews?.length > 0 ? (
                product.reviews.map((r, i) => (
                  <div key={i} className={styles.review}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewAvatar}>
                        {r.name?.[0] || '?'}
                      </div>
                      <div>
                        <strong>{r.name}</strong>
                        <div className={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <span
                              key={s}
                              style={{
                                color: s <= r.rating ? '#f59e0b' : '#e2e8f0',
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className={styles.reviewComment}>{r.comment}</p>
                  </div>
                ))
              ) : (
                <p>No reviews yet. Be the first to review this product!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}