'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import styles from './ProductsClient.module.css';
import React from 'react';

const SORT_OPTIONS = [
  { value: 'createdAt-desc',       label: '✨ Newest First' },
  { value: 'createdAt-asc',        label: '📅 Oldest First' },
  { value: 'price-asc',            label: '💰 Price: Low to High' },
  { value: 'price-desc',           label: '💰 Price: High to Low' },
  { value: 'discountPercent-desc', label: '🔥 Discount: High to Low' },
  { value: 'rating-desc',          label: '⭐ Top Rated' },
  { value: 'name-asc',             label: '🔤 Name: A to Z' },
  { value: 'name-desc',            label: '🔤 Name: Z to A' },
];

const CATEGORY_ORDER = [
  'clothing', 'personal-care', 'health-care', 'walkers',
  'toys', 'cradles-cribs', 'electric-vehicles', 'food',
];

const CATEGORY_ICONS = {
  'all': '🌟', 'clothing': '👗', 'personal-care': '🧴',
  'health-care': '💊', 'baby-gear': '🎒', 'walkers': '🚶',
  'toys': '🎠', 'cradles-cribs': '🛏️', 'electric-vehicles': '🚗',
  'food': '🍎', 'default': '📦',
};

const DISCOUNT_TIERS = [
  { value: '10', label: '10% or more', color: '#F59E0B' },
  { value: '20', label: '20% or more', color: '#F97316' },
  { value: '30', label: '30% or more', color: '#EF4444' },
  { value: '50', label: '50% or more', color: '#DC2626' },
];

const RATING_OPTIONS = [
  { value: '4', stars: '⭐⭐⭐⭐' },
  { value: '3', stars: '⭐⭐⭐' },
  { value: '2', stars: '⭐⭐' },
];

const EXCLUDED_SLUGS = ['maternity', 'nursery'];

/* ============================================================
   INFINITE SCROLL TRIGGER
============================================================ */
function LoadMoreTrigger({ loading, onLoadMore }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || loading) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, onLoadMore]);

  return <div ref={ref} style={{ height: '1px', width: '100%' }} />;
}

/* ============================================================
   AUTO SCROLL CATEGORY BAR (Mobile)
============================================================ */
function AutoScrollCatBar({ categories, filters, handleCategoryClick, catLoading }) {
  const trackRef = useRef(null);
  const isPaused = useRef(false);
  const posRef = useRef(0);
  const rafRef = useRef(null);

  const allItems = [
    { id: '', slug: 'all', name: 'All', icon: '🌟', productCount: 0 },
    ...categories,
  ];

  useEffect(() => {
    const track = trackRef.current;
    if (!track || catLoading || allItems.length <= 1) return;
    const step = () => {
      if (!isPaused.current) {
        posRef.current += 0.5;
        const halfWidth = track.scrollWidth / 2;
        if (posRef.current >= halfWidth) posRef.current = 0;
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [catLoading, categories.length]);

  const isCatActive = (cat) =>
    cat.id === '' ? !filters.category : filters.category === cat.id;

  if (catLoading) {
    return (
      <div className={styles.autoScrollWrap}>
        <div className={styles.autoScrollTrack}>
          {[...Array(8)].map((_, i) => <div key={i} className={styles.mobileCatSkeleton} />)}
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
        onMouseEnter={() => { isPaused.current = true; }}
        onMouseLeave={() => { isPaused.current = false; }}
        onTouchStart={() => { isPaused.current = true; }}
        onTouchEnd={() => { isPaused.current = false; }}
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
  const pathname = usePathname();

  const [allProducts,   setAllProducts]   = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [brands,        setBrands]        = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [catLoading,    setCatLoading]    = useState(true);
  const [pagination,    setPagination]    = useState({ page: 1, pages: 1, total: 0 });
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [activeQuick,   setActiveQuick]   = useState('all');
  const [priceError,    setPriceError]    = useState('');

  const [localMin,   setLocalMin]   = useState(searchParams.get('minPrice') || '');
  const [localMax,   setLocalMax]   = useState(searchParams.get('maxPrice') || '');
  const [appliedMin, setAppliedMin] = useState(searchParams.get('minPrice') || '');
  const [appliedMax, setAppliedMax] = useState(searchParams.get('maxPrice') || '');

  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    brand:    searchParams.get('brand')    || '',
    sort:     searchParams.get('sort')     || 'createdAt-desc',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    featured: searchParams.get('featured') || '',
    trending: searchParams.get('trending') || '',
    discount: searchParams.get('discount') || '',
    rating:   searchParams.get('rating')   || '',
    inStock:  searchParams.get('inStock') === 'true',
    page:     1,
  });

  const prevFiltersRef = useRef(filters);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // ESC key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  // Fetch categories
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
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, []);

  // Dynamic brand fetch
  useEffect(() => {
    const controller = new AbortController();
    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const paramObj = {};
        if (filters.category) paramObj.category = filters.category;
        if (filters.search)   paramObj.search = filters.search;
        if (filters.featured) paramObj.featured = filters.featured;
        if (filters.trending) paramObj.trending = filters.trending;
        if (filters.minPrice) paramObj.minPrice = filters.minPrice;
        if (filters.maxPrice) paramObj.maxPrice = filters.maxPrice;
        if (filters.discount) paramObj.discount = filters.discount;
        if (filters.rating)   paramObj.rating = filters.rating;
        if (filters.inStock)  paramObj.inStock = 'true';

        const res = await fetch(`/api/products/brands?${new URLSearchParams(paramObj)}`, { signal: controller.signal });
        const data = await res.json();
        const uniqueBrands = data.brands || [];
        setBrands(uniqueBrands);
        if (filters.brand && !uniqueBrands.includes(filters.brand)) {
          setFilters(prev => ({ ...prev, brand: '', page: 1 }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
    return () => controller.abort();
  }, [
    filters.category || '', filters.search || '', filters.featured || '',
    filters.trending || '', filters.minPrice || '', filters.maxPrice || '',
    filters.discount || '', filters.rating || '', !!filters.inStock,
  ]);

  // Sync URL → filters
  useEffect(() => {
    const urlMin = searchParams.get('minPrice') || '';
    const urlMax = searchParams.get('maxPrice') || '';
    setFilters(prev => ({
      ...prev,
      category: searchParams.get('category') || '',
      search:   searchParams.get('search') || '',
      brand:    searchParams.get('brand') || '',
      featured: searchParams.get('featured') || '',
      trending: searchParams.get('trending') || '',
      discount: searchParams.get('discount') || '',
      rating:   searchParams.get('rating') || '',
      inStock:  searchParams.get('inStock') === 'true',
      sort:     searchParams.get('sort') || 'createdAt-desc',
      minPrice: urlMin,
      maxPrice: urlMax,
      page: 1,
    }));
    setLocalMin(urlMin);
    setLocalMax(urlMax);
    setAppliedMin(urlMin);
    setAppliedMax(urlMax);
    setAllProducts([]);
  }, [searchParams]);

  // Sync filters → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.featured === 'true') params.set('featured', 'true');
    if (filters.trending === 'true') params.set('trending', 'true');
    if (filters.discount) params.set('discount', filters.discount);
    if (filters.rating) params.set('rating', filters.rating);
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.sort && filters.sort !== 'createdAt-desc') params.set('sort', filters.sort);

    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    const cur = window.location.pathname + window.location.search;
    if (cur !== newUrl) window.history.replaceState({}, '', newUrl);
  }, [
    filters.category, filters.search, filters.brand, filters.minPrice,
    filters.maxPrice, filters.featured, filters.trending, filters.discount,
    filters.rating, filters.inStock, filters.sort, pathname,
  ]);

  // ✅ Fetch products (supports load more)
  const fetchProducts = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const [sortField, sortOrder] = filters.sort.split('-');
      let minP = filters.minPrice ? parseFloat(filters.minPrice) : null;
      let maxP = filters.maxPrice ? parseFloat(filters.maxPrice) : null;
      if (minP !== null && maxP !== null && minP > maxP) [minP, maxP] = [maxP, minP];

      const paramObj = {
        page: String(filters.page),
        limit: '24',
        sort: sortField,
        order: sortOrder,
      };

      if (filters.search?.trim()) paramObj.search = filters.search.trim();
      if (filters.category)       paramObj.category = filters.category;
      if (filters.brand)          paramObj.brand = filters.brand;
      if (filters.featured)       paramObj.featured = filters.featured;
      if (filters.trending)       paramObj.trending = filters.trending;
      if (filters.discount)       paramObj.discount = filters.discount;
      if (filters.rating)         paramObj.rating = filters.rating;
      if (filters.inStock)        paramObj.inStock = 'true';
      if (minP !== null)          paramObj.minPrice = String(minP);
      if (maxP !== null)          paramObj.maxPrice = String(maxP);

      const res = await fetch(`/api/products?${new URLSearchParams(paramObj)}`);
      const data = await res.json();
      const newProducts = data.products || [];

      if (isLoadMore) {
        setAllProducts(prev => {
          const ids = new Set(prev.map(p => p.id));
          const unique = newProducts.filter(p => !ids.has(p.id));
          return [...prev, ...unique];
        });
      } else {
        setAllProducts(newProducts);
      }

      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Fetch error:', err);
      if (!isLoadMore) setAllProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  // ✅ Smart fetch — detect load more vs fresh
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const isPageOnly = prev && filters.page !== prev.page &&
      filters.search === prev.search && filters.category === prev.category &&
      filters.brand === prev.brand && filters.sort === prev.sort &&
      filters.featured === prev.featured && filters.trending === prev.trending &&
      filters.discount === prev.discount && filters.rating === prev.rating &&
      filters.inStock === prev.inStock && filters.minPrice === prev.minPrice &&
      filters.maxPrice === prev.maxPrice;

    if (isPageOnly && filters.page > 1) {
      fetchProducts(true);
    } else {
      fetchProducts(false);
    }
    prevFiltersRef.current = { ...filters };
  }, [filters]);

  // ✅ Load more handler
  const loadMoreProducts = useCallback(() => {
    if (loadingMore || pagination.page >= pagination.pages) return;
    setFilters(prev => ({ ...prev, page: prev.page + 1 }));
  }, [loadingMore, pagination]);

  // Handlers
  const updateFilter = (key, value) => {
    if (key !== 'page') setAllProducts([]);
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));
  };

  const handleApplyPrice = () => {
    setPriceError('');
    const minVal = localMin.trim();
    const maxVal = localMax.trim();
    if (!minVal && !maxVal) { handleClearPrice(); return; }
    const min = minVal ? parseFloat(minVal) : null;
    const max = maxVal ? parseFloat(maxVal) : null;
    if (minVal && (isNaN(min) || min < 0)) { setPriceError('Invalid min'); return; }
    if (maxVal && (isNaN(max) || max < 0)) { setPriceError('Invalid max'); return; }
    let fMin = min, fMax = max;
    if (fMin !== null && fMax !== null && fMin > fMax) {
      [fMin, fMax] = [fMax, fMin];
      setLocalMin(String(fMin)); setLocalMax(String(fMax));
    }
    const ms = fMin !== null ? String(fMin) : '';
    const xs = fMax !== null ? String(fMax) : '';
    setAppliedMin(ms); setAppliedMax(xs);
    setAllProducts([]);
    setFilters(prev => ({ ...prev, minPrice: ms, maxPrice: xs, page: 1 }));
  };

  const handleClearPrice = () => {
    setPriceError('');
    setLocalMin(''); setLocalMax(''); setAppliedMin(''); setAppliedMax('');
    setAllProducts([]);
    setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '', page: 1 }));
  };

  const clearAll = () => {
    setPriceError('');
    setLocalMin(''); setLocalMax(''); setAppliedMin(''); setAppliedMax('');
    setActiveQuick('all');
    setAllProducts([]);
    setFilters({
      search: '', category: '', brand: '', sort: 'createdAt-desc',
      minPrice: '', maxPrice: '', featured: '', trending: '',
      discount: '', rating: '', inStock: false, page: 1,
    });
  };

  const handleCategoryClick = useCallback((categoryId) => {
    setAllProducts([]);
    setFilters(prev => ({ ...prev, category: categoryId, brand: '', page: 1 }));
    setSidebarOpen(false);
    setActiveQuick('all');
  }, []);

  const isCategoryActive = (cat) => filters.category === cat.id;
  const selectedCategory = categories.find(c => c.id === filters.category);
  const selectedCategoryName = selectedCategory?.name || '';

  const pageTitle = filters.search
    ? `Results for "${filters.search}"`
    : filters.featured === 'true' ? 'Featured Products'
    : filters.trending === 'true' ? 'Trending Products'
    : selectedCategoryName || 'All Products';

  const quickFilters = [
    { key: 'all', label: 'All', icon: '🌟', action: () => { clearAll(); setActiveQuick('all'); } },
    { key: 'trending', label: 'Trending', icon: '🔥', action: () => { setAllProducts([]); setFilters(prev => ({ ...prev, trending: 'true', featured: '', page: 1 })); setActiveQuick('trending'); } },
    { key: 'featured', label: 'Featured', icon: '⭐', action: () => { setAllProducts([]); setFilters(prev => ({ ...prev, featured: 'true', trending: '', page: 1 })); setActiveQuick('featured'); } },
    { key: 'new', label: 'New', icon: '✨', action: () => { setFilters(prev => ({ ...prev, sort: 'createdAt-desc', page: 1 })); setActiveQuick('new'); } },
    { key: 'deals', label: 'Deals', icon: '💰', action: () => { setAllProducts([]); setFilters(prev => ({ ...prev, discount: '20', sort: 'discountPercent-desc', page: 1 })); setActiveQuick('deals'); } },
  ];

  const hasActiveFilters = !!(
    filters.category || filters.brand || filters.minPrice || filters.maxPrice ||
    filters.featured || filters.trending || filters.discount || filters.rating || filters.inStock
  );

  const activeFilterCount = [
    filters.category, filters.brand, filters.minPrice || filters.maxPrice,
    filters.featured, filters.trending, filters.discount, filters.rating,
    filters.inStock ? 'x' : '',
  ].filter(Boolean).length;

  /* ============================================================
     FILTER CONTENT
  ============================================================ */
  const FilterContent = () => (
    <>
      <div className={`${styles.filterBlock} ${styles.desktopCatBlock}`}>
        <div className={styles.filterBlockTitle}><span className={styles.filterBlockIcon}>📂</span>Categories</div>
        {catLoading ? (
          <div className={styles.catList}>{[...Array(8)].map((_, i) => <div key={i} className={styles.catSkeleton} />)}</div>
        ) : (
          <div className={styles.catList}>
            <button className={`${styles.catBtn} ${!filters.category ? styles.catBtnActive : ''}`} onClick={() => handleCategoryClick('')}>
              <span className={styles.catIcon}>🌟</span><span className={styles.catName}>All</span>
            </button>
            {categories.map(cat => (
              <button key={cat.id} className={`${styles.catBtn} ${isCategoryActive(cat) ? styles.catBtnActive : ''}`} onClick={() => handleCategoryClick(cat.id)}>
                <span className={styles.catIcon}>{cat.icon || CATEGORY_ICONS[cat.slug] || '📦'}</span>
                <span className={styles.catName}>{cat.name}</span>
                {cat.productCount > 0 && <span className={styles.catCount}>({cat.productCount})</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}><span className={styles.filterBlockIcon}>🏷️</span>Brand</div>
        {brandsLoading ? (
          <div style={{ padding: '8px 0' }}>{[...Array(3)].map((_, i) => <div key={i} style={{ height: '30px', background: '#f5f5f5', borderRadius: '4px', marginBottom: '4px' }} />)}</div>
        ) : brands.length > 0 ? (
          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {brands.map(b => (
              <button key={b} onClick={() => updateFilter('brand', b === filters.brand ? '' : b)} style={{
                padding: '6px 8px', textAlign: 'left', background: filters.brand === b ? '#FFF0F5' : 'transparent',
                border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: filters.brand === b ? '800' : '600',
                color: filters.brand === b ? '#FF3F6C' : '#535766', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {b} {filters.brand === b && '✓'}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.78rem', color: '#94969F' }}>No brands</p>
        )}
      </div>

      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}><span className={styles.filterBlockIcon}>💰</span>Price</div>
        <div className={styles.priceInputWrap}>
          <input type="number" value={localMin} onChange={e => { setLocalMin(e.target.value); setPriceError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleApplyPrice()} placeholder="Min" min="0" className={styles.priceInput} />
        </div>
        <div className={styles.priceInputWrap}>
          <input type="number" value={localMax} onChange={e => { setLocalMax(e.target.value); setPriceError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleApplyPrice()} placeholder="Max" min="0" className={styles.priceInput} />
        </div>
        {priceError && <div className={styles.priceError}>{priceError}</div>}
        <button className={styles.applyPriceBtn} onClick={handleApplyPrice}>Apply</button>
        {(appliedMin || appliedMax) && (
          <div className={styles.appliedPrice}>
            <span>₹{appliedMin || '0'} — ₹{appliedMax || '∞'}</span>
            <button className={styles.clearPriceBtn} onClick={handleClearPrice}>✕</button>
          </div>
        )}
      </div>

      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}><span className={styles.filterBlockIcon}>🔥</span>Discount</div>
        {DISCOUNT_TIERS.map(t => (
          <button key={t.value} onClick={() => updateFilter('discount', t.value === filters.discount ? '' : t.value)} style={{
            display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left',
            background: filters.discount === t.value ? '#FFF0F5' : 'transparent',
            border: 'none', borderRadius: '4px', fontSize: '0.82rem',
            fontWeight: filters.discount === t.value ? '800' : '600',
            color: filters.discount === t.value ? '#FF3F6C' : '#535766',
            cursor: 'pointer', fontFamily: 'inherit', marginBottom: '2px',
          }}>
            {t.label} {filters.discount === t.value && '✓'}
          </button>
        ))}
      </div>

      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}><span className={styles.filterBlockIcon}>⭐</span>Rating</div>
        {RATING_OPTIONS.map(o => (
          <button key={o.value} onClick={() => updateFilter('rating', o.value === filters.rating ? '' : o.value)} style={{
            display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left',
            background: filters.rating === o.value ? '#FFF0F5' : 'transparent',
            border: 'none', borderRadius: '4px', fontSize: '0.82rem',
            fontWeight: filters.rating === o.value ? '800' : '600',
            color: filters.rating === o.value ? '#FF3F6C' : '#535766',
            cursor: 'pointer', fontFamily: 'inherit', marginBottom: '2px',
          }}>
            {o.stars} & above {filters.rating === o.value && '✓'}
          </button>
        ))}
      </div>

      <div className={styles.filterBlock}>
        <label className={styles.toggleRow}>
          <span>In Stock Only</span>
          <div className={`${styles.toggle} ${filters.inStock ? styles.toggleOn : ''}`}
            onClick={() => updateFilter('inStock', !filters.inStock)} />
        </label>
      </div>
    </>
  );

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className={styles.pageRoot}>

      {/* HERO */}
      <div className={styles.heroStrip}>
        <div className={styles.heroStripInner}>
          <div className={styles.heroStripLeft}>
            <span className={styles.heroCrumb}>Home / Products</span>
            <h1 className={styles.heroTitle}>
              <span>{pageTitle}</span>
              <span className={styles.heroSub}> - {pagination.total} items</span>
            </h1>
          </div>
          <div className={styles.quickPillsWrap}>
            <div className={styles.quickPills}>
              {quickFilters.map(q => (
                <button key={q.key}
                  className={`${styles.quickPill} ${activeQuick === q.key ? styles.quickPillActive : ''}`}
                  onClick={q.action}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontWeight: '800', fontSize: '0.84rem', color: '#282C3F', textTransform: 'uppercase' }}>Filters</span>
            {hasActiveFilters && (
              <button onClick={clearAll} className={styles.clearAllTagBtn}>Clear All</button>
            )}
          </div>

          <div className={styles.toolbarRight}>
            <div className={styles.sortWrap}>
              <span style={{ fontSize: '0.82rem', color: '#94969F', fontWeight: '600' }}>Sort by:</span>
              <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} className={styles.sortSelect}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button
              className={`${styles.filterToggle} ${hasActiveFilters ? styles.filterToggleActive : ''}`}
              onClick={() => setSidebarOpen(prev => !prev)}>
              <span>☰</span>
              <span className={styles.filterToggleText}>Filter</span>
              {activeFilterCount > 0 && (
                <span style={{ marginLeft: '4px', padding: '1px 6px', background: '#FF3F6C', color: 'white', borderRadius: '999px', fontSize: '0.66rem', fontWeight: '900' }}>
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
                <span className={styles.activeTag}>{selectedCategoryName}<button onClick={() => handleCategoryClick('')}>✕</button></span>
              )}
              {filters.brand && (
                <span className={styles.activeTag}>{filters.brand}<button onClick={() => updateFilter('brand', '')}>✕</button></span>
              )}
              {filters.discount && (
                <span className={styles.activeTag}>{filters.discount}% And Above<button onClick={() => updateFilter('discount', '')}>✕</button></span>
              )}
              {filters.rating && (
                <span className={styles.activeTag}>{filters.rating}★ & above<button onClick={() => updateFilter('rating', '')}>✕</button></span>
              )}
              {(appliedMin || appliedMax) && (
                <span className={styles.activeTag}>₹{appliedMin || '0'}-₹{appliedMax || '∞'}<button onClick={handleClearPrice}>✕</button></span>
              )}
              {filters.inStock && (
                <span className={styles.activeTag}>In Stock<button onClick={() => updateFilter('inStock', false)}>✕</button></span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE CATEGORY BAR */}
      <div className={styles.mobileCatBar}>
        <AutoScrollCatBar categories={categories} filters={filters} handleCategoryClick={handleCategoryClick} catLoading={catLoading} />
        {filters.category && selectedCategoryName && (
          <div className={styles.activeCatBanner}>
            <span>Showing: <strong>{selectedCategoryName}</strong></span>
            <button className={styles.activeCatClear} onClick={() => handleCategoryClick('')}>✕ Clear</button>
          </div>
        )}
      </div>

      {/* MAIN LAYOUT */}
      <div className={styles.container}>
        <div className={styles.layout}>

          {/* DESKTOP SIDEBAR */}
          <aside className={`${styles.sidebar} ${styles.sidebarDesktop}`}>
            <div className={styles.sidebarTop}>
              <div className={styles.sidebarTitle}>Filters</div>
              <button className={styles.clearAllBtn} onClick={clearAll}>Clear All</button>
            </div>
            <FilterContent />
          </aside>

          {/* PRODUCTS */}
          <main className={styles.main}>
            {loading && allProducts.length === 0 ? (
              <div className={styles.skeletonGrid}>
                {Array(24).fill(0).map((_, i) => (
                  <div key={i} className={styles.skeletonCard}>
                    <div className={styles.skeletonImg} />
                    <div className={styles.skeletonBody}>
                      <div className={styles.skeletonLine} style={{ width: '70%' }} />
                      <div className={styles.skeletonLine} style={{ width: '50%' }} />
                      <div className={styles.skeletonBtn} />
                    </div>
                  </div>
                ))}
              </div>
            ) : allProducts.length > 0 ? (
              <>
                <div className={styles.productsGrid}>
                  {allProducts.map((p) => (
                    <div key={p.id} style={{ height: '100%' }}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>

                {/* ✅ Infinite scroll trigger */}
                {pagination.page < pagination.pages && (
                  <LoadMoreTrigger loading={loadingMore} onLoadMore={loadMoreProducts} />
                )}

                {/* Loading more spinner */}
                {loadingMore && (
                  <div style={{
                    display: 'flex', justifyContent: 'center', padding: '24px 0',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      color: '#94969F', fontSize: '0.84rem', fontWeight: '700',
                    }}>
                      <div style={{
                        width: '22px', height: '22px',
                        border: '3px solid #E9E9ED',
                        borderTop: '3px solid #FF3F6C',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Loading more...
                    </div>
                  </div>
                )}

                {/* End message */}
                {pagination.page >= pagination.pages && (
                  <div style={{
                    textAlign: 'center', padding: '30px 20px',
                    color: '#94969F', fontSize: '0.82rem', fontWeight: '700',
                    borderTop: '1px solid #E9E9ED', marginTop: '20px',
                  }}>
                    You've seen all {pagination.total} products
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyEmoji}>🔍</span>
                <h3>No products found</h3>
                <p>
                  {filters.search ? `No results for "${filters.search}"`
                    : selectedCategoryName ? `No products in "${selectedCategoryName}"`
                    : 'Try adjusting your filters'}
                </p>
                <button className={styles.emptyBtn} onClick={clearAll}>Clear All Filters</button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {sidebarOpen && (
        <>
          <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
          <aside className={`${styles.mobileDrawer} ${styles.mobileDrawerOpen}`}>
            <div className={styles.sidebarTop}>
              <div className={styles.sidebarTitle}>Filters</div>
              <button className={styles.clearAllBtn} onClick={clearAll}>Clear All</button>
              <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <FilterContent />
          </aside>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}