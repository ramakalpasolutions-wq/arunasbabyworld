'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import styles from './ProductDetailClient.module.css';

export default function ProductDetailClient({ id }) {
  const [product, setProduct]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity]       = useState(1);
  const [tab, setTab]                 = useState('description');
  const { addItem }                   = useCart();
  const { isWishlisted, toggle }      = useWishlist();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => { setProduct(d.product); setLoading(false); })
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
      <Link href="/products" className="btn btn-primary">Browse Products</Link>
    </div>
  );

  const images = product.images?.length > 0
    ? product.images
    : [{ url: `https://via.placeholder.com/500x500?text=${encodeURIComponent(product.name)}` }];

  const finalPrice = product.discountPrice || product.price;
  const discount   = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (product.stock === 0) return;
    addItem({ ...product, quantity });
    toast.success(`${product.name} added to cart!`, { icon: '🛒' });
  };

  const inWishlist = isWishlisted(product.id);
  const handleWishlist = () => {
    toggle(product);
    toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist! ❤️');
  };

  // ✅ Check if clothing category
  const isClothing = product.category?.name?.toLowerCase().includes('cloth') ||
                     product.category?.slug?.toLowerCase().includes('cloth') ||
                     product.size || product.gender || product.color || product.material;

  // ✅ Gender display
  const genderDisplay = {
    boy:    { label: 'Boy',    emoji: '👦', color: '#0EA5E9', bg: '#E0F2FE' },
    girl:   { label: 'Girl',   emoji: '👧', color: '#EC4899', bg: '#FDF2F8' },
    unisex: { label: 'Unisex', emoji: '🧒', color: '#7B2FBE', bg: '#F3E8FF' },
  };

  const genderInfo = product.gender
    ? genderDisplay[product.gender.toLowerCase()] || { label: product.gender, emoji: '🧒', color: '#7B2FBE', bg: '#F3E8FF' }
    : null;

  return (
    <div className={`container ${styles.page}`}>

      {/* ── BREADCRUMB ── */}
      <nav className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        {' / '}
        <Link href="/products">Products</Link>
        {' / '}
        {product.category && (
          <>
            <Link href={`/products?category=${product.category?.id}`}>
              {product.category.name}
            </Link>
            {' / '}
          </>
        )}
        <span>{product.name}</span>
      </nav>

      <div className={styles.layout}>

        {/* ── IMAGES ── */}
        <div className={styles.imagesSection}>
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

          {images.length > 1 && (
            <p className={styles.imageCount}>
              📸 {selectedImage + 1} / {images.length} images
            </p>
          )}
        </div>

        {/* ── INFO ── */}
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

          {/* Name */}
          <h1 className={styles.productName}>{product.name}</h1>

          {/* Rating */}
          {product.rating > 0 && (
            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {[1,2,3,4,5].map(s => (
                  <span
                    key={s}
                    style={{ color: s <= Math.round(product.rating) ? '#f59e0b' : '#e2e8f0' }}
                  >★</span>
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

          {/* Short desc */}
          {product.shortDescription && (
            <p className={styles.shortDesc}>{product.shortDescription}</p>
          )}

          {/* ✅ CLOTHING DETAILS SECTION */}
          {isClothing && (product.gender || product.size || product.color || product.material || product.ageGroup) && (
            <div style={{
              background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)',
              border: '2px solid #EDD9FF',
              borderRadius: '16px',
              padding: '16px 18px',
              marginBottom: '4px',
            }}>
              <h4 style={{
                fontSize: '0.82rem',
                fontWeight: '800',
                color: '#FF6B35',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                👗 Clothing Details
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}>

                {/* Gender */}
                {genderInfo && (
                  <div style={{
                    background: genderInfo.bg,
                    borderRadius: '12px',
                    padding: '10px 14px',
                    border: `1.5px solid ${genderInfo.color}30`,
                  }}>
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      color: '#9585B0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px',
                    }}>
                      Gender
                    </div>
                    <div style={{
                      fontSize: '0.92rem',
                      fontWeight: '800',
                      color: genderInfo.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      {genderInfo.emoji} {genderInfo.label}
                    </div>
                  </div>
                )}

                {/* Size */}
                {product.size && (
                  <div style={{
                    background: '#F3E8FF',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    border: '1.5px solid #DFC5F830',
                  }}>
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      color: '#9585B0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px',
                    }}>
                      Size
                    </div>
                    <div style={{
                      fontSize: '0.92rem',
                      fontWeight: '800',
                      color: '#7B2FBE',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      📏 {product.size}
                    </div>
                  </div>
                )}

                {/* Color */}
                {product.color && (
                  <div style={{
                    background: '#FFF3EC',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    border: '1.5px solid #FFD4B830',
                  }}>
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      color: '#9585B0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px',
                    }}>
                      Color
                    </div>
                    <div style={{
                      fontSize: '0.92rem',
                      fontWeight: '800',
                      color: '#FF6B35',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      🎨 {product.color}
                    </div>
                  </div>
                )}

                {/* Material */}
                {product.material && (
                  <div style={{
                    background: '#F0FDF4',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    border: '1.5px solid #BBF7D030',
                  }}>
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      color: '#9585B0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px',
                    }}>
                      Material
                    </div>
                    <div style={{
                      fontSize: '0.92rem',
                      fontWeight: '800',
                      color: '#22C55E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      🧵 {product.material}
                    </div>
                  </div>
                )}

                {/* Age Group */}
                {product.ageGroup && (
                  <div style={{
                    background: '#FFFBEB',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    border: '1.5px solid #FDE68A30',
                    gridColumn: product.color && product.material ? 'auto' : 'span 2',
                  }}>
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      color: '#9585B0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '4px',
                    }}>
                      Age Group
                    </div>
                    <div style={{
                      fontSize: '0.92rem',
                      fontWeight: '800',
                      color: '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      👶 {product.ageGroup}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              className={`btn btn-primary ${styles.addCartBtn}`}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              🛒 Add to Cart
            </button>
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
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
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

          {/* Description */}
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

          {/* Specifications */}
          {tab === 'specifications' && (
            <div className={styles.specs}>
              <table className={styles.specTable}>
                <tbody>
                  {/* ✅ Show clothing specs automatically */}
                  {product.gender && (
                    <tr>
                      <td className={styles.specKey}>Gender</td>
                      <td>
                        {product.gender === 'boy' ? '👦' : product.gender === 'girl' ? '👧' : '🧒'}
                        {' '}{product.gender.charAt(0).toUpperCase() + product.gender.slice(1)}
                      </td>
                    </tr>
                  )}
                  {product.size && (
                    <tr>
                      <td className={styles.specKey}>Size</td>
                      <td>📏 {product.size}</td>
                    </tr>
                  )}
                  {product.color && (
                    <tr>
                      <td className={styles.specKey}>Color</td>
                      <td>🎨 {product.color}</td>
                    </tr>
                  )}
                  {product.material && (
                    <tr>
                      <td className={styles.specKey}>Material</td>
                      <td>🧵 {product.material}</td>
                    </tr>
                  )}
                  {product.ageGroup && (
                    <tr>
                      <td className={styles.specKey}>Age Group</td>
                      <td>👶 {product.ageGroup}</td>
                    </tr>
                  )}
                  {product.brand && (
                    <tr>
                      <td className={styles.specKey}>Brand</td>
                      <td>🏷️ {product.brand}</td>
                    </tr>
                  )}
                  {product.weight && (
                    <tr>
                      <td className={styles.specKey}>Weight</td>
                      <td>⚖️ {product.weight}g</td>
                    </tr>
                  )}
                  {product.sku && (
                    <tr>
                      <td className={styles.specKey}>SKU</td>
                      <td>{product.sku}</td>
                    </tr>
                  )}
                  {/* Original specifications if any */}
                  {product.specifications?.map((spec, i) => (
                    <tr key={i}>
                      <td className={styles.specKey}>{spec.key}</td>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                  {/* Show message if nothing */}
                  {!product.gender && !product.size && !product.color &&
                   !product.material && !product.ageGroup && !product.brand &&
                   !product.weight && !product.specifications?.length && (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center', color: '#9585B0' }}>
                        No specifications available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Reviews */}
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
                          {[1,2,3,4,5].map(s => (
                            <span
                              key={s}
                              style={{ color: s <= r.rating ? '#f59e0b' : '#e2e8f0' }}
                            >★</span>
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