'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import styles from './ProductDetailClient.module.css';

export default function ProductDetailClient({ id }) {
  const [product,       setProduct]       = useState(null);
  const [related,       setRelated]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity,      setQuantity]      = useState(1);
  const [tab,           setTab]           = useState('description');
  const [imgLoaded,     setImgLoaded]     = useState(false);

  // ✅ Auto slide states
  const [isHovered, setIsHovered] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);
  const SLIDE_DELAY = 3000;

  const { addItem }              = useCart();
  const { isWishlisted, toggle } = useWishlist();

  /* ── Fetch product ── */
  useEffect(() => {
    setLoading(true);
    setSelectedImage(0);
    setImgLoaded(false);
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product);
        setLoading(false);

        if (d.product?.categoryId) {
          fetch(
            `/api/products?category=${d.product.categoryId}&limit=8&sort=createdAt&order=desc`
          )
            .then(r => r.json())
            .then(rd => {
              const filtered = (rd.products || []).filter(p => p.id !== d.product.id);
              setRelated(filtered.slice(0, 6));
            })
            .catch(() => {});
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  /* ── Auto slide logic ── */
  useEffect(() => {
    if (!product) return;

    const images = product.images?.length > 0
      ? product.images
      : [{ url: `https://via.placeholder.com/500x500` }];

    if (images.length <= 1) return;

    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);
    setProgress(0);

    if (isHovered) return;

    let step = 0;
    progressRef.current = setInterval(() => {
      step += 1;
      setProgress((step / (SLIDE_DELAY / 30)) * 100);
    }, 30);

    intervalRef.current = setInterval(() => {
      setSelectedImage(prev => {
        const next = (prev + 1) % images.length;
        setImgLoaded(false);
        return next;
      });
      step = 0;
      setProgress(0);
    }, SLIDE_DELAY);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(progressRef.current);
    };
  }, [isHovered, product, selectedImage]);

  /* ── Manual navigation ── */
  const goToSlide = useCallback((index) => {
    setSelectedImage(index);
    setImgLoaded(false);
    setProgress(0);
    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);
  }, []);

  const goPrev = (images) => {
    goToSlide((selectedImage - 1 + images.length) % images.length);
  };

  const goNext = (images) => {
    goToSlide((selectedImage + 1) % images.length);
  };

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className={`container ${styles.page}`}>
      <div className={styles.skeletonLayout}>
        <div className={styles.skeletonLeft}>
          <div className={`${styles.skeletonBox} ${styles.skeletonMainImg}`} />
          <div className={styles.skeletonThumbs}>
            {[1,2,3,4].map(i => (
              <div key={i} className={`${styles.skeletonBox} ${styles.skeletonThumb}`} />
            ))}
          </div>
        </div>
        <div className={styles.skeletonRight}>
          <div className={`${styles.skeletonBox} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonBox} ${styles.skeletonPrice}`} />
          <div className={`${styles.skeletonBox} ${styles.skeletonDesc}`} />
          <div className={`${styles.skeletonBox} ${styles.skeletonBtn}`} />
        </div>
      </div>
    </div>
  );

  /* ── Not found ── */
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

  const isClothing =
    product.category?.name?.toLowerCase().includes('cloth') ||
    product.category?.slug?.toLowerCase().includes('cloth') ||
    product.size || product.gender || product.color || product.material;

  const genderDisplay = {
    boy:    { label: 'Boy',    emoji: '👦', color: '#0EA5E9', bg: '#E0F2FE' },
    girl:   { label: 'Girl',   emoji: '👧', color: '#EC4899', bg: '#FDF2F8' },
    unisex: { label: 'Unisex', emoji: '🧒', color: '#7B2FBE', bg: '#F3E8FF' },
  };

  const genderInfo = product.gender
    ? genderDisplay[product.gender.toLowerCase()] || {
        label: product.gender, emoji: '🧒', color: '#7B2FBE', bg: '#F3E8FF',
      }
    : null;

  const viewLabels = [];
  const viewIcons  = [];

  return (
    <div className={`container ${styles.page}`}>

      {/* ── BREADCRUMB ── */}
      <nav className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span className={styles.breadSep}>/</span>
        <Link href="/products">Products</Link>
        {product.category && (
          <>
            <span className={styles.breadSep}>/</span>
            <Link href={`/products?category=${product.category?.id}`}>
              {product.category.name}
            </Link>
          </>
        )}
        <span className={styles.breadSep}>/</span>
        <span className={styles.breadCurrent}>{product.name}</span>
      </nav>

      {/* ══ MAIN LAYOUT ══ */}
      <div className={styles.layout}>

        {/* ── IMAGES SECTION ── */}
        <div className={styles.imagesSection}>

          {/* ✅ Main Image with Auto Slide */}
          <div
            className={styles.mainImageWrap}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {/* Skeleton */}
            {!imgLoaded && (
              <div className={styles.imgSkeleton}>
                <span className={styles.imgSkeletonIcon}>🖼️</span>
              </div>
            )}

            {/* Main Image */}
            <Image
              src={images[selectedImage]?.url || images[0]?.url}
              alt={product.name}
              width={500}
              height={500}
              className={`${styles.mainImg} ${
                imgLoaded ? styles.mainImgVisible : styles.mainImgHidden
              }`}
              style={{ objectFit: 'cover', transition: 'opacity 0.4s ease' }}
              onLoad={() => setImgLoaded(true)}
              priority
            />

            {/* Discount Badge */}
            {discount > 0 && (
              <span className={styles.discountTag}>{discount}% OFF</span>
            )}

            {/* Trending Badge */}
            {product.isTrending && (
              <span className={styles.trendingTag}>🔥 Trending</span>
            )}
            {/* ✅ Left Arrow */}
            {images.length > 1 && (
              <button
                onClick={() => goPrev(images)}
                style={{
                  position:       'absolute',
                  left:           '10px',
                  top:            '50%',
                  transform:      'translateY(-50%)',
                  background:     'rgba(255,255,255,0.92)',
                  border:         'none',
                  borderRadius:   '50%',
                  width:          '38px',
                  height:         '38px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  cursor:         'pointer',
                  fontSize:       '1.4rem',
                  fontWeight:     '800',
                  color:          '#2D1A4A',
                  boxShadow:      '0 2px 12px rgba(0,0,0,0.15)',
                  zIndex:         4,
                  transition:     'all 0.2s ease',
                  lineHeight:     1,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg,#FF6B35,#7B2FBE)';
                  e.currentTarget.style.color      = 'white';
                  e.currentTarget.style.transform  = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.92)';
                  e.currentTarget.style.color      = '#2D1A4A';
                  e.currentTarget.style.transform  = 'translateY(-50%) scale(1)';
                }}
              >
                ‹
              </button>
            )}

            {/* ✅ Right Arrow */}
            {images.length > 1 && (
              <button
                onClick={() => goNext(images)}
                style={{
                  position:       'absolute',
                  right:          '10px',
                  top:            '50%',
                  transform:      'translateY(-50%)',
                  background:     'rgba(255,255,255,0.92)',
                  border:         'none',
                  borderRadius:   '50%',
                  width:          '38px',
                  height:         '38px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  cursor:         'pointer',
                  fontSize:       '1.4rem',
                  fontWeight:     '800',
                  color:          '#2D1A4A',
                  boxShadow:      '0 2px 12px rgba(0,0,0,0.15)',
                  zIndex:         4,
                  transition:     'all 0.2s ease',
                  lineHeight:     1,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg,#FF6B35,#7B2FBE)';
                  e.currentTarget.style.color      = 'white';
                  e.currentTarget.style.transform  = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.92)';
                  e.currentTarget.style.color      = '#2D1A4A';
                  e.currentTarget.style.transform  = 'translateY(-50%) scale(1)';
                }}
              >
                ›
              </button>
            )}

            {/* ✅ Progress Bar */}
            {images.length > 1 && !isHovered && (
              <div style={{
                position:   'absolute',
                bottom:     0,
                left:       0,
                right:      0,
                height:     '3px',
                background: 'rgba(255,255,255,0.25)',
                zIndex:     4,
              }}>
                <div style={{
                  height:           '100%',
                  width:            `${progress}%`,
                  background:       'linear-gradient(90deg,#FF6B35,#7B2FBE)',
                  transition:       'width 0.03s linear',
                  borderRadius:     '0 2px 2px 0',
                }} />
              </div>
            )}

            {/* ✅ Paused Badge */}
            {images.length > 1 && isHovered && (
              <div style={{
                position:       'absolute',
                bottom:         '12px',
                right:          '12px',
                background:     'rgba(45,26,74,0.75)',
                color:          'white',
                padding:        '3px 10px',
                borderRadius:   '999px',
                fontSize:       '0.65rem',
                fontWeight:     '700',
                backdropFilter: 'blur(4px)',
                zIndex:         4,
              }}>
                ⏸ Paused
              </div>
            )}

            {/* ✅ Dot Indicators */}
            {images.length > 1 && (
              <div style={{
                position:       'absolute',
                bottom:         '12px',
                left:           '50%',
                transform:      'translateX(-50%)',
                display:        'flex',
                gap:            '6px',
                zIndex:         4,
              }}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    style={{
                      width:        i === selectedImage ? '20px' : '8px',
                      height:       '8px',
                      borderRadius: '999px',
                      border:       'none',
                      background:   i === selectedImage
                        ? 'linear-gradient(135deg,#FF6B35,#7B2FBE)'
                        : 'rgba(255,255,255,0.6)',
                      cursor:       'pointer',
                      padding:      0,
                      transition:   'all 0.3s ease',
                      boxShadow:    i === selectedImage
                        ? '0 2px 8px rgba(255,107,53,0.5)'
                        : 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ✅ Thumbnails with Labels */}
          {images.length > 1 && (
            <div className={styles.thumbnails}>
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`${styles.thumb} ${
                    i === selectedImage ? styles.thumbActive : ''
                  }`}
                  onClick={() => goToSlide(i)}
                  aria-label={viewLabels[i] || `View ${i + 1}`}
                  style={{
                    position:   'relative',
                    overflow:   'hidden',
                    border:     i === selectedImage
                      ? '2px solid #FF6B35'
                      : '2px solid #EDD9FF',
                    transition: 'all 0.2s ease',
                    padding:    0,
                  }}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} ${viewLabels[i] || i + 1}`}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', display: 'block' }}
                  />

                  {/* View Label */}
                  <span style={{
                    position:      'absolute',
                    bottom:        0,
                    left:          0,
                    right:         0,
                    background:    i === selectedImage
                      ? 'linear-gradient(135deg,#FF6B35,#7B2FBE)'
                      : 'rgba(0,0,0,0.55)',
                    color:         'white',
                    fontSize:      '0.55rem',
                    fontWeight:    '800',
                    textAlign:     'center',
                    padding:       '2px 4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    transition:    'background 0.2s',
                  }}>
                    {viewIcons[i] || '🖼️'} {viewLabels[i] || `View ${i + 1}`}
                  </span>

                  {/* ✅ Progress on active thumb */}
                  {i === selectedImage && !isHovered && (
                    <div style={{
                      position:     'absolute',
                      bottom:       0,
                      left:         0,
                      height:       '2px',
                      width:        `${progress}%`,
                      background:   'linear-gradient(90deg,#FF6B35,#7B2FBE)',
                      transition:   'width 0.03s linear',
                      zIndex:       2,
                    }} />
                  )}
                </button>
              ))}
            </div>
          )}


        </div>

        {/* ── INFO SECTION ── */}
        <div className={styles.infoSection}>

          {/* Category link */}
          {product.category && (
            <Link
              href={`/products?category=${product.category?.id}`}
              className={styles.categoryLink}
            >
              {product.category.name}
            </Link>
          )}

          {/* Product name */}
          <h1 className={styles.productName}>{product.name}</h1>

          {/* Rating */}
          {product.rating > 0 && (
            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {[1,2,3,4,5].map(s => (
                  <span
                    key={s}
                    className={s <= Math.round(product.rating)
                      ? styles.starOn : styles.starOff}
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
                <span className={styles.saveBadge}>
                  Save ₹{(product.price - finalPrice).toLocaleString('en-IN')}
                </span>
              </>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className={styles.shortDesc}>{product.shortDescription}</p>
          )}

          {/* ── CLOTHING DETAILS ── */}
          {isClothing && (
            product.gender || product.size || product.color ||
            product.material || product.ageGroup
          ) && (
            <div className={styles.clothingCard}>
              <h4 className={styles.clothingTitle}>👗 Clothing Details</h4>
              <div className={styles.clothingGrid}>
                {genderInfo && (
                  <div
                    className={styles.clothingItem}
                    style={{
                      background:  genderInfo.bg,
                      borderColor: `${genderInfo.color}30`,
                    }}
                  >
                    <span className={styles.clothingLabel}>Gender</span>
                    <span className={styles.clothingValue} style={{ color: genderInfo.color }}>
                      {genderInfo.emoji} {genderInfo.label}
                    </span>
                  </div>
                )}
                {product.size && (
                  <div className={styles.clothingItem}
                    style={{ background: '#F3E8FF', borderColor: '#DFC5F830' }}>
                    <span className={styles.clothingLabel}>Size</span>
                    <span className={styles.clothingValue} style={{ color: '#7B2FBE' }}>
                      📏 {product.size}
                    </span>
                  </div>
                )}
                {product.color && (
                  <div className={styles.clothingItem}
                    style={{ background: '#FFF3EC', borderColor: '#FFD4B830' }}>
                    <span className={styles.clothingLabel}>Color</span>
                    <span className={styles.clothingValue} style={{ color: '#FF6B35' }}>
                      🎨 {product.color}
                    </span>
                  </div>
                )}
                {product.material && (
                  <div className={styles.clothingItem}
                    style={{ background: '#F0FDF4', borderColor: '#BBF7D030' }}>
                    <span className={styles.clothingLabel}>Material</span>
                    <span className={styles.clothingValue} style={{ color: '#22C55E' }}>
                      🧵 {product.material}
                    </span>
                  </div>
                )}
                {product.ageGroup && (
                  <div
                    className={styles.clothingItem}
                    style={{
                      background:  '#FFFBEB',
                      borderColor: '#FDE68A30',
                      gridColumn:  (product.color && product.material) ? 'auto' : 'span 2',
                    }}
                  >
                    <span className={styles.clothingLabel}>Age Group</span>
                    <span className={styles.clothingValue} style={{ color: '#F59E0B' }}>
                      👶 {product.ageGroup}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stock */}
          <div className={styles.stockRow}>
            {product.stock > 0 ? (
              <span className={styles.inStock}>
                ✅ In Stock ({product.stock} available)
              </span>
            ) : (
              <span className={styles.outOfStock}>❌ Out of Stock</span>
            )}
            {product.stock > 0 && product.stock <= 10 && (
              <span className={styles.lowStockWarn}>
                ⚠️ Only {product.stock} left!
              </span>
            )}
          </div>

          {/* Quantity */}
          {product.stock > 0 && (
            <div className={styles.quantityRow}>
              <span className={styles.quantityLabel}>Quantity:</span>
              <div className={styles.quantityControl}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >−</button>
                <span className={styles.qtyNum}>{quantity}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                >+</button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actionBtns}>
            <button
              className={styles.cartBtn}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              🛒 {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className={`${styles.wishBtn} ${inWishlist ? styles.wishActive : ''}`}
              onClick={handleWishlist}
              aria-label="Toggle wishlist"
            >
              {inWishlist ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Highlights */}
          <div className={styles.highlights}>
            {[
              { icon: '🚚', text: 'Free delivery on orders above ₹499' },
              { icon: '↩️', text: '30-day easy returns'                 },
              { icon: '🔒', text: '100% secure payment'                 },
            ].map((h, i) => (
              <div key={i} className={styles.highlightItem}>
                <span>{h.icon}</span>
                <span>{h.text}</span>
              </div>
            ))}
            {product.brand && (
              <div className={styles.highlightItem}>
                <span>🏷️</span>
                <span>Brand: <strong>{product.brand}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ TABS ══ */}
      <div className={styles.tabs}>
        <div className={styles.tabHeader}>
          {['description', 'specifications', 'reviews'].map(t => (
            <button
              key={t}
              className={`${styles.tabBtn} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'description'    && '📝 '}
              {t === 'specifications' && '📋 '}
              {t === 'reviews'        && '⭐ '}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>

          {/* Description */}
          {tab === 'description' && (
            <div className={styles.descTab}>
              <p className={styles.descText}>{product.description}</p>
              {product.features?.length > 0 && (
                <>
                  <h4 className={styles.featuresTitle}>✨ Key Features</h4>
                  <ul className={styles.featuresList}>
                    {product.features.map((f, i) => (
                      <li key={i} className={styles.featureItem}>
                        <span className={styles.featureCheck}>✅</span> {f}
                      </li>
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
            <div className={styles.specsTab}>
              <table className={styles.specTable}>
                <tbody>
                  {product.gender && (
                    <tr>
                      <td className={styles.specKey}>Gender</td>
                      <td>
                        {product.gender === 'boy'
                          ? '👦' : product.gender === 'girl' ? '👧' : '🧒'}
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
                      <td><code>{product.sku}</code></td>
                    </tr>
                  )}
                  {!product.gender && !product.size && !product.color &&
                   !product.material && !product.ageGroup && !product.brand &&
                   !product.weight && !product.specifications?.length && (
                    <tr>
                      <td colSpan={2} style={{
                        textAlign: 'center', color: '#9585B0', padding: '28px',
                      }}>
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
            <div className={styles.reviewsTab}>
              {product.reviews?.length > 0 ? (
                product.reviews.map((r, i) => (
                  <div key={i} className={styles.reviewCard}>
                    <div className={styles.reviewTop}>
                      <div className={styles.reviewAvatar}>
                        {r.name?.[0] || '?'}
                      </div>
                      <div>
                        <strong className={styles.reviewName}>{r.name}</strong>
                        <div className={styles.reviewStars}>
                          {[1,2,3,4,5].map(s => (
                            <span
                              key={s}
                              className={s <= r.rating ? styles.starOn : styles.starOff}
                            >★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className={styles.reviewText}>{r.comment}</p>
                  </div>
                ))
              ) : (
                <div className={styles.noReviews}>
                  <span>⭐</span>
                  <p>No reviews yet. Be the first to review this product!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ RELATED PRODUCTS ══ */}
      {related.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <div>
              <span className={styles.relatedLabel}>
                {product.category?.name || 'Similar'}
              </span>
              <h2 className={styles.relatedTitle}>🛍️ You May Also Like</h2>
              <p className={styles.relatedSub}>
                More products from {product.category?.name || 'this category'}
              </p>
            </div>
            <Link
              href={`/products?category=${product.categoryId}`}
              className={styles.viewAllBtn}
            >
              View All →
            </Link>
          </div>

          <div className={styles.relatedGrid}>
            {related.map((p, i) => (
              <RelatedCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ============================================================
   RELATED PRODUCT CARD
   ============================================================ */
function RelatedCard({ product, index }) {
  const { addItem }              = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [adding,    setAdding]    = useState(false);

  const inWishlist = isWishlisted(product.id);
  const imageUrl   = product.images?.[0]?.url || null;
  const price      = product.discountPrice || product.price;
  const discount   = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || product.stock === 0) return;
    setAdding(true);
    addItem({ ...product, quantity: 1 });
    toast.success('Added to cart! 🛒', {
      style: {
        background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
        color: 'white', fontWeight: 700, borderRadius: 999,
      },
      icon: null, duration: 1800,
    });
    setTimeout(() => setAdding(false), 1200);
  };

  const handleWish = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
    toast.success(inWishlist ? 'Removed 💔' : 'Saved ❤️', { duration: 1500 });
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className={styles.relatedCard}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image */}
      <div className={styles.relatedImgWrap}>
        {!imgLoaded && (
          <div className={styles.relatedImgSkeleton}>
            <span>🛍️</span>
          </div>
        )}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            width={220}
            height={220}
            className={`${styles.relatedImg} ${
              imgLoaded ? styles.relatedImgVisible : styles.relatedImgHidden
            }`}
            style={{ objectFit: 'cover' }}
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <div className={styles.relatedNoImg}>🛍️</div>
        )}

        {/* Badges */}
        <div className={styles.relatedBadges}>
          {discount > 0 && (
            <span className={styles.relatedDiscount}>-{discount}%</span>
          )}
          {product.isTrending && (
            <span className={styles.relatedTrending}>🔥</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          className={`${styles.relatedWish} ${inWishlist ? styles.relatedWishOn : ''}`}
          onClick={handleWish}
          aria-label="Wishlist"
        >
          {inWishlist ? '❤️' : '🤍'}
        </button>

        {/* Out of stock */}
        {product.stock === 0 && (
          <div className={styles.relatedOos}>Out of Stock</div>
        )}
      </div>

      {/* Info */}
      <div className={styles.relatedInfo}>
        <p className={styles.relatedCat}>{product.category?.name || ''}</p>
        <h3 className={styles.relatedName}>{product.name}</h3>

        <div className={styles.relatedPriceRow}>
          <span className={styles.relatedPrice}>
            ₹{price.toLocaleString('en-IN')}
          </span>
          {product.discountPrice && (
            <span className={styles.relatedOldPrice}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <button
          className={`${styles.relatedCartBtn} ${adding ? styles.relatedAdding : ''} ${
            product.stock === 0 ? styles.relatedDisabled : ''
          }`}
          onClick={handleCart}
          disabled={product.stock === 0}
        >
          {adding
            ? '✓ Added!'
            : product.stock === 0
              ? 'Out of Stock'
              : '🛒 Add to Cart'}
        </button>
      </div>
    </Link>
  );
}