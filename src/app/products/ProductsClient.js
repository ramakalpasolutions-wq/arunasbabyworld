'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/products/ProductCard';
import useScrollReveal from '@/hooks/useScrollReveal';
import styles from './ProductsClient.module.css';

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating-desc', label: 'Top Rated' },
];

export default function ProductsClient() {
  useScrollReveal();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // ✅ Read category from URL (can be slug or id)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: 'createdAt-desc',
    minPrice: '',
    maxPrice: '',
    featured: searchParams.get('featured') || '',
    trending: searchParams.get('trending') || '',
    page: 1,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Load categories
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []));
  }, []);

  // ✅ Update filters when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || '';
    const searchFromUrl = searchParams.get('search') || '';
    const featuredFromUrl = searchParams.get('featured') || '';
    const trendingFromUrl = searchParams.get('trending') || '';

    setFilters(prev => ({
      ...prev,
      category: categoryFromUrl,
      search: searchFromUrl,
      featured: featuredFromUrl,
      trending: trendingFromUrl,
      page: 1,
    }));
  }, [searchParams]);

  // ✅ Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const [sortField, sortOrder] = filters.sort.split('-');
      const params = new URLSearchParams({
        page: filters.page,
        limit: 12,
        sort: sortField,
        order: sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.featured && { featured: filters.featured }),
        ...(filters.trending && { trending: filters.trending }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
      });

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value,
    }));
  };

  // ✅ Get selected category name
  // Works for both slug and id
  const selectedCategory = categories.find(
    c => c.id === filters.category || c.slug === filters.category
  );
  const selectedCategoryName = selectedCategory?.name || '';

  // ✅ Check if category button is active
  // Works for both slug and id
  const isCategoryActive = (cat) => {
    return filters.category === cat.id ||
      filters.category === cat.slug;
  };

  return (
    <div className={`container ${styles.page}`}>

      {/* ===== HEADER ===== */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>
            {filters.search
              ? `Results for "${filters.search}"`
              : filters.featured === 'true'
              ? '⭐ Featured Products'
              : filters.trending === 'true'
              ? '🔥 Trending Products'
              : selectedCategoryName
              ? `${selectedCategoryName} Products`
              : 'All Products'}
          </h1>
          <p className={styles.count}>
            {pagination.total} products found
            {selectedCategoryName && (
              <span style={{ color: '#ff6b9d', marginLeft: '8px' }}>
                in {selectedCategoryName}
              </span>
            )}
          </p>
        </div>
        <div className={styles.headerRight}>
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className={styles.sortSelect}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            className={styles.filterToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            🔧 Filters
          </button>
        </div>
      </div>

      <div className={styles.layout}>

        {/* ===== SIDEBAR ===== */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeader}>
            <h3>Filters</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className={styles.closeBtn}
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div className={styles.filterSection}>
            <h4>Search</h4>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search products..."
              className="form-control"
            />
          </div>

          {/* ✅ Categories - works with both slug and id */}
          {categories.length > 0 && (
            <div className={styles.filterSection}>
              <h4>Category</h4>
              <div className={styles.categoryList}>
                <button
                  className={`${styles.catBtn} ${!filters.category ? styles.catBtnActive : ''}`}
                  onClick={() => updateFilter('category', '')}
                >
                  🏠 All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`${styles.catBtn} ${isCategoryActive(cat) ? styles.catBtnActive : ''}`}
                    onClick={() => updateFilter('category', cat.slug)}
                  >
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div className={styles.filterSection}>
            <h4>Price Range (₹)</h4>
            <div className={styles.priceInputs}>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
                placeholder="Min"
                className="form-control"
                min="0"
              />
              <span>–</span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                placeholder="Max"
                className="form-control"
                min="0"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className={styles.filterSection}>
            <h4>Quick Filters</h4>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={filters.featured === 'true'}
                onChange={(e) => updateFilter('featured', e.target.checked ? 'true' : '')}
              />
              ⭐ Featured Only
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={filters.trending === 'true'}
                onChange={(e) => updateFilter('trending', e.target.checked ? 'true' : '')}
              />
              🔥 Trending Only
            </label>
          </div>

          <button
            className={`${styles.clearBtn} btn btn-outline`}
            onClick={() => setFilters({
              search: '',
              category: '',
              sort: 'createdAt-desc',
              minPrice: '',
              maxPrice: '',
              featured: '',
              trending: '',
              page: 1,
            })}
          >
            Clear All Filters
          </button>
        </aside>

        {/* ===== PRODUCTS ===== */}
        <div className={styles.main}>
          {loading ? (
            <div className={styles.skeletonGrid}>
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className={styles.skeleton}>
                  <div className={`skeleton ${styles.skeletonImg}`} />
                  <div style={{ padding: '14px' }}>
                    <div className={`skeleton ${styles.skeletonLine}`} />
                    <div className={`skeleton ${styles.skeletonLineShort}`} />
                    <div className={`skeleton ${styles.skeletonBtn}`} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="products-grid">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} />
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
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${p === pagination.page ? styles.pageActive : ''}`}
                      onClick={() => updateFilter('page', p)}
                    >
                      {p}
                    </button>
                  ))}
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
            <div className={styles.empty}>
              <span>🔍</span>
              <h3>No products found</h3>
              <p>
                {selectedCategoryName
                  ? `No products in ${selectedCategoryName} yet`
                  : 'Try adjusting your filters or search terms'}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setFilters({
                  search: '',
                  category: '',
                  sort: 'createdAt-desc',
                  minPrice: '',
                  maxPrice: '',
                  featured: '',
                  trending: '',
                  page: 1,
                })}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}