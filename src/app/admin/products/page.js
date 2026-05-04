// src/app/admin/products/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function AdminProducts() {
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page, limit: 10,
      ...(search && { search }),
    });
    const res  = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setPagination(data.pagination || {});
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async (id, name) => {
    if (!id) { toast.error('Product ID not found'); return; }
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted ✅'); fetchProducts(); }
    else toast.error('Failed to delete');
  };

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Products 📦</h1>
          <p>{pagination.total || 0} total products</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/admin/products/bulk"
            style={{
              padding: '9px 16px',
              background: '#7c3aed',
              color: 'white',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            📦 Bulk Upload
          </Link>
          <Link href="/admin/products/new" className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', fontSize: '13px' }}
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* ── SEARCH ── */}
      <div className={styles.filters}>
        <input
          className="form-control"
          placeholder="🔍 Search products..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 320 }}
        />
      </div>

      {/* ── DESKTOP TABLE ── */}
      <div className={styles.table}>
        <table>
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
              <tr><td colSpan={6} className={styles.center}>⏳ Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className={styles.center}>No products found</td></tr>
            ) : products.map(p => (
              <tr key={p.id}>
                <td>
                  <div className={styles.productCell}>
                    <div className={styles.productImg}>
                      <img
                        src={p.images?.[0]?.url || 'https://via.placeholder.com/50'}
                        alt={p.name}
                        width={44} height={44}
                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                      />
                    </div>
                    <div>
                      <div className={styles.productName}>{p.name}</div>
                      <div className={styles.productSku}>{p.sku}</div>
                    </div>
                  </div>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{p.category?.name || '—'}</td>
                <td>
                  <div style={{ whiteSpace: 'nowrap' }}>
                    ₹{(p.discountPrice || p.price).toLocaleString('en-IN')}
                  </div>
                  {p.discountPrice && (
                    <div className={styles.originalPrice}>
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
                  <span className={p.isActive ? styles.active : styles.inactive}>
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

      {/* ── MOBILE CARDS ── */}
      <div className={styles.mobileCards}>
        {loading ? (
          <div className={styles.center}>⏳ Loading...</div>
        ) : products.length === 0 ? (
          <div className={styles.center}>No products found</div>
        ) : products.map(p => (
          <div key={p.id} className={styles.mobileCard}>
            <div className={styles.mobileCardImg}>
              <img
                src={p.images?.[0]?.url || 'https://via.placeholder.com/60'}
                alt={p.name}
                width={60} height={60}
                style={{ objectFit: 'cover', borderRadius: '8px',
                  width: '100%', height: '100%' }}
              />
            </div>
            <div className={styles.mobileCardBody}>
              <div className={styles.mobileCardName}>{p.name}</div>
              <div className={styles.mobileCardMeta}>
                <span>{p.category?.name || '—'}</span>
                <span className={
                  p.stock > 10 ? styles.stockGood :
                  p.stock > 0  ? styles.stockLow  : styles.stockNone
                }>
                  Stock: {p.stock}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginTop: '4px' }}>
                <div className={styles.mobileCardPrice}>
                  ₹{(p.discountPrice || p.price).toLocaleString('en-IN')}
                  {p.discountPrice && (
                    <span className={styles.originalPrice}
                      style={{ marginLeft: '6px' }}>
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <span className={p.isActive ? styles.active : styles.inactive}>
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

      {/* ── PAGINATION ── */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className={styles.pageBtn}
          >
            ← Prev
          </button>
          <span>Page {page} of {pagination.pages}</span>
          <button
            disabled={page === pagination.pages}
            onClick={() => setPage(p => p + 1)}
            className={styles.pageBtn}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}