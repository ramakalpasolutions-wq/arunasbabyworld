'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import styles from './ProductsClient.module.css';

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

const GENDER_OPTIONS = [
  { value: 'boy',    label: '👦 Boy',    color: '#0EA5E9' },
  { value: 'girl',   label: '👧 Girl',   color: '#EC4899' },
  { value: 'unisex', label: '👶 Unisex', color: '#10B981' },
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

const PRICE_MIN = 0;
const PRICE_MAX = 10000;
const PRICE_STEP = 50;

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
function AutoScrollCatBar({ categories, currentCategory, handleCategoryClick, catLoading }) {
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
    cat.id === '' ? !currentCategory : currentCategory === cat.id;

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
  const router = useRouter();

  // ✅ Build stable filter query string as string primitive to avoid loops
  const filterQueryString = searchParams.toString();

  // Parse filters as memoized object based on URL state
  const filters = useMemo(() => ({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    gender: searchParams.get('gender') || '',
    sort: searchParams.get('sort') || 'createdAt-desc',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    featured: searchParams.get('featured') || '',
    trending: searchParams.get('trending') || '',
    discount: searchParams.get('discount') || '',
    rating: searchParams.get('rating') || '',
    inStock: searchParams.get('inStock') === 'true',
  }), [filterQueryString]); // Only rebuild when URL changes

  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [catLoading, setCatLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeQuick, setActiveQuick] = useState('all');

  const [localMin, setLocalMin] = useState(filters.minPrice || String(PRICE_MIN));
  const [localMax, setLocalMax] = useState(filters.maxPrice || String(PRICE_MAX));

  // ✅ Ref to track abortion for outdated requests (prevents old ones overwriting new state)
  const abortRef = useRef(null);

  // Central URL update helper: clean, immediate, no double-fetches
  const updateUrl = useCallback((newParams) => {
    const params = new URLSearchParams(window.location.search);

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    const qs = params.toString();
    const newUrl = qs ? `${pathname}?${qs}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [pathname, router]);

  // Sync price slider display
  useEffect(() => {
    setLocalMin(filters.minPrice || String(PRICE_MIN));
    setLocalMax(filters.maxPrice || String(PRICE_MAX));
  }, [filters.minPrice, filters.maxPrice]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  // Fetch categories only once
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

  // Fetch brands based on current filters
  useEffect(() => {
    const controller = new AbortController();
    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const paramObj = {};
        if (filters.category) paramObj.category = filters.category;
        if (filters.search) paramObj.search = filters.search;
        if (filters.gender) paramObj.gender = filters.gender;
        if (filters.featured) paramObj.featured = filters.featured;
        if (filters.trending) paramObj.trending = filters.trending;
        if (filters.minPrice) paramObj.minPrice = filters.minPrice;
        if (filters.maxPrice) paramObj.maxPrice = filters.maxPrice;
        if (filters.discount) paramObj.discount = filters.discount;
        if (filters.rating) paramObj.rating = filters.rating;
        if (filters.inStock) paramObj.inStock = 'true';

        const res = await fetch(`/api/products/brands?${new URLSearchParams(paramObj)}`, { signal: controller.signal });
        const data = await res.json();
        const uniqueBrands = data.brands || [];
        setBrands(uniqueBrands);

        if (filters.brand && !uniqueBrands.includes(filters.brand)) {
          updateUrl({ brand: '' });
        }
      } catch (err) {
        if (err.name !== 'AbortError') setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
    return () => controller.abort();
  }, [filterQueryString]); // Simple stable dep 

  // ✅ Core product fetcher — with abort-safe protection to fix glitch
  const fetchProducts = useCallback(async (targetPage = 1, isLoadMore = false) => {
    // Abort any pending request to prevent stale response overwriting active filter
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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
        page: String(targetPage),
        limit: '24',
        sort: sortField,
        order: sortOrder,
      };

      if (filters.search?.trim()) paramObj.search = filters.search.trim();
      if (filters.category) paramObj.category = filters.category;
      if (filters.brand) paramObj.brand = filters.brand;
      if (filters.gender) paramObj.gender = filters.gender;
      if (filters.featured) paramObj.featured = filters.featured;
      if (filters.trending) paramObj.trending = filters.trending;
      if (filters.discount) paramObj.discount = filters.discount;
      if (filters.rating) paramObj.rating = filters.rating;
      if (filters.inStock) paramObj.inStock = 'true';
      if (minP !== null) paramObj.minPrice = String(minP);
      if (maxP !== null) paramObj.maxPrice = String(maxP);

      const res = await fetch(`/api/products?${new URLSearchParams(paramObj)}`, { signal: controller.signal });
      const data = await res.json();
      const newProducts = data.products || [];

      // Sanity check - do not overwrite state if request was aborted
      if (controller.signal.aborted) return;

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
      if (err.name !== 'AbortError') {
        console.error('Fetch error:', err);
        if (!isLoadMore) setAllProducts([]);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filters]);

  // ✅ Fires new fetch every URL change - single source of truth
  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [filterQueryString]);

  const loadMoreProducts = useCallback(() => {
    if (loadingMore || page >= pagination.pages) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  }, [loadingMore, page, pagination.pages, fetchProducts]);

  const handleSliderCommit = () => {
    const minV = Number(localMin || PRICE_MIN);
    const maxV = Number(localMax || PRICE_MAX);

    const atDefault = minV <= PRICE_MIN && maxV >= PRICE_MAX;
    if (atDefault) {
      handleClearPrice();
      return;
    }

    const ms = minV > PRICE_MIN ? String(minV) : '';
    const xs = maxV < PRICE_MAX ? String(maxV) : '';

    updateUrl({ minPrice: ms, maxPrice: xs });
  };

  const handleClearPrice = () => {
    setLocalMin(String(PRICE_MIN));
    setLocalMax(String(PRICE_MAX));
    updateUrl({ minPrice: '', maxPrice: '' });
  };

  const clearAll = () => {
    setLocalMin(String(PRICE_MIN));
    setLocalMax(String(PRICE_MAX));
    setActiveQuick('all');
    router.replace(pathname, { scroll: false });
  };

  const handleCategoryClick = useCallback((categoryId) => {
    updateUrl({ category: categoryId, brand: '' });
    setSidebarOpen(false);
    setActiveQuick('all');
  }, [updateUrl]);

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
    { key: 'trending', label: 'Trending', icon: '🔥', action: () => { updateUrl({ trending: 'true', featured: '' }); setActiveQuick('trending'); } },
    { key: 'featured', label: 'Featured', icon: '⭐', action: () => { updateUrl({ featured: 'true', trending: '' }); setActiveQuick('featured'); } },
    { key: 'new', label: 'New', icon: '✨', action: () => { updateUrl({ sort: 'createdAt-desc' }); setActiveQuick('new'); } },
    { key: 'deals', label: 'Deals', icon: '💰', action: () => { updateUrl({ discount: '20', sort: 'discountPercent-desc' }); setActiveQuick('deals'); } },
  ];

  const hasActiveFilters = !!(
    filters.category || filters.brand || filters.gender || filters.minPrice || filters.maxPrice ||
    filters.featured || filters.trending || filters.discount || filters.rating || filters.inStock
  );

  const activeFilterCount = [
    filters.category, filters.brand, filters.gender, filters.minPrice || filters.maxPrice,
    filters.featured, filters.trending, filters.discount, filters.rating,
    filters.inStock ? 'x' : '',
  ].filter(Boolean).length;

  const minPct = ((Number(localMin || PRICE_MIN) - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const maxPct = ((Number(localMax || PRICE_MAX) - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  const renderFilterContent = () => (
    <>
      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}><span className={styles.filterBlockIcon}>👦👧</span>Gender</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {GENDER_OPTIONS.map(g => (
            <button
              key={g.value}
              type="button"
              onClick={() => updateUrl({ gender: g.value === filters.gender ? '' : g.value })}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '7px 10px', textAlign: 'left',
                background: filters.gender === g.value ? '#FFF0F5' : 'transparent',
                border: filters.gender === g.value ? '1.5px solid #FF3F6C' : '1px solid transparent',
                borderRadius: '8px', fontSize: '0.84rem',
                fontWeight: filters.gender === g.value ? '800' : '600',
                color: filters.gender === g.value ? '#FF3F6C' : '#535766',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s Ease',
              }}
            >
              <span>{g.label}</span>
              {filters.gender === g.value && <span style={{ fontSize: '0.9rem', color: '#FF3F6C' }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}><span className={styles.filterBlockIcon}>📂</span>Categories</div>
        {catLoading ? (
          <div className={styles.catList}>{[...Array(8)].map((_, i) => <div key={i} className={styles.catSkeleton} />)}</div>
        ) : (
          <div className={styles.catList}>
            <button key="all-category" type="button" className={`${styles.catBtn} ${!filters.category ? styles.catBtnActive : ''}`} onClick={() => handleCategoryClick('')}>
              <span className={styles.catIcon}>🌟</span><span className={styles.catName}>All</span>
            </button>
            {categories.map(cat => (
              <button key={cat.id} type="button" className={`${styles.catBtn} ${isCategoryActive(cat) ? styles.catBtnActive : ''}`} onClick={() => handleCategoryClick(cat.id)}>
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
              <button key={b} type="button" onClick={() => updateUrl({ brand: b === filters.brand ? '' : b })} style={{
                padding: '6px 8px', textAlign: 'left', background: filters.brand === b ? '#FFF0F5' : 'transparent',
                border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: filters.brand === b ? '800' : '600',
                color: filters.brand === b ? '#FF3F6C' : '#535766', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {b} {filters.brand === b && '✓'}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.78rem', color: '#94969F' }}>No brands available</p>
        )}
      </div>

      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}>
          <span className={styles.filterBlockIcon}>💰</span>Price
        </div>

        <div style={{ padding: '4px 4px 6px' }}>
          <p style={{
            margin: '0 0 16px',
            fontSize: '0.92rem',
            fontWeight: '800',
            color: '#282C3F',
            fontFamily: 'inherit',
          }}>
            ₹{Number(localMin || PRICE_MIN)} – ₹{Number(localMax || PRICE_MAX)}{Number(localMax || PRICE_MAX) >= PRICE_MAX ? '+' : ''}
          </p>

          <div style={{
            position: 'relative',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              height: '5px',
              borderRadius: '999px',
              background: '#CED4DA',
            }} />

            <div style={{
              position: 'absolute',
              left: `${minPct}%`,
              right: `${100 - maxPct}%`,
              height: '5px',
              borderRadius: '999px',
              background: '#2563EB',
            }} />

            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={Number(localMin || PRICE_MIN)}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), Number(localMax || PRICE_MAX) - PRICE_STEP);
                setLocalMin(String(val));
              }}
              onMouseUp={handleSliderCommit}
              onTouchEnd={handleSliderCommit}
              className="priceRangeThumb priceMinThumb"
              style={{ zIndex: Number(localMin || PRICE_MIN) > PRICE_MAX - PRICE_STEP * 2 ? 5 : 3 }}
            />

            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={Number(localMax || PRICE_MAX)}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), Number(localMin || PRICE_MIN) + PRICE_STEP);
                setLocalMax(String(val));
              }}
              onMouseUp={handleSliderCommit}
              onTouchEnd={handleSliderCommit}
              className="priceRangeThumb priceMaxThumb"
              style={{ zIndex: 4 }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '0.72rem',
            color: '#94969F',
            fontWeight: '700',
          }}>
            <span>₹{PRICE_MIN}</span>
            <span>₹{PRICE_MAX}+</span>
          </div>
        </div>

        {(filters.minPrice || filters.maxPrice) && (
          <div className={styles.appliedPrice} style={{ marginTop: '10px' }}>
            <span>₹{filters.minPrice || PRICE_MIN} — ₹{filters.maxPrice || `${PRICE_MAX}+`}</span>
            <button type="button" className={styles.clearPriceBtn} onClick={handleClearPrice}>✕</button>
          </div>
        )}
      </div>

      <div className={styles.filterBlock}>
        <div className={styles.filterBlockTitle}><span className={styles.filterBlockIcon}>🔥</span>Discount</div>
        {DISCOUNT_TIERS.map(t => (
          <button key={t.value} type="button" onClick={() => updateUrl({ discount: t.value === filters.discount ? '' : t.value })} style={{
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
          <button key={o.value} type="button" onClick={() => updateUrl({ rating: o.value === filters.rating ? '' : o.value })} style={{
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
        <label className={styles.toggleRow} style={{ cursor: 'pointer' }}>
          <span>In Stock Only</span>
          <div className={`${styles.toggle} ${filters.inStock ? styles.toggleOn : ''}`}
            onClick={() => updateUrl({ inStock: filters.inStock ? '' : 'true' })} />
        </label>
      </div>
    </>
  );

  return (
    <div className={styles.pageRoot}>
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
                <button key={q.key} type="button"
                  className={`${styles.quickPill} ${activeQuick === q.key ? styles.quickPillActive : ''}`}
                  onClick={q.action}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontWeight: '800', fontSize: '0.84rem', color: '#282C3F', textTransform: 'uppercase' }}>Filters</span>
            {hasActiveFilters && (
              <button type="button" onClick={clearAll} className={styles.clearAllTagBtn}>Clear All</button>
            )}
          </div>

          <div className={styles.toolbarRight}>
            <div className={styles.sortWrap}>
              <span style={{ fontSize: '0.82rem', color: '#94969F', fontWeight: '600' }}>Sort by:</span>
              <select value={filters.sort} onChange={e => updateUrl({ sort: e.target.value })} className={styles.sortSelect}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <button
              type="button"
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
              {filters.gender && (
                <span className={styles.activeTag}>
                  {GENDER_OPTIONS.find(g => g.value === filters.gender)?.label || filters.gender}
                  <button type="button" onClick={() => updateUrl({ gender: '' })}>✕</button>
                </span>
              )}
              {filters.category && selectedCategoryName && (
                <span className={styles.activeTag}>{selectedCategoryName}<button type="button" onClick={() => handleCategoryClick('')}>✕</button></span>
              )}
              {filters.brand && (
                <span className={styles.activeTag}>{filters.brand}<button type="button" onClick={() => updateUrl({ brand: '' })}>✕</button></span>
              )}
              {filters.discount && (
                <span className={styles.activeTag}>{filters.discount}% And Above<button type="button" onClick={() => updateUrl({ discount: '' })}>✕</button></span>
              )}
              {filters.rating && (
                <span className={styles.activeTag}>{filters.rating}★ & above<button type="button" onClick={() => updateUrl({ rating: '' })}>✕</button></span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className={styles.activeTag}>₹{filters.minPrice || '0'}-₹{filters.maxPrice || '∞'}<button type="button" onClick={handleClearPrice}>✕</button></span>
              )}
              {filters.inStock && (
                <span className={styles.activeTag}>In Stock<button type="button" onClick={() => updateUrl({ inStock: '' })}>✕</button></span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.mobileCatBar}>
        <AutoScrollCatBar categories={categories} currentCategory={filters.category} handleCategoryClick={handleCategoryClick} catLoading={catLoading} />
        {filters.category && selectedCategoryName && (
          <div className={styles.activeCatBanner}>
            <span>Showing: <strong>{selectedCategoryName}</strong></span>
            <button type="button" className={styles.activeCatClear} onClick={() => handleCategoryClick('')}>✕ Clear</button>
          </div>
        )}
      </div>

      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={`${styles.sidebar} ${styles.sidebarDesktop}`}>
            <div className={styles.sidebarTop}>
              <div className={styles.sidebarTitle}>Filters</div>
              <button type="button" className={styles.clearAllBtn} onClick={clearAll}>Clear All</button>
            </div>
            {renderFilterContent()}
          </aside>

          <main className={styles.main}>
            {loading && allProducts.length === 0 ? (
              <div className={styles.skeletonGrid}>
                {Array(24).fill(0).map((_, i) => (
                  <div key={`skel-${i}`} className={styles.skeletonCard}>
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

                {pagination.page < pagination.pages && (
                  <LoadMoreTrigger loading={loadingMore} onLoadMore={loadMoreProducts} />
                )}

                {loadingMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94969F', fontSize: '0.84rem', fontWeight: '700' }}>
                      <div style={{ width: '22px', height: '22px', border: '3px solid #E9E9ED', borderTop: '3px solid #FF3F6C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Loading more...
                    </div>
                  </div>
                )}

                {pagination.page >= pagination.pages && (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94969F', fontSize: '0.82rem', fontWeight: '700', borderTop: '1px solid #E9E9ED', marginTop: '20px' }}>
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
                <button type="button" className={styles.emptyBtn} onClick={clearAll}>Clear All Filters</button>
              </div>
            )}
          </main>
        </div>
      </div>

      {sidebarOpen && (
        <>
          <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
          <aside className={`${styles.mobileDrawer} ${styles.mobileDrawerOpen}`}>
            <div className={styles.sidebarTop}>
              <div className={styles.sidebarTitle}>Filters</div>
              <button type="button" className={styles.clearAllBtn} onClick={clearAll}>Clear All</button>
              <button type="button" className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            {renderFilterContent()}
          </aside>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .priceRangeThumb {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 30px;
          margin: 0;
          padding: 0;
          background: transparent;
          pointer-events: none;
          -webkit-appearance: none;
          appearance: none;
          outline: none;
        }

        .priceRangeThumb::-webkit-slider-thumb {
          pointer-events: auto;
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #2563EB;
          border: 4px solid white;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.45);
          cursor: pointer;
          margin-top: -8px;
          transition: transform 0.15s ease;
        }
        .priceRangeThumb::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .priceRangeThumb::-webkit-slider-thumb:active {
          transform: scale(1.25);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.6);
        }

        .priceRangeThumb::-moz-range-thumb {
          pointer-events: auto;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #2563EB;
          border: 4px solid white;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.45);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .priceRangeThumb::-moz-range-thumb:hover {
          transform: scale(1.15);
        }

        .priceRangeThumb::-webkit-slider-runnable-track {
          height: 5px;
          background: transparent;
          border: none;
        }
        .priceRangeThumb::-moz-range-track {
          height: 5px;
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}