'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import styles from './ProductDetailClient.module.css';
import ReviewsSection from '@/components/reviews/ReviewsSection';

export default function ProductDetailClient({ id }) {
  const [product,       setProduct]       = useState(null);
  const [related,       setRelated]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity,      setQuantity]      = useState(1);
  const [tab,           setTab]           = useState('description');
  const [imgLoaded,     setImgLoaded]     = useState(false);

  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize,     setSelectedSize]     = useState('');

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

        if (d.product?.hasVariants && d.product?.colorVariants?.[0]?.sizes?.length > 0) {
          setSelectedSize(d.product.colorVariants[0].sizes[0]);
        }

        if (d.product?.categoryId) {
          fetch(`/api/products?category=${d.product.categoryId}&limit=8&sort=createdAt&order=desc`)
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

  const hasVariants = product?.hasVariants && product?.colorVariants?.length > 0;
  const currentVariant = hasVariants ? product.colorVariants[selectedColorIdx] : null;

  const displayImages = useMemo(() => {
    if (hasVariants && currentVariant?.images?.length > 0) {
      return currentVariant.images;
    }
    return product?.images?.length > 0
      ? product.images
      : [{ url: `https://via.placeholder.com/500x500?text=${encodeURIComponent(product?.name || '')}` }];
  }, [hasVariants, currentVariant, product]);

  const currentPrice = hasVariants && currentVariant ? currentVariant.price : product?.price;
  const currentDiscountPrice = hasVariants && currentVariant ? currentVariant.discountPrice : product?.discountPrice;
  const finalPrice = currentDiscountPrice || currentPrice;
  const discount = currentDiscountPrice
    ? Math.round(((currentPrice - currentDiscountPrice) / currentPrice) * 100)
    : 0;
  const savedAmount = currentDiscountPrice ? currentPrice - currentDiscountPrice : 0;

  const currentStock = hasVariants && currentVariant ? currentVariant.stock : product?.stock;
  const currentSizes = hasVariants && currentVariant ? currentVariant.sizes || [] : [];

  const handleColorChange = (idx) => {
    setSelectedColorIdx(idx);
    setSelectedImage(0);
    setImgLoaded(false);
    setQuantity(1);
    setProgress(0);
    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);

    const newVariant = product?.colorVariants?.[idx];
    if (newVariant?.sizes?.length > 0) {
      setSelectedSize(newVariant.sizes[0]);
    } else {
      setSelectedSize('');
    }
  };

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

  const goToSlide = useCallback((index) => {
    setSelectedImage(index);
    setImgLoaded(false);
    setProgress(0);
    clearInterval(intervalRef.current);
    clearInterval(progressRef.current);
  }, []);

  const goPrev = () => goToSlide((selectedImage - 1 + displayImages.length) % displayImages.length);
  const goNext = () => goToSlide((selectedImage + 1) % displayImages.length);

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{
        width: '60px', height: '60px',
        border: '4px solid #F3E8FF', borderTop: '4px solid #7B2FBE',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#9585B0', fontWeight: '700' }}>Loading product...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>😕</div>
      <h2 style={{ color: '#2D1A4A', margin: '0 0 20px' }}>Product not found</h2>
      <Link href="/products" style={{
        display: 'inline-block', padding: '14px 32px',
        background: 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
        color: 'white', borderRadius: '14px', textDecoration: 'none',
        fontWeight: '800', boxShadow: '0 6px 20px rgba(255,107,53,0.30)',
      }}>Browse Products</Link>
    </div>
  );

  const handleAddToCart = () => {
    if (currentStock === 0) return;
    if (hasVariants && currentSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }

    const cartItem = {
      ...product,
      quantity,
      ...(hasVariants && currentVariant && {
        price: currentVariant.price,
        discountPrice: currentVariant.discountPrice,
        selectedColor: { name: currentVariant.colorName, hex: currentVariant.colorHex },
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

  const genderDisplay = {
    boy:    { label: 'Boy',    emoji: '👦', color: '#0EA5E9', bg: '#E0F2FE' },
    girl:   { label: 'Girl',   emoji: '👧', color: '#EC4899', bg: '#FDF2F8' },
    unisex: { label: 'Unisex', emoji: '🧒', color: '#7B2FBE', bg: '#F3E8FF' },
  };

  const genderInfo = product.gender
    ? genderDisplay[product.gender.toLowerCase()] || { label: product.gender, emoji: '🧒', color: '#7B2FBE', bg: '#F3E8FF' }
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FAFBFF 0%, #FFF5F7 100%)',
      fontFamily: 'Nunito, sans-serif',
    }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: 'clamp(16px, 3vw, 32px) 20px' }}>

        {/* ── BREADCRUMB ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', background: 'white',
          border: '1.5px solid #F3E8FF', borderRadius: '12px',
          marginBottom: '20px', fontSize: '0.82rem',
          flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(123,47,190,0.05)',
        }}>
          <Link href="/" style={{ color: '#7B2FBE', textDecoration: 'none', fontWeight: '700' }}>🏠 Home</Link>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <Link href="/products" style={{ color: '#7B2FBE', textDecoration: 'none', fontWeight: '700' }}>Products</Link>
          {product.category && (
            <>
              <span style={{ color: '#CBD5E1' }}>›</span>
              <Link href={`/products?category=${product.category?.id}`} style={{ color: '#7B2FBE', textDecoration: 'none', fontWeight: '700' }}>
                {product.category.name}
              </Link>
            </>
          )}
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span style={{ color: '#6B7280', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
            {product.name}
          </span>
        </nav>

        {/* ══ MAIN PRODUCT CARD ══ */}
        <div style={{
          background: 'white', borderRadius: '24px',
          padding: 'clamp(16px, 2.5vw, 28px)',
          boxShadow: '0 10px 40px rgba(123,47,190,0.08)',
          border: '1px solid rgba(123,47,190,0.06)',
          marginBottom: '20px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 'clamp(20px, 4vw, 40px)',
          }} className="productLayout">

            {/* ═══ IMAGES SECTION ═══ */}
            <div>
              {/* Main Image */}
              <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: 'linear-gradient(135deg, #FAFAFA, #F3F4F6)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '2px solid #F3E8FF',
                  marginBottom: '16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                }}
              >
                {!imgLoaded && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '4rem', opacity: 0.3,
                  }}>🖼️</div>
                )}

                <Image
                  src={displayImages[selectedImage]?.url || displayImages[0]?.url}
                  alt={product.name}
                  width={600}
                  height={600}
                  onLoad={() => setImgLoaded(true)}
                  priority
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: imgLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    padding: '20px',
                  }}
                />

                {/* Badges */}
                <div style={{
                  position: 'absolute', top: '16px', left: '16px',
                  display: 'flex', flexDirection: 'column', gap: '6px',
                }}>
                  {discount > 0 && (
                    <span style={{
                      padding: '6px 14px',
                      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      color: 'white', borderRadius: '10px',
                      fontSize: '0.82rem', fontWeight: '900',
                      boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                    }}>
                      -{discount}% OFF
                    </span>
                  )}
                  {product.isTrending && (
                    <span style={{
                      padding: '6px 14px',
                      background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                      color: 'white', borderRadius: '10px',
                      fontSize: '0.82rem', fontWeight: '900',
                      boxShadow: '0 4px 12px rgba(255,107,53,0.35)',
                    }}>
                      🔥 Trending
                    </span>
                  )}
                  {product.isFeatured && (
                    <span style={{
                      padding: '6px 14px',
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: 'white', borderRadius: '10px',
                      fontSize: '0.82rem', fontWeight: '900',
                      boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
                    }}>
                      ⭐ Featured
                    </span>
                  )}
                </div>

                {/* Wishlist button on image */}
                <button
                  onClick={handleWishlist}
                  style={{
                    position: 'absolute', top: '16px', right: '16px',
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'white', border: 'none',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    cursor: 'pointer', fontSize: '1.4rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {inWishlist ? '❤️' : '🤍'}
                </button>

                {/* Navigation arrows */}
                {displayImages.length > 1 && (
                  <>
                    <button onClick={goPrev} style={{
                      position: 'absolute', left: '16px', top: '50%',
                      transform: 'translateY(-50%)',
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'white', border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      cursor: 'pointer', fontSize: '1.4rem', fontWeight: '900',
                      color: '#7B2FBE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>‹</button>
                    <button onClick={goNext} style={{
                      position: 'absolute', right: '16px', top: '50%',
                      transform: 'translateY(-50%)',
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'white', border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      cursor: 'pointer', fontSize: '1.4rem', fontWeight: '900',
                      color: '#7B2FBE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>›</button>
                  </>
                )}

                {/* Image counter */}
                {displayImages.length > 1 && (
                  <div style={{
                    position: 'absolute', bottom: '16px', right: '16px',
                    padding: '6px 12px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white', borderRadius: '999px',
                    fontSize: '0.78rem', fontWeight: '800',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {selectedImage + 1} / {displayImages.length}
                  </div>
                )}

                {/* Progress bar */}
                {displayImages.length > 1 && !isHovered && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: '3px', background: 'rgba(0,0,0,0.1)',
                  }}>
                    <div style={{
                      width: `${progress}%`, height: '100%',
                      background: 'linear-gradient(90deg, #FF6B35, #7B2FBE)',
                      transition: 'width 0.03s linear',
                    }} />
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {displayImages.length > 1 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(displayImages.length, 5)}, 1fr)`,
                  gap: '10px',
                }}>
                  {displayImages.slice(0, 5).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      style={{
                        aspectRatio: '1 / 1',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: `2.5px solid ${i === selectedImage ? '#7B2FBE' : '#E5E7EB'}`,
                        background: '#FAFAFA',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.2s',
                        boxShadow: i === selectedImage ? '0 4px 12px rgba(123,47,190,0.25)' : 'none',
                        transform: i === selectedImage ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <Image
                        src={img.url}
                        alt={`${product.name} ${i + 1}`}
                        width={120}
                        height={120}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ INFO SECTION ═══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Category + Brand */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.category && (
                  <Link
                    href={`/products?category=${product.category?.id}`}
                    style={{
                      padding: '5px 14px',
                      background: 'linear-gradient(135deg, #F3E8FF, #EDE9FE)',
                      color: '#7B2FBE', borderRadius: '999px',
                      textDecoration: 'none', fontSize: '0.75rem',
                      fontWeight: '800', border: '1.5px solid #E9D5FF',
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}
                  >
                    📁 {product.category.name}
                  </Link>
                )}
                {product.brand && (
                  <span style={{
                    padding: '5px 14px',
                    background: 'linear-gradient(135deg, #FFF3EC, #FFE4CC)',
                    color: '#FF6B35', borderRadius: '999px',
                    fontSize: '0.75rem', fontWeight: '800',
                    border: '1.5px solid #FED7AA',
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>
                    🏷️ {product.brand}
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h1 style={{
                fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
                fontWeight: '900',
                color: '#1F0F3A',
                margin: 0,
                lineHeight: 1.25,
              }}>
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '8px 14px', background: '#FFFBEB',
                  border: '1.5px solid #FDE68A', borderRadius: '10px',
                  width: 'fit-content',
                }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{
                        fontSize: '1rem',
                        color: s <= Math.round(product.rating) ? '#FBBF24' : '#E5E7EB',
                      }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#78350F' }}>
                    {product.rating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#92400E', fontWeight: '700' }}>
                    · {product.numReviews} reviews
                  </span>
                </div>
              )}

              {/* Price Section */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #FFF5F7, #F3E8FF)',
                borderRadius: '16px',
                border: '1.5px solid #FFE4EC',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    lineHeight: 1,
                  }}>
                    ₹{finalPrice?.toLocaleString('en-IN')}
                  </span>
                  {currentDiscountPrice && (
                    <>
                      <span style={{
                        fontSize: '1.1rem',
                        color: '#9CA3AF',
                        textDecoration: 'line-through',
                        fontWeight: '600',
                      }}>
                        ₹{currentPrice?.toLocaleString('en-IN')}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: 'white', borderRadius: '999px',
                        fontSize: '0.85rem', fontWeight: '900',
                        boxShadow: '0 3px 8px rgba(16,185,129,0.30)',
                      }}>
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                {savedAmount > 0 && (
                  <p style={{
                    margin: '8px 0 0',
                    fontSize: '0.85rem',
                    color: '#059669',
                    fontWeight: '800',
                  }}>
                    🎉 You save ₹{savedAmount.toLocaleString('en-IN')}
                  </p>
                )}
                <p style={{
                  margin: '4px 0 0',
                  fontSize: '0.72rem',
                  color: '#9585B0',
                  fontWeight: '600',
                }}>
                  Inclusive of all taxes
                </p>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p style={{
                  margin: 0,
                  fontSize: '0.92rem',
                  color: '#4B5563',
                  lineHeight: 1.6,
                  fontWeight: '500',
                  padding: '14px 16px',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  borderLeft: '4px solid #7B2FBE',
                }}>
                  {product.shortDescription}
                </p>
              )}

              {/* Color Variants */}
              {hasVariants && (
                <div style={{
                  padding: '16px 18px',
                  background: 'linear-gradient(135deg,#FBF7FF,#FFF)',
                  border: '2px solid #EDD9FF',
                  borderRadius: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '900', color: '#6B4E8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🎨 Color:
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#2D1A4A' }}>
                      {currentVariant?.colorName}
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      padding: '3px 10px',
                      background: '#F3E8FF',
                      color: '#7B2FBE',
                      borderRadius: '999px',
                      fontSize: '0.68rem',
                      fontWeight: '800',
                    }}>
                      {product.colorVariants.length} colors
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
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
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                            padding: '4px',
                            background: 'transparent', border: 'none',
                            cursor: outOfStock ? 'not-allowed' : 'pointer',
                            opacity: outOfStock ? 0.5 : 1,
                            fontFamily: 'inherit',
                          }}
                        >
                          <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: variant.colorHex || '#ccc',
                            border: `3px solid ${isSelected ? '#7B2FBE' : 'white'}`,
                            boxShadow: isSelected
                              ? '0 0 0 3px #7B2FBE, 0 6px 14px rgba(123,47,190,0.30)'
                              : '0 2px 8px rgba(0,0,0,0.12)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                          }}>
                            {isSelected && (
                              <span style={{
                                position: 'absolute', bottom: '-4px', right: '-4px',
                                background: '#22C55E', color: 'white',
                                width: '20px', height: '20px', borderRadius: '50%',
                                fontSize: '11px', fontWeight: '900',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid white',
                                boxShadow: '0 2px 6px rgba(34,197,94,0.35)',
                              }}>✓</span>
                            )}
                            {outOfStock && (
                              <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                background: 'rgba(255,255,255,0.7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: '900', color: '#DC2626',
                              }}>✕</div>
                            )}
                          </div>
                          <span style={{
                            fontSize: '0.68rem', fontWeight: '800',
                            color: isSelected ? '#7B2FBE' : '#6B4E8A',
                            maxWidth: '64px', textAlign: 'center', lineHeight: 1.1,
                          }}>
                            {variant.colorName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Picker */}
              {hasVariants && currentSizes.length > 0 && (
                <div style={{
                  padding: '16px 18px',
                  background: 'linear-gradient(135deg,#FFF3EC,#FFF)',
                  border: '2px solid #FFD4B8',
                  borderRadius: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: '900', color: '#6B4E8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📏 Size:
                    </span>
                    {selectedSize && (
                      <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#FF6B35' }}>
                        {selectedSize}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {currentSizes.map(size => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: '2px solid',
                            borderColor: isSelected ? '#FF6B35' : '#FFD4B8',
                            background: isSelected ? 'linear-gradient(135deg,#FF6B35,#7B2FBE)' : 'white',
                            color: isSelected ? 'white' : '#6B4E8A',
                            fontWeight: '800',
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.2s',
                            minWidth: '52px',
                            boxShadow: isSelected ? '0 4px 12px rgba(255,107,53,0.25)' : 'none',
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Non-variant Clothing Details */}
              {!hasVariants && (product.gender || product.size || product.color || product.material || product.ageGroup) && (
                <div style={{
                  padding: '16px 18px',
                  background: 'white',
                  border: '2px solid #F3E8FF',
                  borderRadius: '14px',
                }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.88rem', fontWeight: '900', color: '#2D1A4A' }}>
                    📋 Product Details
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '10px',
                  }}>
                    {genderInfo && (
                      <div style={{
                        padding: '10px 12px', background: genderInfo.bg,
                        borderRadius: '10px', border: `1.5px solid ${genderInfo.color}30`,
                      }}>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: '#9585B0', fontWeight: '700', textTransform: 'uppercase' }}>
                          Gender
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.85rem', fontWeight: '900', color: genderInfo.color }}>
                          {genderInfo.emoji} {genderInfo.label}
                        </p>
                      </div>
                    )}
                    {product.size && (
                      <div style={{
                        padding: '10px 12px', background: '#F3E8FF',
                        borderRadius: '10px', border: '1.5px solid #DFC5F830',
                      }}>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: '#9585B0', fontWeight: '700', textTransform: 'uppercase' }}>
                          Size
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.85rem', fontWeight: '900', color: '#7B2FBE' }}>
                          📏 {product.size}
                        </p>
                      </div>
                    )}
                    {product.color && (
                      <div style={{
                        padding: '10px 12px', background: '#FFF3EC',
                        borderRadius: '10px', border: '1.5px solid #FFD4B830',
                      }}>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: '#9585B0', fontWeight: '700', textTransform: 'uppercase' }}>
                          Color
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.85rem', fontWeight: '900', color: '#FF6B35' }}>
                          🎨 {product.color}
                        </p>
                      </div>
                    )}
                    {product.material && (
                      <div style={{
                        padding: '10px 12px', background: '#F0FDF4',
                        borderRadius: '10px', border: '1.5px solid #BBF7D030',
                      }}>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: '#9585B0', fontWeight: '700', textTransform: 'uppercase' }}>
                          Material
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.85rem', fontWeight: '900', color: '#22C55E' }}>
                          🧵 {product.material}
                        </p>
                      </div>
                    )}
                    {product.ageGroup && (
                      <div style={{
                        padding: '10px 12px', background: '#FFFBEB',
                        borderRadius: '10px', border: '1.5px solid #FDE68A30',
                      }}>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: '#9585B0', fontWeight: '700', textTransform: 'uppercase' }}>
                          Age Group
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.85rem', fontWeight: '900', color: '#F59E0B' }}>
                          👶 {product.ageGroup}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div style={{
                padding: '12px 16px',
                background: currentStock > 0 ? 'linear-gradient(135deg, #F0FDF4, #D1FAE5)' : 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                border: `1.5px solid ${currentStock > 0 ? '#86EFAC' : '#FCA5A5'}`,
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
              }}>
                <span style={{
                  fontSize: '0.88rem',
                  fontWeight: '900',
                  color: currentStock > 0 ? '#065F46' : '#991B1B',
                }}>
                  {currentStock > 0
                    ? `✅ In Stock (${currentStock} available${hasVariants ? ` for ${currentVariant?.colorName}` : ''})`
                    : `❌ Out of Stock${hasVariants ? ` for ${currentVariant?.colorName}` : ''}`
                  }
                </span>
                {currentStock > 0 && currentStock <= 10 && (
                  <span style={{
                    padding: '4px 10px', background: '#F59E0B', color: 'white',
                    borderRadius: '999px', fontSize: '0.72rem', fontWeight: '900',
                  }}>
                    ⚠️ Only {currentStock} left!
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              {currentStock > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', background: '#F9FAFB',
                  borderRadius: '12px', border: '1.5px solid #E5E7EB',
                }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#374151' }}>
                    Quantity:
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: 'white', borderRadius: '10px',
                    border: '2px solid #E5E7EB',
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{
                        width: '38px', height: '38px', border: 'none',
                        background: 'white', cursor: 'pointer',
                        fontSize: '1.2rem', fontWeight: '900', color: '#7B2FBE',
                      }}
                    >−</button>
                    <span style={{
                      minWidth: '48px', textAlign: 'center',
                      fontSize: '1rem', fontWeight: '900', color: '#1F0F3A',
                      borderLeft: '2px solid #E5E7EB',
                      borderRight: '2px solid #E5E7EB',
                      padding: '8px 0',
                    }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                      style={{
                        width: '38px', height: '38px', border: 'none',
                        background: 'white', cursor: 'pointer',
                        fontSize: '1.2rem', fontWeight: '900', color: '#7B2FBE',
                      }}
                    >+</button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleAddToCart}
                  disabled={currentStock === 0}
                  style={{
                    flex: 1,
                    padding: '16px 24px',
                    background: currentStock === 0
                      ? '#F3F4F6'
                      : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                    color: currentStock === 0 ? '#9CA3AF' : 'white',
                    border: 'none', borderRadius: '14px',
                    fontSize: '1rem', fontWeight: '900',
                    cursor: currentStock === 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: currentStock === 0 ? 'none' : '0 8px 20px rgba(255,107,53,0.30)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => currentStock > 0 && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  🛒 {currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleWishlist}
                  style={{
                    padding: '16px 20px',
                    background: inWishlist ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'white',
                    color: inWishlist ? 'white' : '#EF4444',
                    border: `2px solid ${inWishlist ? '#EF4444' : '#FCA5A5'}`,
                    borderRadius: '14px',
                    fontSize: '1.4rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {inWishlist ? '❤️' : '🤍'}
                </button>
              </div>

              {/* Selection Summary */}
              {hasVariants && (currentVariant || selectedSize) && (
                <div style={{
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg,#F0FDF4,#FBF7FF)',
                  border: '1.5px solid #BBF7D0',
                  borderRadius: '12px',
                  display: 'flex', flexWrap: 'wrap', gap: '10px',
                  fontSize: '0.84rem', fontWeight: '800', color: '#166534',
                  alignItems: 'center',
                }}>
                  <span>✅ Selection:</span>
                  {currentVariant && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        display: 'inline-block', width: '14px', height: '14px',
                        borderRadius: '50%', background: currentVariant.colorHex,
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
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                padding: '16px',
                background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
                borderRadius: '14px',
                border: '1.5px solid #E5E7EB',
              }}>
                {[
                  { icon: '🛡️', title: 'Certified', sub: 'Safety Tested' },
                  { icon: '💚', title: '1M+', sub: 'Happy Parents' },
                  { icon: '👶', title: 'Safe for', sub: 'Newborns' },
                ].map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px', background: 'white',
                    borderRadius: '10px', border: '1px solid #F3E8FF',
                  }}>
                    <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>{h.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.76rem', fontWeight: '900', color: '#1F0F3A', lineHeight: 1.2 }}>
                        {h.title}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: '#6B4E8A', fontWeight: '700', lineHeight: 1.2 }}>
                        {h.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ TABS SECTION ══ */}
        <div style={{
          background: 'white', borderRadius: '24px',
          padding: 'clamp(16px, 2.5vw, 28px)',
          boxShadow: '0 8px 32px rgba(123,47,190,0.08)',
          border: '1px solid rgba(123,47,190,0.06)',
          marginBottom: '20px',
        }}>
          {/* Tab Headers */}
          <div style={{
            display: 'flex', gap: '8px',
            borderBottom: '2px solid #F3E8FF',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}>
            {[
              { key: 'description', icon: '📝', label: 'Description' },
              { key: 'specifications', icon: '📋', label: 'Specifications' },
              { key: 'reviews', icon: '⭐', label: 'Reviews' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '12px 20px',
                  background: tab === t.key ? 'linear-gradient(135deg, #FF6B35, #7B2FBE)' : 'transparent',
                  color: tab === t.key ? 'white' : '#6B7280',
                  border: 'none',
                  borderRadius: '12px 12px 0 0',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  position: 'relative',
                  bottom: '-2px',
                  boxShadow: tab === t.key ? '0 -4px 12px rgba(123,47,190,0.15)' : 'none',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {tab === 'description' && (
              <div>
                <p style={{
                  fontSize: '0.95rem', color: '#374151',
                  lineHeight: 1.8, margin: '0 0 20px', whiteSpace: 'pre-line',
                }}>
                  {product.description}
                </p>

                {product.features?.length > 0 && (
                  <>
                    <h4 style={{
                      fontSize: '1.05rem', fontWeight: '900',
                      color: '#1F0F3A', margin: '20px 0 12px',
                    }}>
                      ✨ Key Features
                    </h4>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '8px' }}>
                      {product.features.map((f, i) => (
                        <li key={i} style={{
                          padding: '10px 14px',
                          background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)',
                          border: '1px solid #BBF7D0',
                          borderRadius: '10px',
                          display: 'flex', alignItems: 'center', gap: '10px',
                          fontSize: '0.88rem', color: '#374151', fontWeight: '600',
                        }}>
                          <span style={{ fontSize: '1rem', flexShrink: 0 }}>✅</span> {f}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {product.tags?.length > 0 && (
                  <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {product.tags.map((tag, i) => (
                      <span key={i} style={{
                        padding: '5px 12px',
                        background: '#F3E8FF', color: '#7B2FBE',
                        borderRadius: '999px', fontSize: '0.75rem',
                        fontWeight: '700', border: '1.5px solid #E9D5FF',
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'specifications' && (
              <div>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                  <tbody>
                    {hasVariants && (
                      <>
                        <tr>
                          <td style={{
                            padding: '12px 14px', background: '#F9FAFB',
                            borderRadius: '10px 0 0 10px',
                            fontSize: '0.85rem', fontWeight: '800', color: '#6B4E8A',
                            width: '35%',
                          }}>Available Colors</td>
                          <td style={{
                            padding: '12px 14px', background: '#F9FAFB',
                            borderRadius: '0 10px 10px 0',
                          }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {product.colorVariants.map((v, i) => (
                                <span key={i} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '3px 10px', background: 'white',
                                  borderRadius: '999px', fontSize: '0.78rem',
                                  fontWeight: '700', border: '1.5px solid #E5E7EB',
                                }}>
                                  <span style={{
                                    display: 'inline-block', width: '12px', height: '12px',
                                    borderRadius: '50%', background: v.colorHex,
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
                            <td style={{
                              padding: '12px 14px', background: '#F9FAFB',
                              borderRadius: '10px 0 0 10px',
                              fontSize: '0.85rem', fontWeight: '800', color: '#6B4E8A',
                            }}>Sizes ({currentVariant?.colorName})</td>
                            <td style={{
                              padding: '12px 14px', background: '#F9FAFB',
                              borderRadius: '0 10px 10px 0',
                            }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {currentSizes.map(s => (
                                  <span key={s} style={{
                                    padding: '2px 10px', background: '#FFF3EC',
                                    borderRadius: '6px', fontSize: '0.8rem',
                                    fontWeight: '800', color: '#FF6B35',
                                  }}>{s}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                    {[
                      product.gender && ['Gender', `${product.gender === 'boy' ? '👦' : product.gender === 'girl' ? '👧' : '🧒'} ${product.gender.charAt(0).toUpperCase() + product.gender.slice(1)}`],
                      !hasVariants && product.size && ['Size', `📏 ${product.size}`],
                      !hasVariants && product.color && ['Color', `🎨 ${product.color}`],
                      product.material && ['Material', `🧵 ${product.material}`],
                      product.ageGroup && ['Age Group', `👶 ${product.ageGroup}`],
                      product.brand && ['Brand', `🏷️ ${product.brand}`],
                      product.weight && ['Weight', `⚖️ ${product.weight}g`],
                      product.sku && ['SKU', product.sku, true],
                    ].filter(Boolean).map(([key, val, mono], i) => (
                      <tr key={i}>
                        <td style={{
                          padding: '12px 14px', background: '#F9FAFB',
                          borderRadius: '10px 0 0 10px',
                          fontSize: '0.85rem', fontWeight: '800', color: '#6B4E8A',
                        }}>{key}</td>
                        <td style={{
                          padding: '12px 14px', background: '#F9FAFB',
                          borderRadius: '0 10px 10px 0',
                          fontSize: '0.85rem', color: '#1F2937', fontWeight: '600',
                          fontFamily: mono ? 'monospace' : 'inherit',
                        }}>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ✅ NEW: ReviewsSection Component */}
            {tab === 'reviews' && (
              <ReviewsSection productId={product.id} productName={product.name} />
            )}
          </div>
        </div>

        {/* ══ RELATED PRODUCTS ══ */}
        {related.length > 0 && (
          <section style={{
            background: 'white', borderRadius: '24px',
            padding: 'clamp(16px, 2.5vw, 28px)',
            boxShadow: '0 8px 32px rgba(123,47,190,0.08)',
            border: '1px solid rgba(123,47,190,0.06)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '20px', flexWrap: 'wrap', gap: '12px',
            }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)',
                  border: '1.5px solid #FFD4B8',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: '#FF6B35',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}>
                  {product.category?.name || 'Similar'}
                </span>
                <h2 style={{
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.7rem)',
                  fontWeight: '900',
                  color: '#1F0F3A',
                  margin: '0 0 4px',
                }}>
                  🛍️ You May Also Like
                </h2>
                <p style={{
                  margin: 0, fontSize: '0.82rem',
                  color: '#7B7898', fontWeight: '600',
                }}>
                  More products from {product.category?.name || 'this category'}
                </p>
              </div>
              <Link
                href={`/products?category=${product.categoryId}`}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                  color: 'white', borderRadius: '12px',
                  textDecoration: 'none', fontWeight: '800',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 12px rgba(255,107,53,0.25)',
                }}
              >
                View All →
              </Link>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}>
              {related.map((p, i) => (
                <RelatedCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .productLayout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   RELATED PRODUCT CARD (Modern Design)
   ============================================================ */
function RelatedCard({ product, index }) {
  const { addItem }              = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [adding,    setAdding]    = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const inWishlist = isWishlisted(product.id);

  const firstVariantImage = product.hasVariants && product.colorVariants?.[0]?.images?.[0]?.url;
  const imageUrl = firstVariantImage || product.images?.[0]?.url || null;

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'white',
        borderRadius: '16px',
        border: `2px solid ${isHovered ? '#7B2FBE' : '#F3E8FF'}`,
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 30px rgba(123,47,190,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
        animation: `slideUp 0.4s ease ${index * 60}ms both`,
      }}
    >
      <div style={{
        position: 'relative',
        aspectRatio: '1 / 1',
        background: 'linear-gradient(135deg, #FAFAFA, #F3F4F6)',
        overflow: 'hidden',
      }}>
        {!imgLoaded && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', opacity: 0.3,
          }}>🛍️</div>
        )}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            width={220}
            height={220}
            onLoad={() => setImgLoaded(true)}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: imgLoaded ? 1 : 0,
              transition: 'all 0.3s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', fontSize: '3rem', opacity: 0.4,
          }}>🛍️</div>
        )}

        {/* Badges */}
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          display: 'flex', flexDirection: 'column', gap: '5px',
        }}>
          {discount > 0 && (
            <span style={{
              padding: '4px 10px',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: 'white', borderRadius: '8px',
              fontSize: '0.7rem', fontWeight: '900',
              boxShadow: '0 3px 8px rgba(239,68,68,0.30)',
            }}>-{discount}%</span>
          )}
          {product.isTrending && (
            <span style={{
              padding: '4px 10px',
              background: 'linear-gradient(135deg, #FF6B35, #EA580C)',
              color: 'white', borderRadius: '8px',
              fontSize: '0.7rem', fontWeight: '900',
            }}>🔥 Hot</span>
          )}
          {product.hasVariants && product.colorVariants?.length > 1 && (
            <span style={{
              padding: '3px 8px',
              background: 'linear-gradient(135deg,#7B2FBE,#9B4FDE)',
              color: 'white', borderRadius: '8px',
              fontSize: '0.65rem', fontWeight: '900',
            }}>🎨 {product.colorVariants.length}</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWish}
          style={{
            position: 'absolute', top: '10px', right: '10px',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'white', border: 'none',
            boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {inWishlist ? '❤️' : '🤍'}
        </button>

        {product.stock === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', fontWeight: '900', color: '#DC2626',
          }}>
            Out of Stock
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        <p style={{
          margin: '0 0 4px', fontSize: '0.68rem',
          color: '#9585B0', fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          {product.category?.name || ''}
        </p>

        <h3 style={{
          margin: '0 0 8px', fontSize: '0.88rem',
          fontWeight: '800', color: '#1F0F3A',
          lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          minHeight: '2.3rem',
        }}>
          {product.name}
        </h3>

        {product.hasVariants && product.colorVariants?.length > 1 && (
          <div style={{ display: 'flex', gap: '3px', marginBottom: '8px' }}>
            {product.colorVariants.slice(0, 5).map((v, i) => (
              <div key={i} style={{
                width: '13px', height: '13px', borderRadius: '50%',
                background: v.colorHex, border: '1.5px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} title={v.colorName} />
            ))}
            {product.colorVariants.length > 5 && (
              <span style={{
                fontSize: '0.62rem', fontWeight: '700',
                color: '#9585B0', marginLeft: '3px',
              }}>+{product.colorVariants.length - 5}</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
          <span style={{
            fontSize: '1rem', fontWeight: '900',
            background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ₹{price?.toLocaleString('en-IN')}
          </span>
          {displayDiscountPrice && (
            <span style={{
              fontSize: '0.75rem',
              color: '#9CA3AF',
              textDecoration: 'line-through',
              fontWeight: '600',
            }}>
              ₹{displayPrice?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <button
          onClick={handleCart}
          disabled={product.stock === 0}
          style={{
            width: '100%', padding: '9px',
            background: product.stock === 0
              ? '#F3F4F6'
              : adding
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
            color: product.stock === 0 ? '#9CA3AF' : 'white',
            border: 'none', borderRadius: '10px',
            fontSize: '0.78rem', fontWeight: '900',
            cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: product.stock === 0 ? 'none' : '0 3px 10px rgba(255,107,53,0.25)',
          }}
        >
          {adding
            ? '✓ Added!'
            : product.stock === 0
              ? 'Out of Stock'
              : '🛒 Add to Cart'}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Link>
  );
}