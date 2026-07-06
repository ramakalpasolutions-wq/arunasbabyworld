'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

  // ✅ NEW: Color variant state
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize,     setSelectedSize]     = useState('');

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
    setSelectedColorIdx(0);
    setSelectedSize('');
    setImgLoaded(false);
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product);
        setLoading(false);

        // ✅ Auto-select first available size of first color
        if (d.product?.hasVariants && d.product?.colorVariants?.[0]?.sizes?.length > 0) {
          setSelectedSize(d.product.colorVariants[0].sizes[0]);
        }

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

  /* ============================================================
     ✅ COMPUTED: Current color variant + display data
     ============================================================ */
  const hasVariants = product?.hasVariants && product?.colorVariants?.length > 0;
  const currentVariant = hasVariants ? product.colorVariants[selectedColorIdx] : null;

  // ✅ Images to display: variant images OR default product images
  const displayImages = useMemo(() => {
    if (hasVariants && currentVariant?.images?.length > 0) {
      return currentVariant.images;
    }
    return product?.images?.length > 0
      ? product.images
      : [{ url: `https://via.placeholder.com/500x500?text=${encodeURIComponent(product?.name || '')}` }];
  }, [hasVariants, currentVariant, product]);

  // ✅ Price: variant price OR default product price
  const currentPrice = hasVariants && currentVariant
    ? currentVariant.price
    : product?.price;

  const currentDiscountPrice = hasVariants && currentVariant
    ? currentVariant.discountPrice
    : product?.discountPrice;

  const finalPrice = currentDiscountPrice || currentPrice;
  const discount = currentDiscountPrice
    ? Math.round(((currentPrice - currentDiscountPrice) / currentPrice) * 100)
    : 0;

  // ✅ Stock: variant stock OR default product stock
  const currentStock = hasVariants && currentVariant
    ? currentVariant.stock
    : product?.stock;

  // ✅ Sizes for current color
  const currentSizes = hasVariants && currentVariant
    ? currentVariant.sizes || []
    : [];

  /* ── When color changes — reset image, set first size ── */
  const handleColorChange = (idx) => {
    setSelectedColorIdx(idx);
    setSelectedImage(0);
    setImgLoaded(false);
    setQuantity(1);
    setProgress(0);
    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);

    // Auto-select first size of new color
    const newVariant = product?.colorVariants?.[idx];
    if (newVariant?.sizes?.length > 0) {
      setSelectedSize(newVariant.sizes[0]);
    } else {
      setSelectedSize('');
    }
  };

  /* ── Auto slide logic ── */
  useEffect(() => {
    if (!product) return;
    if (displayImages.length <= 1) return;

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
        const next = (prev + 1) % displayImages.length;
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
  }, [isHovered, product, selectedImage, displayImages.length]);

  /* ── Manual navigation ── */
  const goToSlide = useCallback((index) => {
    setSelectedImage(index);
    setImgLoaded(false);
    setProgress(0);
    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);
  }, []);

  const goPrev = () => {
    goToSlide((selectedImage - 1 + displayImages.length) % displayImages.length);
  };

  const goNext = () => {
    goToSlide((selectedImage + 1) % displayImages.length);
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

  const handleAddToCart = () => {
    if (currentStock === 0) return;

    // ✅ Validate size selection if variant has sizes
    if (hasVariants && currentSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    const cartItem = {
      ...product,
      quantity,
      // ✅ Override with variant-specific data
      ...(hasVariants && currentVariant && {
        price: currentVariant.price,
        discountPrice: currentVariant.discountPrice,
        selectedColor: {
          name: currentVariant.colorName,
          hex:  currentVariant.colorHex,
        },
        selectedSize: selectedSize || null,
        images: currentVariant.images || product.images,
      }),
    };

    addItem(cartItem);

    const colorLabel = hasVariants ? ` (${currentVariant.colorName}${selectedSize ? `, ${selectedSize}` : ''})` : '';
    toast.success(`${product.name}${colorLabel} added to cart!`, { icon: '🛒' });
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

        {/* ── IMAGES SECTION — Main image ONLY at TOP, Thumbnails ONLY at BOTTOM ── */}
<div className={styles.imagesSection}>

  {/* ✅ 1. MAIN IMAGE — TOP */}
  <div
    className={styles.mainImageWrap}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
    {!imgLoaded && (
      <div className={styles.imgSkeleton}>
        <span className={styles.imgSkeletonIcon}>🖼️</span>
      </div>
    )}

    <Image
      src={displayImages[selectedImage]?.url || displayImages[0]?.url}
      alt={product.name}
      width={600}
      height={600}
      className={`${styles.mainImg} ${imgLoaded ? styles.mainImgVisible : styles.mainImgHidden}`}
      onLoad={() => setImgLoaded(true)}
      priority
    />

    {discount > 0 && <span className={styles.discountTag}>{discount}% OFF</span>}
    {product.isTrending && <span className={styles.trendingTag}>🔥 Trending</span>}

    {displayImages.length > 1 && (
      <>
        <button
          onClick={goPrev}
          className={styles.navArrow}
          style={{ left: '12px' }}
          aria-label="Previous"
        >‹</button>
        <button
          onClick={goNext}
          className={styles.navArrow}
          style={{ right: '12px' }}
          aria-label="Next"
        >›</button>
      </>
    )}

    {displayImages.length > 1 && (
      <div className={styles.dots}>
        {displayImages.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`${styles.dot} ${i === selectedImage ? styles.dotActive : ''}`}
            aria-label={`Go to image ${i + 1}`}
          />
        ))}
      </div>
    )}

    {displayImages.length > 1 && !isHovered && (
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
    )}

    {displayImages.length > 1 && (
      <div className={styles.imageCounter}>
        {selectedImage + 1} / {displayImages.length}
      </div>
    )}
  </div>

  {/* ✅ 2. THUMBNAILS — BOTTOM ONLY (no top thumbnails!) */}
  {displayImages.length > 1 && (
    <div className={styles.thumbnails} data-count={displayImages.length}>
      {displayImages.map((img, i) => (
        <button
          key={i}
          className={`${styles.thumb} ${i === selectedImage ? styles.thumbActive : ''}`}
          onClick={() => goToSlide(i)}
          aria-label={`View ${i + 1}`}
        >
          <Image
            src={img.url}
            alt={`${product.name} ${i + 1}`}
            width={120}
            height={120}
            className={styles.thumbImg}
          />
        </button>
      ))}
    </div>
  )}

</div>

        {/* ── INFO SECTION ── */}
        <div className={styles.infoSection}>

          {product.category && (
            <Link
              href={`/products?category=${product.category?.id}`}
              className={styles.categoryLink}
            >
              {product.category.name}
            </Link>
          )}

          <h1 className={styles.productName}>{product.name}</h1>

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
    ₹{finalPrice?.toLocaleString('en-IN')}
  </span>
  {currentDiscountPrice && (
    <>
      <span className={styles.originalPrice}>
        ₹{currentPrice?.toLocaleString('en-IN')}
      </span>
      {/* ✅ Show percentage instead of saved amount */}
      <span className={styles.saveBadge}>
        {discount}% OFF
      </span>
    </>
  )}
</div>
          {product.shortDescription && (
            <p className={styles.shortDesc}>{product.shortDescription}</p>
          )}

          {/* ════════════════════════════════════════════════════════
              ✅ COLOR VARIANTS — Swatch Picker
              ════════════════════════════════════════════════════════ */}
          {hasVariants && (
            <div style={{
              marginTop: '18px',
              padding: '16px 18px',
              background: 'linear-gradient(135deg,#FBF7FF,#FFF)',
              border: '2px solid #EDD9FF',
              borderRadius: '14px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  color: '#6B4E8A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  🎨 Color:
                </span>
                <span style={{
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  color: currentVariant?.colorHex || '#2D1A4A',
                }}>
                  {currentVariant?.colorName}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '0.74rem',
                  color: '#9585B0',
                  fontWeight: '600',
                }}>
                  {product.colorVariants.length} colors available
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
              }}>
                {product.colorVariants.map((variant, idx) => {
                  const isSelected = idx === selectedColorIdx;
                  const outOfStock = variant.stock === 0;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleColorChange(idx)}
                      disabled={outOfStock}
                      title={`${variant.colorName} - ₹${variant.discountPrice || variant.price}${outOfStock ? ' (Out of Stock)' : ''}`}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: outOfStock ? 'not-allowed' : 'pointer',
                        opacity: outOfStock ? 0.5 : 1,
                        fontFamily: 'inherit',
                      }}
                    >
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: variant.colorHex || '#ccc',
                        border: `3px solid ${isSelected ? '#7B2FBE' : 'white'}`,
                        boxShadow: isSelected
                          ? '0 0 0 2px #7B2FBE, 0 4px 12px rgba(123,47,190,0.3)'
                          : '0 2px 8px rgba(0,0,0,0.12)',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                      }}>
                        {isSelected && (
                          <span style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            background: '#22C55E',
                            color: 'white',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            fontSize: '10px',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white',
                          }}>✓</span>
                        )}
                        {outOfStock && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: '800',
                            color: '#DC2626',
                          }}>✕</div>
                        )}
                      </div>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        color: isSelected ? '#7B2FBE' : '#6B4E8A',
                        maxWidth: '60px',
                        textAlign: 'center',
                        lineHeight: 1.1,
                      }}>
                        {variant.colorName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              ✅ SIZE PICKER — Per color
              ════════════════════════════════════════════════════════ */}
          {hasVariants && currentSizes.length > 0 && (
            <div style={{
              marginTop: '14px',
              padding: '16px 18px',
              background: 'linear-gradient(135deg,#FFF3EC,#FFF)',
              border: '2px solid #FFD4B8',
              borderRadius: '14px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  color: '#6B4E8A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  📏 Size:
                </span>
                {selectedSize && (
                  <span style={{
                    fontSize: '0.92rem',
                    fontWeight: '700',
                    color: '#FF6B35',
                  }}>
                    {selectedSize}
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {currentSizes.map(size => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: isSelected ? '#FF6B35' : '#FFD4B8',
                        background: isSelected
                          ? 'linear-gradient(135deg,#FF6B35,#7B2FBE)'
                          : 'white',
                        color: isSelected ? 'white' : '#6B4E8A',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                        minWidth: '50px',
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── CLOTHING DETAILS (only when NO variants) ── */}
          {!hasVariants && isClothing && (
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
            {currentStock > 0 ? (
              <span className={styles.inStock}>
                ✅ In Stock ({currentStock} available{hasVariants ? ` for ${currentVariant?.colorName}` : ''})
              </span>
            ) : (
              <span className={styles.outOfStock}>
                ❌ Out of Stock{hasVariants ? ` for ${currentVariant?.colorName}` : ''}
              </span>
            )}
            {currentStock > 0 && currentStock <= 10 && (
              <span className={styles.lowStockWarn}>
                ⚠️ Only {currentStock} left!
              </span>
            )}
          </div>

          {/* Quantity */}
          {currentStock > 0 && (
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
                  onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                >+</button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className={styles.actionBtns}>
            <button
              className={styles.cartBtn}
              onClick={handleAddToCart}
              disabled={currentStock === 0}
            >
              🛒 {currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className={`${styles.wishBtn} ${inWishlist ? styles.wishActive : ''}`}
              onClick={handleWishlist}
              aria-label="Toggle wishlist"
            >
              {inWishlist ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Selection Summary (when variants exist) */}
          {hasVariants && (currentVariant || selectedSize) && (
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg,#F0FDF4,#FBF7FF)',
              border: '1.5px solid #BBF7D0',
              borderRadius: '12px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              fontSize: '0.84rem',
              fontWeight: '700',
              color: '#166534',
            }}>
              <span>✅ Your selection:</span>
              {currentVariant && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: currentVariant.colorHex,
                    border: '2px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                  {currentVariant.colorName}
                </span>
              )}
              {selectedSize && <span>• Size: {selectedSize}</span>}
              <span>• Qty: {quantity}</span>
            </div>
          )}

          {/* Highlights */}
         {/* Highlights */}
<div className={styles.highlights}>
  {[
    {
      icon: '🛡️',
      title: 'Certified &',
      subtitle: 'Safety Tested',
      line3: 'Products',
    },
    {
      icon: '💚',
      title: '1 million +',
      subtitle: 'Happy Parents',
      line3: 'Across India',
    },
   
    {
      icon: '👶',
      title: 'Safe for',
      subtitle: 'Newborns',
      line3: '',
    },
  ].map((h, i) => (
    <div key={i} className={styles.highlightItem}>
      <div className={styles.highlightIcon}>{h.icon}</div>
      <div className={styles.highlightText}>
        <span>{h.title}</span>
        {h.subtitle && <span>{h.subtitle}</span>}
        {h.line3 && <span>{h.line3}</span>}
      </div>
    </div>
  ))}
  {product.brand && (
    <div className={styles.highlightItem}>
      <div className={styles.highlightIcon}>🏷️</div>
      <div className={styles.highlightText}>
        <span>Brand:</span>
        <span><strong>{product.brand}</strong></span>
      </div>
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

          {tab === 'specifications' && (
            <div className={styles.specsTab}>
              <table className={styles.specTable}>
                <tbody>
                  {/* ✅ Show variants in specs */}
                  {hasVariants && (
                    <>
                      <tr>
                        <td className={styles.specKey}>Available Colors</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {product.colorVariants.map((v, i) => (
                              <span key={i} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '3px 10px',
                                background: '#F3E8FF',
                                borderRadius: '999px',
                                fontSize: '0.82rem',
                                fontWeight: '600',
                              }}>
                                <span style={{
                                  display: 'inline-block',
                                  width: '12px', height: '12px',
                                  borderRadius: '50%',
                                  background: v.colorHex,
                                  border: '1.5px solid #ddd',
                                }} />
                                {v.colorName}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                      {currentSizes.length > 0 && (
                        <tr>
                          <td className={styles.specKey}>Available Sizes ({currentVariant?.colorName})</td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {currentSizes.map(s => (
                                <span key={s} style={{
                                  padding: '2px 10px',
                                  background: '#FFF3EC',
                                  borderRadius: '6px',
                                  fontSize: '0.82rem',
                                  fontWeight: '700',
                                  color: '#FF6B35',
                                }}>{s}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
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
                  {!hasVariants && product.size && (
                    <tr>
                      <td className={styles.specKey}>Size</td>
                      <td>📏 {product.size}</td>
                    </tr>
                  )}
                  {!hasVariants && product.color && (
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
                </tbody>
              </table>
            </div>
          )}

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

  // ✅ Use first variant's first image if available
  const firstVariantImage = product.hasVariants && product.colorVariants?.[0]?.images?.[0]?.url;
  const imageUrl = firstVariantImage || product.images?.[0]?.url || null;

  // ✅ Use first variant's price if available
  const displayPrice = product.hasVariants && product.colorVariants?.[0]
    ? product.colorVariants[0].price
    : product.price;
  const displayDiscountPrice = product.hasVariants && product.colorVariants?.[0]
    ? product.colorVariants[0].discountPrice
    : product.discountPrice;

  const price    = displayDiscountPrice || displayPrice;
  const discount = displayDiscountPrice
    ? Math.round(((displayPrice - displayDiscountPrice) / displayPrice) * 100)
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

        <div className={styles.relatedBadges}>
          {discount > 0 && (
            <span className={styles.relatedDiscount}>-{discount}%</span>
          )}
          {product.isTrending && (
            <span className={styles.relatedTrending}>🔥</span>
          )}
          {product.hasVariants && product.colorVariants?.length > 1 && (
            <span style={{
              background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)',
              color: 'white',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: '800',
            }}>
              🎨 {product.colorVariants.length} Colors
            </span>
          )}
        </div>

        <button
          className={`${styles.relatedWish} ${inWishlist ? styles.relatedWishOn : ''}`}
          onClick={handleWish}
          aria-label="Wishlist"
        >
          {inWishlist ? '❤️' : '🤍'}
        </button>

        {product.stock === 0 && (
          <div className={styles.relatedOos}>Out of Stock</div>
        )}
      </div>

      <div className={styles.relatedInfo}>
        <p className={styles.relatedCat}>{product.category?.name || ''}</p>
        <h3 className={styles.relatedName}>{product.name}</h3>

        {/* Mini color swatches preview */}
        {product.hasVariants && product.colorVariants?.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '6px',
          }}>
            {product.colorVariants.slice(0, 5).map((v, i) => (
              <div key={i} style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: v.colorHex,
                border: '1.5px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} title={v.colorName} />
            ))}
            {product.colorVariants.length > 5 && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                color: '#9585B0',
                marginLeft: '4px',
              }}>+{product.colorVariants.length - 5}</span>
            )}
          </div>
        )}

        <div className={styles.relatedPriceRow}>
          <span className={styles.relatedPrice}>
            ₹{price?.toLocaleString('en-IN')}
          </span>
          {displayDiscountPrice && (
            <span className={styles.relatedOldPrice}>
              ₹{displayPrice?.toLocaleString('en-IN')}
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