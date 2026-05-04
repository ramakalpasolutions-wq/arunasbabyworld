// src/app/products/ProductsClient.js
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import styles from './ProductsClient.module.css';
import React from 'react';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: '✨ Newest First' },
  { value: 'price-asc',      label: '💰 Price: Low to High' },
  { value: 'price-desc',     label: '💎 Price: High to Low' },
  { value: 'rating-desc',    label: '⭐ Top Rated' },
];

const CATEGORY_ICONS = {
  all:          '🧸',
  clothing:     '👗',
  footwear:     '👟',
  'health-care':'🧴',
  'toys-games': '🎠',
  feeding:      '🍼',
  bedding:      '🛏️',
  gear:         '🎒',
  maternity:    '🌸',
  default:      '✨',
};

/* ── Scroll reveal hook ── */
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

/* ── Parallax orb ── */
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

/* ── Reveal card wrapper ── */
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

export default function ProductsClient() {
  const searchParams = useSearchParams();

  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeQuick, setActiveQuick] = useState('all');
  const [priceError,  setPriceError]  = useState('');

  const [localMin, setLocalMin]     = useState('');
  const [localMax, setLocalMax]     = useState('');
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
    page: 1,
  });

  /* ── Lock body scroll when sidebar open on mobile ── */
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  /* ── Close sidebar on ESC key ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [sidebarOpen]);

  /* ── Fetch categories ── */
  useEffect(() => {
    fetch('/api/categories?withCount=true')
      .then(r => r.json())
      .then(d => {
        const catsWithProducts = (d.categories || []).filter(
          cat => cat.productCount > 0
        );
        setCategories(catsWithProducts);
      });
  }, []);

  /* ── Sync URL search params ── */
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: searchParams.get('category') || '',
      search:   searchParams.get('search')   || '',
      featured: searchParams.get('featured') || '',
      trending: searchParams.get('trending') || '',
      page: 1,
    }));
  }, [searchParams]);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, sortOrder] = filters.sort.split('-');

      let minP = filters.minPrice !== '' ? parseFloat(filters.minPrice) : null;
      let maxP = filters.maxPrice !== '' ? parseFloat(filters.maxPrice) : null;

      if (minP !== null && maxP !== null && minP > maxP) {
        [minP, maxP] = [maxP, minP];
      }

      const paramObj = {
        page:  String(filters.page),
        limit: '12',
        sort:  sortField,
        order: sortOrder,
      };

      if (filters.search)   paramObj.search   = filters.search;
      if (filters.category) paramObj.category = filters.category;
      if (filters.featured) paramObj.featured = filters.featured;
      if (filters.trending) paramObj.trending = filters.trending;
      if (minP !== null)    paramObj.minPrice = String(minP);
      if (maxP !== null)    paramObj.maxPrice = String(maxP);

      const params = new URLSearchParams(paramObj);
      const res    = await fetch(`/api/products?${params.toString()}`);
      const data   = await res.json();
      setProducts(data.products     || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key, value) =>
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));

  /* ── Apply price filter ── */
  const handleApplyPrice = () => {
    setPriceError('');
    const minVal = localMin.trim();
    const maxVal = localMax.trim();

    if (!minVal && !maxVal) { handleClearPrice(); return; }

    const min = minVal !== '' ? parseFloat(minVal) : null;
    const max = maxVal !== '' ? parseFloat(maxVal) : null;

    if (minVal !== '' && (isNaN(min) || min < 0)) {
      setPriceError('⚠️ Enter a valid min price (0 or above)');
      return;
    }
    if (maxVal !== '' && (isNaN(max) || max < 0)) {
      setPriceError('⚠️ Enter a valid max price (0 or above)');
      return;
    }

    let finalMin = min;
    let finalMax = max;
    if (finalMin !== null && finalMax !== null && finalMin > finalMax) {
      [finalMin, finalMax] = [finalMax, finalMin];
      setLocalMin(String(finalMin));
      setLocalMax(String(finalMax));
      setPriceError('⚠️ Min was greater than Max — values swapped!');
    }

    const minStr = finalMin !== null ? String(finalMin) : '';
    const maxStr = finalMax !== null ? String(finalMax) : '';

    setAppliedMin(minStr);
    setAppliedMax(maxStr);
    setFilters(prev => ({ ...prev, minPrice: minStr, maxPrice: maxStr, page: 1 }));
  };

  /* ── Clear price filter ── */
  const handleClearPrice = () => {
    setPriceError('');
    setLocalMin(''); setLocalMax('');
    setAppliedMin(''); setAppliedMax('');
    setFilters(prev => ({ ...prev, minPrice: '', maxPrice: '', page: 1 }));
  };

  /* ── Clear all filters ── */
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

  /* ── Close sidebar + apply filter (mobile UX) ── */
  const handleCategoryClick = (value) => {
    updateFilter('category', value);
    // close sidebar on mobile after picking category
    if (window.innerWidth < 900) {
      setSidebarOpen(false);
    }
  };

  const isCategoryActive     = cat => filters.category === cat.id;
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
      action: () => { updateFilter('trending', 'true'); setActiveQuick('trending'); },
    },
    {
      key: 'featured', label: 'Featured', icon: '⭐',
      action: () => { updateFilter('featured', 'true'); setActiveQuick('featured'); },
    },
    {
      key: 'new', label: 'New In', icon: '✨',
      action: () => { updateFilter('sort', 'createdAt-desc'); setActiveQuick('new'); },
    },
  ];

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice
    || filters.featured || filters.trending;

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

          <div className={styles.quickPills}>
            {quickFilters.map(q => (
              <button
                key={q.key}
                className={`${styles.quickPill} ${
                  activeQuick === q.key ? styles.quickPillActive : ''
                }`}
                onClick={q.action}
              >
                <span>{q.icon}</span> {q.label}
              </button>
            ))}
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
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort + Filter toggle */}
          <div className={styles.toolbarRight}>
            <select
              value={filters.sort}
              onChange={e => updateFilter('sort', e.target.value)}
              className={styles.sortSelect}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* ✅ Filter toggle button */}
            <button
              className={styles.filterToggle}
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label="Toggle filters"
              aria-expanded={sidebarOpen}
            >
              <span>🎛️</span>
              <span>Filters</span>
              {hasActiveFilters && (
                <span className={styles.filterBadge}>!</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ══ MAIN LAYOUT ══ */}
      <div className={styles.container}>
        <div className={styles.layout}>

          {/* ══ SIDEBAR FILTER DRAWER ══ */}
          <aside
            className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
            aria-hidden={!sidebarOpen}
          >
            {/* Sidebar header */}
            <div className={styles.sidebarTop}>
              <div className={styles.sidebarTitle}>
                <span>🎛️</span>
                <span>Filters</span>
              </div>
              <button
                className={styles.clearAllBtn}
                onClick={() => { clearAll(); }}
              >
                Clear all
              </button>
              <button
                className={styles.closeSidebar}
                onClick={() => setSidebarOpen(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            {/* ── Categories ── */}
            {categories.length > 0 && (
              <div className={styles.filterBlock}>
                <div className={styles.filterBlockTitle}>
                  <span className={styles.filterBlockIcon}>📂</span>
                  Category
                </div>
                <div className={styles.catList}>
                  <button
                    className={`${styles.catBtn} ${
                      !filters.category ? styles.catBtnActive : ''
                    }`}
                    onClick={() => handleCategoryClick('')}
                  >
                    <span className={styles.catIcon}>🧸</span>
                    <span>All Categories</span>
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
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Price Range ── */}
            <div className={styles.filterBlock}>
              <div className={styles.filterBlockTitle}>
                <span className={styles.filterBlockIcon}>💰</span>
                Price Range (₹)
              </div>

              {/* Min */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{
                  display: 'block', fontSize: '0.72rem', fontWeight: '700',
                  color: '#9585B0', marginBottom: '5px',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Min Price ₹
                </label>
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

              {/* Max */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block', fontSize: '0.72rem', fontWeight: '700',
                  color: '#9585B0', marginBottom: '5px',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Max Price ₹
                </label>
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

              {/* Error */}
              {priceError && (
                <div style={{
                  fontSize: '0.72rem', color: '#FF6B35', fontWeight: '700',
                  marginBottom: '10px', padding: '7px 10px',
                  background: '#FFF3EC', borderRadius: '8px',
                  border: '1px solid #FFD4B8', lineHeight: 1.5,
                }}>
                  {priceError}
                </div>
              )}

              {/* Apply button */}
              <button
                onClick={handleApplyPrice}
                style={{
                  width: '100%', padding: '11px',
                  background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontSize: '0.86rem', fontWeight: '800', cursor: 'pointer',
                  fontFamily: 'inherit', marginBottom: '8px',
                  boxShadow: '0 4px 14px rgba(255,107,53,0.28)',
                }}
              >
                🔍 Apply Price Filter
              </button>

              {/* Applied price display */}
              {(appliedMin || appliedMax) && (
                <div style={{
                  padding: '9px 12px',
                  background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)',
                  borderRadius: '10px', border: '1.5px solid #EDD9FF',
                  fontSize: '0.80rem', fontWeight: '700', color: '#7B2FBE',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: '8px',
                }}>
                  <span>✅ ₹{appliedMin || '0'} — ₹{appliedMax || '∞'}</span>
                  <button
                    onClick={handleClearPrice}
                    style={{
                      background: '#FF6B35', border: 'none', cursor: 'pointer',
                      color: 'white', fontWeight: '800', fontSize: '0.70rem',
                      padding: '3px 10px', borderRadius: '6px', fontFamily: 'inherit',
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* ── Quick Filters ── */}
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
                  onClick={() =>
                    updateFilter('featured', filters.featured === 'true' ? '' : 'true')
                  }
                />
              </label>
              <label className={styles.toggleRow}>
                <span>🔥 Trending Only</span>
                <div
                  className={`${styles.toggle} ${
                    filters.trending === 'true' ? styles.toggleOn : ''
                  }`}
                  onClick={() =>
                    updateFilter('trending', filters.trending === 'true' ? '' : 'true')
                  }
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

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      disabled={pagination.page === 1}
                      onClick={() => updateFilter('page', pagination.page - 1)}
                    >
                      ← Prev
                    </button>
                    <div className={styles.pageNumbers}>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(p =>
                          p === 1 ||
                          p === pagination.pages ||
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
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        ))}
                    </div>
                    <button
                      className={styles.pageBtn}
                      disabled={pagination.page === pagination.pages}
                      onClick={() => updateFilter('page', pagination.page + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyOrb} />
                <span className={styles.emptyEmoji}>🔍</span>
                <h3>No products found</h3>
                <p>
                  {selectedCategoryName
                    ? `No products in "${selectedCategoryName}" yet`
                    : 'Try adjusting your filters or search something else 🧸'}
                </p>
                <button className={styles.emptyBtn} onClick={clearAll}>
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ✅ OVERLAY — fixed z-index and blur */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close filters overlay"
        />
      )}
    </div>
  );
}