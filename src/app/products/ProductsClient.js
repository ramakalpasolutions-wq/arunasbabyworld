'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import styles from './ProductsClient.module.css';
import React from 'react';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First'       },
  { value: 'price-asc',      label: 'Price: Low to High' },
  { value: 'price-desc',     label: 'Price: High to Low' },
  { value: 'rating-desc',    label: 'Top Rated'          },
];

const CATEGORY_ORDER = [
  'clothing', 'personal-care', 'health-care', 'walkers',
  'toys', 'cradles-cribs', 'electric-vehicles', 'food',
];

const CATEGORY_ICONS = {
  'all':               '🧸',
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
function AutoScrollCatBar({
  categories, filters, handleCategoryClick, catLoading,
}) {
  const trackRef = useRef(null);
  const isPaused = useRef(false);
  const posRef   = useRef(0);
  const rafRef   = useRef(null);
  const SPEED    = 0.5;

  const allItems = [
    { id: '', slug: 'all', name: 'All', icon: '🧸', productCount: 0 },
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
              className={`${styles.mobileCatPill} ${
                isCatActive(cat) ? styles.mobileCatPillActive : ''
              }`}
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

  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [catLoading,  setCatLoading]  = useState(true);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeQuick, setActiveQuick] = useState('all');
  const [priceError,  setPriceError]  = useState('');

  const [localMin,   setLocalMin]   = useState('');
  const [localMax,   setLocalMax]   = useState('');
  const [appliedMin, setAppliedMin] = useState('');
  const [appliedMax, setAppliedMax] = useState('');

  const [filters, setFilters] = useState({
    search:   searchParams.get('search')   || '',
    category: searchParams.get('category') || '',
    sort:     'createdAt-desc',
    minPrice: '',
    maxPrice: '',
    featured: searchParams.get('featured') || '',
    trending: searchParams.get('trending') || '',
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
        const filtered = allCats.filter(
          cat => !EXCLUDED_SLUGS.includes(cat.slug)
        );
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
      limit: '12',   // ✅ show 12 per page
      sort:  sortField,
      order: sortOrder,
    };

    // ✅ Only add if not empty
    if (filters.search   && filters.search.trim())
      paramObj.search   = filters.search.trim();
    if (filters.category)
      paramObj.category = filters.category;
    if (filters.featured)
      paramObj.featured = filters.featured;
    if (filters.trending)
      paramObj.trending = filters.trending;
    if (minP !== null)
      paramObj.minPrice = String(minP);
    if (maxP !== null)
      paramObj.maxPrice = String(maxP);

    console.log('🔍 Fetching products with params:', paramObj);

    const res  = await fetch(`/api/products?${new URLSearchParams(paramObj)}`);
    const data = await res.json();

    console.log('📦 Products found:', data.pagination?.total);

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
      search: '', category: '', sort: 'createdAt-desc',
      minPrice: '', maxPrice: '', featured: '', trending: '', page: 1,
    });
  };

  const handleCategoryClick = useCallback((categoryId) => {
    setFilters(prev => ({ ...prev, category: categoryId, page: 1 }));
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
    {
      key: 'all', label: 'All', icon: '🧸',
      action: () => { clearAll(); setActiveQuick('all'); },
    },
    {
      key: 'trending', label: 'Trending', icon: '🔥',
      action: () => {
        setFilters(prev => ({
          ...prev, trending: 'true', featured: '', page: 1,
        }));
        setActiveQuick('trending');
      },
    },
    {
      key: 'featured', label: 'Featured', icon: '⭐',
      action: () => {
        setFilters(prev => ({
          ...prev, featured: 'true', trending: '', page: 1,
        }));
        setActiveQuick('featured');
      },
    },
    {
      key: 'new', label: 'New In', icon: '✨',
      action: () => {
        setFilters(prev => ({
          ...prev, sort: 'createdAt-desc', page: 1,
        }));
        setActiveQuick('new');
      },
    },
  ];

  const hasActiveFilters = !!(
    filters.category || filters.minPrice || filters.maxPrice ||
    filters.featured || filters.trending
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

      {/* ══ HERO STRIP ══ */}
      <div className={styles.heroStrip}>
        <div className={styles.heroStripInner}>
          <div className={styles.heroStripLeft}>
            <span className={styles.heroCrumb}>Home › Products</span>
            <h1 className={styles.heroTitle}>
              {filters.featured === 'true' && (
                <span className={styles.heroEmoji}>⭐</span>
              )}
              {filters.trending === 'true' && (
                <span className={styles.heroEmoji}>🔥</span>
              )}
              {!filters.featured && !filters.trending && (
                <span className={styles.heroEmoji}>🧸</span>
              )}
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

          {/* ✅ Quick pills — scrollable, never cut off */}
          <div className={styles.quickPillsWrap}>
            <div className={styles.quickPills}>
              {quickFilters.map(q => (
                <button
                  key={q.key}
                  className={`${styles.quickPill} ${
                    activeQuick === q.key ? styles.quickPillActive : ''
                  }`}
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

      {/* ══ TOOLBAR ══ */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>

          {/* Search */}
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
            {/* Sort */}
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

            {/* Filter button */}
            <button
              className={`${styles.filterToggle} ${
                hasActiveFilters ? styles.filterToggleActive : ''
              }`}
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle filters"
            >
              <svg
                width="15" height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="4"  y1="6"  x2="20" y2="6"  />
                <line x1="8"  y1="12" x2="20" y2="12" />
                <line x1="12" y1="18" x2="20" y2="18" />
                <circle cx="4"  cy="6"  r="2" fill="currentColor" stroke="none" />
                <circle cx="8"  cy="12" r="2" fill="currentColor" stroke="none" />
                <circle cx="12" cy="18" r="2" fill="currentColor" stroke="none" />
              </svg>
              <span className={styles.filterToggleText}>Filter</span>
              {hasActiveFilters && <span className={styles.filterBadge} />}
            </button>
          </div>
        </div>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className={styles.activeFiltersRow}>
            <div className={styles.activeFilterTags}>
              {filters.category && selectedCategoryName && (
                <span className={styles.activeTag}>
                  {CATEGORY_ICONS[selectedCategory?.slug] || '📦'} {selectedCategoryName}
                  <button onClick={() => handleCategoryClick('')}>✕</button>
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

      {/* ✅ MOBILE CATEGORY BAR — Auto scroll */}
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

      {/* ══ MAIN LAYOUT ══ */}
      <div className={styles.container}>
        <div className={styles.layout}>

          {/* ✅ SIDEBAR — fixed z-index */}
          <aside
            className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
          >
            <div className={styles.sidebarTop}>
              <div className={styles.sidebarTitle}>
                <span>🎛️</span>
                <span>Filters</span>
              </div>
              <button className={styles.clearAllBtn} onClick={clearAll}>
                Clear all
              </button>
              <button
                className={styles.closeSidebar}
                onClick={() => setSidebarOpen(false)}
              >✕</button>
            </div>

            {/* Categories — desktop only */}
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
                    className={`${styles.catBtn} ${
                      !filters.category ? styles.catBtnActive : ''
                    }`}
                    onClick={() => handleCategoryClick('')}
                  >
                    <span className={styles.catIcon}>🧸</span>
                    <span className={styles.catName}>All Categories</span>
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`${styles.catBtn} ${
                        isCategoryActive(cat) ? styles.catBtnActive : ''
                      }`}
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
                  {categories.length === 0 && (
                    <p className={styles.noCats}>No categories yet</p>
                  )}
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
              {priceError && (
                <div className={styles.priceError}>{priceError}</div>
              )}
              <button className={styles.applyPriceBtn} onClick={handleApplyPrice}>
                🔍 Apply Price Filter
              </button>
              {(appliedMin || appliedMax) && (
                <div className={styles.appliedPrice}>
                  <span>✅ ₹{appliedMin || '0'} — ₹{appliedMax || '∞'}</span>
                  <button className={styles.clearPriceBtn} onClick={handleClearPrice}>
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Quick Filters */}
            <div className={styles.filterBlock}>
              <div className={styles.filterBlockTitle}>
                <span className={styles.filterBlockIcon}>⚡</span>
                Quick Filters
              </div>
              <label className={styles.toggleRow}>
                <span>⭐ Featured Only</span>
                <div
                  className={`${styles.toggle} ${
                    filters.featured === 'true' ? styles.toggleOn : ''
                  }`}
                  onClick={() => updateFilter(
                    'featured', filters.featured === 'true' ? '' : 'true'
                  )}
                />
              </label>
              <label className={styles.toggleRow}>
                <span>🔥 Trending Only</span>
                <div
                  className={`${styles.toggle} ${
                    filters.trending === 'true' ? styles.toggleOn : ''
                  }`}
                  onClick={() => updateFilter(
                    'trending', filters.trending === 'true' ? '' : 'true'
                  )}
                />
              </label>
            </div>

            <div className={styles.sidebarBlob1} />
            <div className={styles.sidebarBlob2} />
          </aside>

          {/* ══ PRODUCTS GRID ══ */}
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
                              className={`${styles.pageBtn} ${
                                p === pagination.page ? styles.pageBtnActive : ''
                              }`}
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

      {/* ✅ Overlay — MUST be above sidebar */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}