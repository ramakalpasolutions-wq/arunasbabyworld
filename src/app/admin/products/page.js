// src/app/admin/products/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const ALLOWED_CATEGORIES = [
  { slug: 'clothing',          name: 'Clothing',          icon: '' },
  { slug: 'personal-care',     name: 'Personal Care',     icon: '' },
  { slug: 'health-care',       name: 'Health Care',       icon: '' },
  { slug: 'baby-gear',         name: 'Baby Gear',         icon: '' },
  { slug: 'walkers',           name: 'Walkers',           icon: '' },
  { slug: 'toys',              name: 'Toys',              icon: '' },
  { slug: 'cradles-cribs',     name: 'Cradles & Cribs',   icon: '' },
  { slug: 'electric-vehicles', name: 'Electric Vehicles', icon: '' },
  { slug: 'food',              name: 'Food',              icon: '' },
];

export default function AdminProducts() {
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState({});
  const [categories,  setCategories]  = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [searchInput, setSearchInput] = useState('');

  /* ── Fetch categories ── */
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  /* ── Fetch products ── */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(search      && { search }),
        ...(selectedCat && { category: selectedCat }),
      });
      const res  = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products     || []);
      setPagination(data.pagination || {});
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, search, selectedCat]);

  /* ── Handlers ── */
  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };
  const handleCatFilter = (catId) => {
    setSelectedCat(prev => prev === catId ? '' : catId);
    setPage(1);
  };
  const clearFilters = () => {
    setSearchInput(''); setSearch(''); setSelectedCat(''); setPage(1);
  };
  const handleDelete = async (id, name) => {
    if (!id) { toast.error('Product ID not found'); return; }
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted ✅'); fetchProducts(); }
    else toast.error('Failed to delete');
  };

  const hasFilters = search || selectedCat;

  return (
    <div className={styles.page}>

      {/* ══ HEADER ══ */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>Products 📦</h1>
          <p className={styles.headerSub}>
            {pagination.total || 0} total products
            {hasFilters && (
              <span className={styles.filteredBadge}>(filtered)</span>
            )}
          </p>
        </div>
        <div className={styles.headerBtns}>
          <Link href="/admin/products/bulk" className={styles.bulkBtn}>
            📦 Bulk Upload
          </Link>
          <Link href="/admin/products/new" className={styles.addBtn}>
            + Add Product
          </Link>
        </div>
      </div>

      {/* ══ FILTERS PANEL ══ */}
      <div className={styles.filtersPanel}>

        {/* Search Row */}
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              className={styles.searchInput}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products..."
            />
            {searchInput && (
              <button
                className={styles.searchClear}
                onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
              >
                ✕
              </button>
            )}
          </div>

          <button className={styles.searchBtn} onClick={handleSearch}>
            🔍 Search
          </button>

          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearFilters}>
              ✕ Clear Filters
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className={styles.catFilterWrap}>
          <p className={styles.catFilterLabel}>📂 Filter by Category</p>
          <div className={styles.catPills}>

            {/* All */}
            <button
              className={`${styles.catPill} ${!selectedCat ? styles.catPillActive : ''}`}
              onClick={() => { setSelectedCat(''); setPage(1); }}
            >
              🧸 All
            </button>

            {/* Dynamic from DB */}
            {categories.map(cat => {
              const isActive = selectedCat === cat.id;
              const allowed  = ALLOWED_CATEGORIES.find(a => a.slug === cat.slug);
              const icon     = cat.icon || allowed?.icon || '📦';
              return (
                <button
                  key={cat.id}
                  className={`${styles.catPill} ${isActive ? styles.catPillOn : ''}`}
                  style={isActive ? {
                    background:  cat.color || '#FF6B35',
                    borderColor: cat.color || '#FF6B35',
                    boxShadow:   `0 4px 14px ${cat.color || '#FF6B35'}40`,
                  } : {}}
                  onClick={() => handleCatFilter(cat.id)}
                >
                  {icon} {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Summary */}
        {hasFilters && (
          <div className={styles.filterSummary}>
            <span className={styles.filterSummaryLabel}>Active filters:</span>

            {search && (
              <span className={styles.filterTag} style={{ background: '#FF6B35' }}>
                🔍 &quot;{search}&quot;
                <button
                  className={styles.filterTagClose}
                  onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                >✕</button>
              </span>
            )}

            {selectedCat && (() => {
              const cat = categories.find(c => c.id === selectedCat);
              return cat ? (
                <span
                  className={styles.filterTag}
                  style={{ background: cat.color || '#7B2FBE' }}
                >
                  {cat.icon || '📦'} {cat.name}
                  <button
                    className={styles.filterTagClose}
                    onClick={() => { setSelectedCat(''); setPage(1); }}
                  >✕</button>
                </span>
              ) : null;
            })()}

            <span className={styles.filterCount}>
              — {pagination.total || 0} result(s)
            </span>
          </div>
        )}
      </div>

      {/* ══ DESKTOP TABLE ══ */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  <div className={styles.loadingState}>⏳ Loading products...</div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  <div className={styles.emptyState}>
                    <span className={styles.emptyEmoji}>📦</span>
                    <p className={styles.emptyText}>No products found</p>
                    {hasFilters && (
                      <button className={styles.emptyBtn} onClick={clearFilters}>
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : products.map(p => (
              <tr key={p.id} className={styles.tableRow}>
                <td>
                  <div className={styles.productCell}>
                    <div className={styles.productThumb}>
                      <img
                        src={p.images?.[0]?.url || 'https://via.placeholder.com/50'}
                        alt={p.name}
                        width={44}
                        height={44}
                      />
                    </div>
                    <div>
                      <div className={styles.productName}>{p.name}</div>
                      <div className={styles.productSku}>{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={styles.catBadge}>
                    {p.category?.name || '—'}
                  </span>
                </td>
                <td>
                  <div className={styles.priceMain}>
                    ₹{(p.discountPrice || p.price).toLocaleString('en-IN')}
                  </div>
                  {p.discountPrice && (
                    <div className={styles.priceOld}>
                      ₹{p.price.toLocaleString('en-IN')}
                    </div>
                  )}
                </td>
                <td>
                  <span className={
                    p.stock > 10 ? styles.stockGood :
                    p.stock > 0  ? styles.stockLow  : styles.stockNone
                  }>
                    {p.stock}
                  </span>
                </td>
                <td>
                  <span className={p.isActive ? styles.statusActive : styles.statusInactive}>
                    {p.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link href={`/admin/products/${p.id}`} className={styles.editBtn}>
                      ✏️ Edit
                    </Link>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ══ MOBILE CARDS ══ */}
      <div className={styles.mobileCards}>
        {loading ? (
          <div className={styles.mobileLoading}>⏳ Loading...</div>
        ) : products.length === 0 ? (
          <div className={styles.mobileEmpty}>
            <span className={styles.emptyEmoji}>📦</span>
            <p className={styles.emptyText}>No products found</p>
            {hasFilters && (
              <button className={styles.emptyBtn} onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : products.map(p => (
          <div key={p.id} className={styles.mobileCard}>
            <div className={styles.mobileCardImg}>
              <img
                src={p.images?.[0]?.url || 'https://via.placeholder.com/60'}
                alt={p.name}
                width={60}
                height={60}
              />
            </div>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardName}>{p.name}</div>
              <div className={styles.mobileCardMeta}>
                <span className={styles.catBadge}>{p.category?.name || '—'}</span>
                <span className={
                  p.stock > 10 ? styles.stockGood :
                  p.stock > 0  ? styles.stockLow  : styles.stockNone
                }>
                  Stock: {p.stock}
                </span>
              </div>
              <div className={styles.mobileCardRow}>
                <div className={styles.mobileCardPrice}>
                  ₹{(p.discountPrice || p.price).toLocaleString('en-IN')}
                  {p.discountPrice && (
                    <span className={styles.priceOld}>
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <span className={p.isActive ? styles.statusActive : styles.statusInactive}>
                  {p.isActive ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <div className={styles.mobileCardActions}>
                <Link href={`/admin/products/${p.id}`} className={styles.editBtn}>
                  ✏️ Edit
                </Link>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(p.id, p.name)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ PAGINATION ══ */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {pagination.pages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page === pagination.pages}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}