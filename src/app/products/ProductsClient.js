'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import styles from './ProductsClient.module.css';
import React from 'react';

const SORT_OPTIONS = [
  { value: 'createdAt-desc',       label: '✨ Newest First',          icon: '✨' },
  { value: 'createdAt-asc',        label: '📅 Oldest First',          icon: '📅' },
  { value: 'price-asc',            label: '💰 Price: Low to High',    icon: '⬆️' },
  { value: 'price-desc',           label: '💰 Price: High to Low',    icon: '⬇️' },
  { value: 'discountPercent-desc', label: '🔥 Discount: High to Low', icon: '🎯' },
  { value: 'rating-desc',          label: '⭐ Top Rated',              icon: '⭐' },
  { value: 'name-asc',             label: '🔤 Name: A to Z',          icon: '🔤' },
  { value: 'name-desc',            label: '🔤 Name: Z to A',          icon: '🔠' },
];

const CATEGORY_ORDER = [
  'clothing', 'personal-care', 'health-care', 'walkers',
  'toys', 'cradles-cribs', 'electric-vehicles', 'food',
];

const CATEGORY_ICONS = {
  'all':               '🌟',
  'clothing':          '👗',
  'personal-care':     '🧴',
  'health-care':       '💊',
  'baby-gear':         '🎒',
  'walkers':           '🚶',
  'toys':              '🎠',
  'cradles-cribs':     '🛏️',
  'electric-vehicles': '🚗',
  'food':              '🍎',
  'default':           '📦',
};

const DISCOUNT_TIERS = [
  { value: '10', label: '10% or more', color: '#F59E0B' },
  { value: '20', label: '20% or more', color: '#F97316' },
  { value: '30', label: '30% or more', color: '#EF4444' },
  { value: '50', label: '50% or more', color: '#DC2626' },
];

const RATING_OPTIONS = [
  { value: '4', label: '4★ & above', stars: '⭐⭐⭐⭐' },
  { value: '3', label: '3★ & above', stars: '⭐⭐⭐' },
  { value: '2', label: '2★ & above', stars: '⭐⭐' },
];

const EXCLUDED_SLUGS = ['maternity', 'nursery'];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function ParallaxOrb({ className }) {
  const ref = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      ref.current.style.transform = `translateY(${window.scrollY * 0.18}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div ref={ref} className={className} />;
}

function RevealCard({ children, delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.revealCard} ${visible ? styles.revealIn : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   AUTO SCROLL CATEGORY BAR
============================================================ */
function AutoScrollCatBar({ categories, filters, handleCategoryClick, catLoading }) {
  const trackRef = useRef(null);
  const isPaused = useRef(false);
  const posRef   = useRef(0);
  const rafRef   = useRef(null);
  const SPEED    = 0.5;

  const allItems = [
    { id: '', slug: 'all', name: 'All', icon: '🌟', productCount: 0 },
    ...categories,
  ];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || catLoading || allItems.length <= 1) return;

    const step = () => {
      if (!isPaused.current) {
        posRef.current += SPEED;
        const halfWidth = track.scrollWidth / 2;
        if (posRef.current >= halfWidth) posRef.current = 0;
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [catLoading, categories.length]);

  const pause  = () => { isPaused.current = true;  };
  const resume = () => { isPaused.current = false; };

  const isCatActive = (cat) =>
    cat.id === '' ? !filters.category : filters.category === cat.id;

  if (catLoading) {
    return (
      <div className={styles.autoScrollWrap}>
        <div className={styles.autoScrollTrack}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.mobileCatSkeleton} />
          ))}
        </div>
      </div>
    );
  }

  const doubled = [...allItems, ...allItems];

  return (
    <div className={styles.autoScrollWrap}>
      <div className={styles.autoScrollFadeLeft} />
      <div
        className={styles.autoScrollTrackWrap}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        <div ref={trackRef} className={styles.autoScrollTrack}>
          {doubled.map((cat, i) => (
            <button
              key={`${cat.id || 'all'}-${i}`}
              className={`${styles.mobileCatPill} ${isCatActive(cat) ? styles.mobileCatPillActive : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <span className={styles.mobileCatIcon}>
                {cat.icon || CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS.default}
              </span>
              <span className={styles.mobileCatLabel}>{cat.name}</span>
              {cat.productCount > 0 && (
                <span className={styles.mobileCatCount}>{cat.productCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.autoScrollFadeRight} />
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function ProductsClient() {
  const searchParams = useSearchParams();

  const [products,      setProducts]      = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [brands,        setBrands]        = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [catLoading,    setCatLoading]    = useState(true);
  const [pagination,    setPagination]    = useState({ page: 1, pages: 1, total: 0 });
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [activeQuick,   setActiveQuick]   = useState('all');
  const [priceError,    setPriceError]    = useState('');

  const [localMin,   setLocalMin]   = useState('');
  const [localMax,   setLocalMax]   = useState('');
  const [appliedMin, setAppliedMin] = useState('');
  const [appliedMax, setAppliedMax] = useState('');

  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    brand:    '',
    sort:     'createdAt-desc',
    minPrice: '',
    maxPrice: '',
    featured: searchParams.get('featured') || '',
    trending: searchParams.get('trending') || '',
    discount: '',
    rating:   '',
    inStock:  false,
    page:     1,
  });

  /* ── Body scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  /* ── ESC key ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  /* ── Fetch categories ── */
  useEffect(() => {
    setCatLoading(true);
    fetch('/api/categories?withCount=true&all=true')
      .then(r => r.json())
      .then(d => {
        const allCats = d.categories || [];
        const filtered = allCats.filter(cat => !EXCLUDED_SLUGS.includes(cat.slug));
        filtered.sort((a, b) => {
          const aIdx = CATEGORY_ORDER.indexOf(a.slug);
          const bIdx = CATEGORY_ORDER.indexOf(b.slug);
          return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        });
        setCategories(filtered);
      })
      .catch(err => console.error('Failed to fetch categories:', err))
      .finally(() => setCatLoading(false));
  }, []);

  /* ── ✅ DYNAMIC BRAND FETCH — Based on category & other filters ── */
  useEffect(() => {
    const controller = new AbortController();

    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const paramObj = { limit: '500' };

        // ✅ Only pass filters that affect brand list (NOT brand itself!)
        if (filters.category)   paramObj.category = filters.category;
        if (filters.search)     paramObj.search   = filters.search;
        if (filters.featured)   paramObj.featured = filters.featured;
        if (filters.trending)   paramObj.trending = filters.trending;
        if (filters.minPrice)   paramObj.minPrice = filters.minPrice;
        if (filters.maxPrice)   paramObj.maxPrice = filters.maxPrice;
        if (filters.discount)   paramObj.discount = filters.discount;
        if (filters.rating)     paramObj.rating   = filters.rating;
        if (filters.inStock)    paramObj.inStock  = 'true';

        const url = `/api/products?${new URLSearchParams(paramObj)}`;
        console.log('🏷️ Fetching brands:', url);

        const res  = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        const allProducts = data.products || [];
        console.log(`📦 Got ${allProducts.length} products in scope`);

        const uniqueBrands = [...new Set(
          allProducts
            .map(p => p.brand?.trim())
            .filter(b => b && b !== '')
        )].sort((a, b) => a.localeCompare(b));

        console.log(`🏷️ Unique brands: ${uniqueBrands.length}`, uniqueBrands);

        setBrands(uniqueBrands);

        // ✅ Auto-clear brand if not available anymore
        if (filters.brand && !uniqueBrands.includes(filters.brand)) {
          console.log(`⚠️ Selected brand "${filters.brand}" not available — clearing`);
          setFilters(prev => ({ ...prev, brand: '', page: 1 }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('❌ Brand fetch error:', err);
          setBrands([]);
        }
      } finally {
        setBrandsLoading(false);
      }
    };

    fetchBrands();

    return () => controller.abort();
  }, [
    filters.category || '',
    filters.search   || '',
    filters.featured || '',
    filters.trending || '',
    filters.minPrice || '',
    filters.maxPrice || '',
    filters.discount || '',
    filters.rating   || '',
    !!filters.inStock,
  ]);

  /* ── Sync URL params ── */
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: searchParams.get('category') || '',
      search:   searchParams.get('search')   || '',
      featured: searchParams.get('featured') || '',
      trending: searchParams.get('trending') || '',
      page:     1,
    }));
  }, [searchParams]);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, sortOrder] = filters.sort.split('-');

      let minP = filters.minPrice !== '' ? parseFloat(filters.minPrice) : null;
      let maxP = filters.maxPrice !== '' ? parseFloat(filters.maxPrice) : null;
      if (minP !== null && maxP !== null && minP > maxP) [minP, maxP] = [maxP, minP];

      const paramObj = {
        page:  String(filters.page),
        limit: '12',
        sort:  sortField,
        order: sortOrder,
      };

      if (filters.search && filters.search.trim())  paramObj.search   = filters.search.trim();
      if (filters.category)                          paramObj.category = filters.category;
      if (filters.brand)                             paramObj.brand    = filters.brand;
      if (filters.featured)                          paramObj.featured = filters.featured;
      if (filters.trending)                          paramObj.trending = filters.trending;
      if (filters.discount)                          paramObj.discount = filters.discount;
      if (filters.rating)                            paramObj.rating   = filters.rating;
      if (filters.inStock)                           paramObj.inStock  = 'true';
      if (minP !== null)                             paramObj.minPrice = String(minP);
      if (maxP !== null)                             paramObj.maxPrice = String(maxP);

      const res  = await fetch(`/api/products?${new URLSearchParams(paramObj)}`);
      const data = await res.json();

      setProducts(data.products     || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Fetch products error:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Handlers ── */
  const updateFilter = (key, value) =>
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));

  const handleApplyPrice = () => {
    setPriceError('');
    const minVal = localMin.trim();
    const maxVal = localMax.trim();
    if (!minVal && !maxVal) { handleClearPrice(); return; }
    const min = minVal !== '' ? parseFloat(minVal) : null;
    const max = maxVal !== '' ? parseFloat(maxVal) : null;
    if (minVal !== '' && (isNaN(min) || min < 0)) {
      setPriceError('⚠️ Enter a valid min price'); return;
    }
    if (maxVal !== '' && (isNaN(max) || max < 0)) {
      setPriceError('⚠️ Enter a valid max price'); return;
    }
    let finalMin = min; let finalMax = max;
    if (finalMin !== null && finalMax !== null && finalMin > finalMax) {
      [finalMin, finalMax] = [finalMax, finalMin];
      setLocalMin(String(finalMin)); setLocalMax(String(finalMax));
      setPriceError('⚠️ Min > Max — values swapped!');
    }
    const minStr = finalMin !== null ? String(finalMin) : '';
    const maxStr = finalMax !== null ? String(finalMax) : '';
    setAppliedMin(minStr); setAppliedMax(maxStr);
    setFilters(prev => ({ ...prev, minPrice: minStr, maxPrice: maxStr, page: 1 }));
  };

  const handleClearPrice = () => {
    setPriceError('');
    setLocalMin(''); setLocalMax('');
    setAppliedMin(''); setAppliedMax('');
    setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '', page: 1 }));
  };

  const clearAll = () => {
    setPriceError('');
    setLocalMin(''); setLocalMax('');
    setAppliedMin(''); setAppliedMax('');
    setActiveQuick('all');
    setFilters({
      search: '', category: '', brand: '', sort: 'createdAt-desc',
      minPrice: '', maxPrice: '', featured: '', trending: '',
      discount: '', rating: '', inStock: false, page: 1,
    });
  };

  const handleCategoryClick = useCallback((categoryId) => {
    setFilters(prev => ({ ...prev, category: categoryId, brand: '', page: 1 }));
    setSidebarOpen(false);
    setActiveQuick('all');
  }, []);

  const isCategoryActive     = (cat) => filters.category === cat.id;
  const selectedCategory     = categories.find(c => c.id === filters.category);
  const selectedCategoryName = selectedCategory?.name || '';

  const pageTitle = filters.search
    ? `Results for "${filters.search}"`
    : filters.featured === 'true' ? 'Featured Products'
    : filters.trending === 'true' ? 'Trending Products'
    : selectedCategoryName || 'All Products';

  const quickFilters = [
    { key: 'all', label: 'All', icon: '🌟',
      action: () => { clearAll(); setActiveQuick('all'); },
    },
    { key: 'trending', label: 'Trending', icon: '🔥',
      action: () => {
        setFilters(prev => ({ ...prev, trending: 'true', featured: '', page: 1 }));
        setActiveQuick('trending');
      },
    },
    { key: 'featured', label: 'Featured', icon: '⭐',
      action: () => {
        setFilters(prev => ({ ...prev, featured: 'true', trending: '', page: 1 }));
        setActiveQuick('featured');
      },
    },
    { key: 'new', label: 'New Arrivals', icon: '✨',
      action: () => {
        setFilters(prev => ({ ...prev, sort: 'createdAt-desc', page: 1 }));
        setActiveQuick('new');
      },
    },
    { key: 'discount', label: 'Best Deals', icon: '💰',
      action: () => {
        setFilters(prev => ({ ...prev, discount: '20', sort: 'discountPercent-desc', page: 1 }));
        setActiveQuick('discount');
      },
    },
  ];

  const hasActiveFilters = !!(
    filters.category || filters.brand || filters.minPrice || filters.maxPrice ||
    filters.featured || filters.trending || filters.discount ||
    filters.rating || filters.inStock
  );

  const activeFilterCount = [
    filters.category, filters.brand, filters.minPrice || filters.maxPrice,
    filters.featured, filters.trending, filters.discount, filters.rating,
    filters.inStock ? 'stock' : '',
  ].filter(Boolean).length;

  /* ============================================================
     FILTER SIDEBAR CONTENT
  ============================================================ */
  const FilterContent = () => (
    <>
      {/* Category */}
      <div className={`${styles.filterBlock} ${styles.desktopCatBlock}`}>
        <div className={styles.filterBlockTitle}>
          <span className={styles.filterBlockIcon}>📂</span>
          Category
        </div>
        {catLoading ? (
          <div className={styles.catList}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={styles.catSkeleton} />
            ))}
          </div>
        ) : (
          <div className={styles.catList}>
            <button
              className={`${styles.catBtn} ${!filters.category ? styles.catBtnActive : ''}`}
              onClick={() => handleCategoryClick('')}
            >
              <span className={styles.catIcon}>🌟</span>
              <span className={styles.catName}>All Categories</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`${styles.catBtn} ${isCategoryActive(cat) ? styles.catBtnActive : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                <span className={styles.catIcon}>
                  {cat.icon || CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS.default}
                </span>
                <span className={styles.catName}>{cat.name}</span>
                {cat.productCount > 0 && (
                  <span className={styles.catCount}>{cat.productCount}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}>
          <span className={styles.filterBlockIcon}>💰</span>
          Price Range (₹)
        </div>
        <div className={styles.priceInputWrap}>
          <label className={styles.priceLabel}>Min Price ₹</label>
          <input
            type="number"
            value={localMin}
            onChange={e => { setLocalMin(e.target.value); setPriceError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleApplyPrice()}
            placeholder="e.g. 100"
            min="0"
            className={styles.priceInput}
          />
        </div>
        <div className={styles.priceInputWrap}>
          <label className={styles.priceLabel}>Max Price ₹</label>
          <input
            type="number"
            value={localMax}
            onChange={e => { setLocalMax(e.target.value); setPriceError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleApplyPrice()}
            placeholder="e.g. 999"
            min="0"
            className={styles.priceInput}
          />
        </div>
        {priceError && <div className={styles.priceError}>{priceError}</div>}
        <button className={styles.applyPriceBtn} onClick={handleApplyPrice}>
          🔍 Apply Price Filter
        </button>
        {(appliedMin || appliedMax) && (
          <div className={styles.appliedPrice}>
            <span>✅ ₹{appliedMin || '0'} — ₹{appliedMax || '∞'}</span>
            <button className={styles.clearPriceBtn} onClick={handleClearPrice}>Clear</button>
          </div>
        )}

        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {[
            { label: 'Under ₹500', min: '0',    max: '500'  },
            { label: '₹500-1000',  min: '500',  max: '1000' },
            { label: '₹1000-2000', min: '1000', max: '2000' },
            { label: 'Above ₹2000',min: '2000', max: ''     },
          ].map((r, i) => (
            <button
              key={i}
              onClick={() => {
                setLocalMin(r.min); setLocalMax(r.max);
                setAppliedMin(r.min); setAppliedMax(r.max);
                setFilters(prev => ({ ...prev, minPrice: r.min, maxPrice: r.max, page: 1 }));
              }}
              style={{
                padding: '5px 10px',
                background: (appliedMin === r.min && appliedMax === r.max) ? 'linear-gradient(135deg, #38BDF8, #0369A1)' : '#F1F5F9',
                color: (appliedMin === r.min && appliedMax === r.max) ? 'white' : '#475569',
                border: 'none',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ✅ DYNAMIC Brand Filter */}
      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}>
          <span className={styles.filterBlockIcon}>🏷️</span>
          Brand
          {!brandsLoading && brands.length > 0 && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '0.68rem',
              color: '#64748B',
              fontWeight: '700',
              background: '#F1F5F9',
              padding: '2px 8px',
              borderRadius: '999px',
            }}>
              {brands.length}
            </span>
          )}
        </div>

        {brandsLoading ? (
          <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                height: '36px',
                background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: '8px',
              }} />
            ))}
            <style>{`
              @keyframes shimmer {
                0%   { background-position: -200% 0; }
                100% { background-position:  200% 0; }
              }
            `}</style>
          </div>
        ) : brands.length > 0 ? (
          <>
            {(filters.category || filters.search) && (
              <div style={{
                padding: '8px 10px',
                background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)',
                border: '1px solid #BAE6FD',
                borderRadius: '8px',
                marginBottom: '8px',
                fontSize: '0.72rem',
                color: '#0369A1',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <span>ℹ️</span>
                <span>
                  {filters.category
                    ? `${brands.length} brand${brands.length > 1 ? 's' : ''} in this category`
                    : `${brands.length} matching brand${brands.length > 1 ? 's' : ''}`}
                </span>
              </div>
            )}

            <div style={{
              maxHeight: '240px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingRight: '4px',
            }}>
              <button
                onClick={() => updateFilter('brand', '')}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: !filters.brand ? 'linear-gradient(135deg, #38BDF8, #0369A1)' : 'white',
                  color: !filters.brand ? 'white' : '#334155',
                  border: '1.5px solid ' + (!filters.brand ? '#38BDF8' : '#E5E7EB'),
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>All Brands</span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  background: !filters.brand ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                  borderRadius: '999px',
                  fontWeight: '800',
                }}>
                  {brands.length}
                </span>
              </button>

              {brands.map(brand => (
                <button
                  key={brand}
                  onClick={() => updateFilter('brand', brand === filters.brand ? '' : brand)}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    background: filters.brand === brand ? 'linear-gradient(135deg, #38BDF8, #0369A1)' : 'white',
                    color: filters.brand === brand ? 'white' : '#334155',
                    border: '1.5px solid ' + (filters.brand === brand ? '#38BDF8' : '#E5E7EB'),
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                  onMouseEnter={e => {
                    if (filters.brand !== brand) {
                      e.currentTarget.style.background = '#F0F9FF';
                      e.currentTarget.style.borderColor = '#38BDF8';
                    }
                  }}
                  onMouseLeave={e => {
                    if (filters.brand !== brand) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }
                  }}
                >
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {brand}
                  </span>
                  {filters.brand === brand && (
                    <span style={{ fontSize: '0.86rem', flexShrink: 0 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            background: '#F8FAFC',
            borderRadius: '10px',
            border: '1px dashed #CBD5E1',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '6px' }}>🏷️</div>
            <p style={{
              margin: 0,
              fontSize: '0.80rem',
              fontWeight: '700',
              color: '#64748B',
            }}>
              No brands available
            </p>
            <p style={{
              margin: '4px 0 0',
              fontSize: '0.72rem',
              color: '#94A3B8',
              fontWeight: '600',
            }}>
              {filters.category
                ? 'No brands in this category'
                : 'Products don\'t have brand info'}
            </p>
          </div>
        )}
      </div>

      {/* Discount Filter */}
      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}>
          <span className={styles.filterBlockIcon}>🔥</span>
          Discount
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {DISCOUNT_TIERS.map(tier => (
            <button
              key={tier.value}
              onClick={() => updateFilter('discount', tier.value === filters.discount ? '' : tier.value)}
              style={{
                padding: '9px 12px',
                textAlign: 'left',
                background: filters.discount === tier.value ? tier.color : 'white',
                color: filters.discount === tier.value ? 'white' : '#334155',
                border: '1.5px solid ' + (filters.discount === tier.value ? tier.color : '#E5E7EB'),
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
            >
              <span>{tier.label}</span>
              {filters.discount === tier.value && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Rating Filter */}
      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}>
          <span className={styles.filterBlockIcon}>⭐</span>
          Customer Rating
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {RATING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateFilter('rating', opt.value === filters.rating ? '' : opt.value)}
              style={{
                padding: '9px 12px',
                textAlign: 'left',
                background: filters.rating === opt.value ? 'linear-gradient(135deg, #FBBF24, #F59E0B)' : 'white',
                color: filters.rating === opt.value ? 'white' : '#334155',
                border: '1.5px solid ' + (filters.rating === opt.value ? '#F59E0B' : '#E5E7EB'),
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
            >
              <span>{opt.stars} & above</span>
              {filters.rating === opt.value && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Toggles */}
      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}>
          <span className={styles.filterBlockIcon}>⚡</span>
          Quick Filters
        </div>
        <label className={styles.toggleRow}>
          <span>✅ In Stock Only</span>
          <div
            className={`${styles.toggle} ${filters.inStock ? styles.toggleOn : ''}`}
            onClick={() => updateFilter('inStock', !filters.inStock)}
          />
        </label>
        <label className={styles.toggleRow}>
          <span>⭐ Featured Only</span>
          <div
            className={`${styles.toggle} ${filters.featured === 'true' ? styles.toggleOn : ''}`}
            onClick={() => updateFilter('featured', filters.featured === 'true' ? '' : 'true')}
          />
        </label>
        <label className={styles.toggleRow}>
          <span>🔥 Trending Only</span>
          <div
            className={`${styles.toggle} ${filters.trending === 'true' ? styles.toggleOn : ''}`}
            onClick={() => updateFilter('trending', filters.trending === 'true' ? '' : 'true')}
          />
        </label>
      </div>
    </>
  );

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className={styles.pageRoot}>

      <ParallaxOrb className={styles.orb1} />
      <ParallaxOrb className={styles.orb2} />
      <ParallaxOrb className={styles.orb3} />

      <div className={styles.smokeWrap} aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={styles.smokePuff} style={{ '--i': i }} />
        ))}
      </div>

      {/* HERO STRIP */}
      <div className={styles.heroStrip}>
        <div className={styles.heroStripInner}>
          <div className={styles.heroStripLeft}>
            <span className={styles.heroCrumb}>Home › Products</span>
            <h1 className={styles.heroTitle}>
              {filters.featured === 'true' && <span className={styles.heroEmoji}>⭐</span>}
              {filters.trending === 'true' && <span className={styles.heroEmoji}>🔥</span>}
              {!filters.featured && !filters.trending && <span className={styles.heroEmoji}>🛍️</span>}
              <span>{pageTitle}</span>
            </h1>
            <p className={styles.heroSub}>
              <span className={styles.heroCount}>{pagination.total}</span>
              {' '}adorable products
              {selectedCategoryName && (
                <span className={styles.heroIn}> in {selectedCategoryName}</span>
              )}
            </p>
          </div>

          <div className={styles.quickPillsWrap}>
            <div className={styles.quickPills}>
              {quickFilters.map(q => (
                <button
                  key={q.key}
                  className={`${styles.quickPill} ${activeQuick === q.key ? styles.quickPillActive : ''}`}
                  onClick={q.action}
                >
                  <span>{q.icon}</span>
                  <span>{q.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.heroDecor1} />
        <div className={styles.heroDecor2} />
      </div>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>

          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              placeholder="Search products..."
              className={styles.searchInput}
            />
            {filters.search && (
              <button
                className={styles.searchClear}
                onClick={() => updateFilter('search', '')}
              >✕</button>
            )}
          </div>

          <div className={styles.toolbarRight}>
            <div className={styles.sortWrap}>
              <span className={styles.sortIcon}>↕</span>
              <select
                value={filters.sort}
                onChange={e => updateFilter('sort', e.target.value)}
                className={styles.sortSelect}
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <button
              className={`${styles.filterToggle} ${hasActiveFilters ? styles.filterToggleActive : ''}`}
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle filters"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="4"  y1="6"  x2="20" y2="6"  />
                <line x1="8"  y1="12" x2="20" y2="12" />
                <line x1="12" y1="18" x2="20" y2="18" />
                <circle cx="4"  cy="6"  r="2" fill="currentColor" stroke="none" />
                <circle cx="8"  cy="12" r="2" fill="currentColor" stroke="none" />
                <circle cx="12" cy="18" r="2" fill="currentColor" stroke="none" />
              </svg>
              <span className={styles.filterToggleText}>Filter</span>
              {activeFilterCount > 0 && (
                <span style={{
                  marginLeft: '6px',
                  padding: '2px 8px',
                  background: '#EF4444',
                  color: 'white',
                  borderRadius: '999px',
                  fontSize: '0.68rem',
                  fontWeight: '900',
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {hasActiveFilters && (
          <div className={styles.activeFiltersRow}>
            <div className={styles.activeFilterTags}>
              {filters.category && selectedCategoryName && (
                <span className={styles.activeTag}>
                  {CATEGORY_ICONS[selectedCategory?.slug] || '📦'} {selectedCategoryName}
                  <button onClick={() => handleCategoryClick('')}>✕</button>
                </span>
              )}
              {filters.brand && (
                <span className={styles.activeTag}>
                  🏷️ {filters.brand}
                  <button onClick={() => updateFilter('brand', '')}>✕</button>
                </span>
              )}
              {filters.featured === 'true' && (
                <span className={styles.activeTag}>
                  ⭐ Featured
                  <button onClick={() => updateFilter('featured', '')}>✕</button>
                </span>
              )}
              {filters.trending === 'true' && (
                <span className={styles.activeTag}>
                  🔥 Trending
                  <button onClick={() => updateFilter('trending', '')}>✕</button>
                </span>
              )}
              {filters.discount && (
                <span className={styles.activeTag}>
                  💰 {filters.discount}%+ off
                  <button onClick={() => updateFilter('discount', '')}>✕</button>
                </span>
              )}
              {filters.rating && (
                <span className={styles.activeTag}>
                  ⭐ {filters.rating}★ & above
                  <button onClick={() => updateFilter('rating', '')}>✕</button>
                </span>
              )}
              {filters.inStock && (
                <span className={styles.activeTag}>
                  ✅ In Stock
                  <button onClick={() => updateFilter('inStock', false)}>✕</button>
                </span>
              )}
              {(appliedMin || appliedMax) && (
                <span className={styles.activeTag}>
                  💰 ₹{appliedMin || '0'} – ₹{appliedMax || '∞'}
                  <button onClick={handleClearPrice}>✕</button>
                </span>
              )}
            </div>
            <button className={styles.clearAllTagBtn} onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* MOBILE CATEGORY BAR */}
      <div className={styles.mobileCatBar}>
        <AutoScrollCatBar
          categories={categories}
          filters={filters}
          handleCategoryClick={handleCategoryClick}
          catLoading={catLoading}
        />
        {filters.category && selectedCategoryName && (
          <div className={styles.activeCatBanner}>
            <span>
              {CATEGORY_ICONS[selectedCategory?.slug] || '📦'} Showing:{' '}
              <strong>{selectedCategoryName}</strong>
            </span>
            <button
              className={styles.activeCatClear}
              onClick={() => handleCategoryClick('')}
            >✕ Clear</button>
          </div>
        )}
      </div>

      {/* MAIN LAYOUT */}
      <div className={styles.container}>
        <div className={styles.layout}>

          {/* DESKTOP SIDEBAR */}
          <aside className={`${styles.sidebar} ${styles.sidebarDesktop}`}>
            <div className={styles.sidebarTop}>
              <div className={styles.sidebarTitle}>
                <span>🎛️</span>
                <span>Filters</span>
              </div>
              <button className={styles.clearAllBtn} onClick={clearAll}>
                Clear all
              </button>
            </div>

            <FilterContent />

            <div className={styles.sidebarBlob1} />
            <div className={styles.sidebarBlob2} />
          </aside>

          {/* PRODUCTS GRID */}
          <main className={styles.main}>
            {loading ? (
              <div className={styles.skeletonGrid}>
                {Array(12).fill(0).map((_, i) => (
                  <div key={i} className={styles.skeletonCard}>
                    <div className={styles.skeletonImg} />
                    <div className={styles.skeletonBody}>
                      <div className={styles.skeletonLine} style={{ width: '60%' }} />
                      <div className={styles.skeletonLine} style={{ width: '90%' }} />
                      <div className={styles.skeletonLine} style={{ width: '40%' }} />
                      <div className={styles.skeletonBtn} />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={styles.productsGrid}>
                  {products.map((p, i) => (
                    <RevealCard key={p.id} delay={Math.min(i % 6, 5) * 70}>
                      <ProductCard product={p} />
                    </RevealCard>
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      disabled={pagination.page === 1}
                      onClick={() => updateFilter('page', pagination.page - 1)}
                    >← Prev</button>

                    <div className={styles.pageNumbers}>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(p =>
                          p === 1 || p === pagination.pages ||
                          Math.abs(p - pagination.page) <= 1
                        )
                        .map((p, idx, arr) => (
                          <React.Fragment key={`page-${p}`}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <span className={styles.pageDots}>…</span>
                            )}
                            <button
                              className={`${styles.pageBtn} ${p === pagination.page ? styles.pageBtnActive : ''}`}
                              onClick={() => updateFilter('page', p)}
                            >{p}</button>
                          </React.Fragment>
                        ))}
                    </div>

                    <button
                      className={styles.pageBtn}
                      disabled={pagination.page === pagination.pages}
                      onClick={() => updateFilter('page', pagination.page + 1)}
                    >Next →</button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyOrb} />
                <span className={styles.emptyEmoji}>🔍</span>
                <h3>No products found</h3>
                <p>
                  {filters.search
                    ? `No results for "${filters.search}"`
                    : selectedCategoryName
                      ? `No products in "${selectedCategoryName}" yet`
                      : 'Try adjusting your filters 🧸'}
                </p>
                <button className={styles.emptyBtn} onClick={clearAll}>
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {sidebarOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setSidebarOpen(false)}
          />
          <aside className={`${styles.mobileDrawer} ${styles.mobileDrawerOpen}`}>
            <div className={styles.sidebarTop}>
              <div className={styles.sidebarTitle}>
                <span>🎛️</span>
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#EF4444',
                    color: 'white',
                    borderRadius: '999px',
                    fontSize: '0.68rem',
                    fontWeight: '900',
                    marginLeft: '4px',
                  }}>
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button className={styles.clearAllBtn} onClick={clearAll}>
                Clear all
              </button>
              <button
                className={styles.closeSidebar}
                onClick={() => setSidebarOpen(false)}
              >✕</button>
            </div>

            <FilterContent />
          </aside>
        </>
      )}
    </div>
  );
}