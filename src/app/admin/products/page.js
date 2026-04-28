'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import styles from './page.module.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchProducts = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit: 10,
      ...(search && { search }),
    });
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setPagination(data.pagination || {});
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const handleDelete = async (id, name) => {
    // ✅ Check id exists
    if (!id) {
      toast.error('Product ID not found');
      return;
    }
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Product deleted ✅');
      fetchProducts();
    } else {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
  // Find header section and replace with:
<div className={styles.header}>
  <div>
    <h1>Products 📦</h1>
    <p>{pagination.total || 0} total products</p>
  </div>
  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <Link
      href="/admin/products/bulk"
      style={{
        padding: '10px 20px',
        background: '#7c3aed',
        color: 'white',
        borderRadius: '10px',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '14px',
      }}
    >
      📦 Bulk Upload
    </Link>
    <Link href="/admin/products/new" className="btn btn-primary">
      + Add Product
    </Link>
  </div>
</div>

      {/* ===== SEARCH ===== */}
      <div className={styles.filters}>
        <input
          className="form-control"
          placeholder="Search products..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 320 }}
        />
      </div>

      {/* ===== TABLE ===== */}
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
              <tr>
                <td colSpan={6} className={styles.center}>
                  ⏳ Loading...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.center}>
                  No products found
                </td>
              </tr>
            ) : (
              products.map(p => (
                // ✅ Use p.id not p._id
                <tr key={p.id}>
                  <td>
                    <div className={styles.productCell}>
                      <div className={styles.productImg}>
                        <img
                          src={p.images?.[0]?.url || 'https://via.placeholder.com/50'}
                          alt={p.name}
                          width={50}
                          height={50}
                          style={{ objectFit: 'cover', borderRadius: '8px' }}
                        />
                      </div>
                      <div>
                        <div className={styles.productName}>{p.name}</div>
                        <div className={styles.productSku}>{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.category?.name || '—'}</td>
                  <td>
                    <div>₹{(p.discountPrice || p.price).toLocaleString('en-IN')}</div>
                    {p.discountPrice && (
                      <div className={styles.originalPrice}>
                        ₹{p.price.toLocaleString('en-IN')}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        p.stock > 10
                          ? styles.stockGood
                          : p.stock > 0
                          ? styles.stockLow
                          : styles.stockNone
                      }
                    >
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
                      {/* ✅ Use p.id not p._id */}
                      <Link
                        href={`/admin/products/${p.id}`}
                        className={styles.editBtn}
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(p.id, p.name)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINATION ===== */}
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