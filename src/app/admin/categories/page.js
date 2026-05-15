// src/app/admin/categories/page.js
'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './page.module.css';

/* ============================================================
   ✅ ONLY these 9 categories — fixed order
   ============================================================ */
const ALLOWED_CATEGORIES = [
  { slug: 'clothing',          name: 'Clothing',          icon: '', color: '#FF6B35' },
  { slug: 'personal-care',     name: 'Personal Care',     icon: '', color: '#7B2FBE' },
  { slug: 'health-care',       name: 'Health Care',       icon: '', color: '#0EA5E9' },
  { slug: 'baby-gear',         name: 'Baby Gear',         icon: '', color: '#10B981' },
  { slug: 'walkers',           name: 'Walkers',           icon: '', color: '#F59E0B' },
  { slug: 'toys',              name: 'Toys',              icon: '', color: '#EF4444' },
  { slug: 'cradles-cribs',     name: 'Cradles & Cribs',   icon: '', color: '#8B5CF6' },
  { slug: 'electric-vehicles', name: 'Electric Vehicles', icon: '', color: '#059669' },
  { slug: 'food',              name: 'Food',              icon: '', color: '#F97316' },
];

export default function AdminCategories() { 
  const [categories,    setCategories]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [uploadingGrid, setUploadingGrid] = useState(false);

  const emptyForm = {
    name: '', description: '', color: '#FF6B35',
    icon: '', type: 'normal', banner: null, gridImages: [],
  };

  const [form, setForm] = useState(emptyForm);

  /* ── Fetch categories ── */
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/categories?all=true');
      const data = await res.json();
      const all  = data.categories || [];

      // ✅ Filter + sort by ALLOWED_CATEGORIES order
      const filtered = ALLOWED_CATEGORIES
        .map(allowed => all.find(db => db.slug === allowed.slug))
        .filter(Boolean);

      setCategories(filtered);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  /* ── Open Add form ── */
  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  /* ── Open Edit form ── */
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name:        cat.name        || '',
      description: cat.description || '',
      color:       cat.color       || '#FF6B35',
      icon:        cat.icon        || '',
      type:        cat.type        || 'normal',
      banner:      cat.banner      || null,
      gridImages:  cat.gridImages  || [],
    });
    setShowForm(true);
  };

  /* ── Upload banner image ── */
  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'firstcry/categories');
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const imageUrl = data.url || data.images?.[0]?.url;
      setForm(f => ({ ...f, banner: { url: imageUrl, publicId: data.publicId || '' } }));
      toast.success('✅ Banner uploaded!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  /* ── Upload grid images ── */
  const handleGridImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingGrid(true);
    try {
      const fd = new FormData();
      for (const file of files) fd.append('file', file);
      fd.append('folder', 'firstcry/categories/grid');
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newImages = data.images || [{ url: data.url, publicId: data.publicId }];
      setForm(f => ({ ...f, gridImages: [...(f.gridImages || []), ...newImages] }));
      toast.success(`✅ ${newImages.length} image(s) uploaded!`);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingGrid(false);
    }
  };

  const removeGridImage = (idx) => {
    setForm(f => ({ ...f, gridImages: f.gridImages.filter((_, i) => i !== idx) }));
  };

  /* ── Quick create missing category ── */
  const quickCreate = async (cat) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     cat.name,
          icon:     cat.icon,
          color:    cat.color,
          type:     'normal',
          isActive: true,
        }),
      });
      const data = await res.json();

      // ✅ 200, 201, or 409 (already exists but updated) = success
      if (res.ok || res.status === 409) {
        toast.success(`✅ "${cat.name}" is ready!`);
        fetchCategories();
      } else {
        toast.error(data.error || 'Failed to create');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  /* ── Save category (add or edit) ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Category name is required'); return; }

    // ✅ Validate — only allowed category names (when adding new)
    if (!editing) {
      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const isAllowed = ALLOWED_CATEGORIES.some(c => c.slug === slug);
      if (!isAllowed) {
        toast.error(
          `❌ "${form.name}" is not an allowed category.\n\nAllowed: ${ALLOWED_CATEGORIES.map(c => c.name).join(', ')}`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const url    = editing ? `/api/categories/${editing.id}` : '/api/categories';
      const method = editing ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      // ✅ Handle "already exists" gracefully
      if (res.status === 409) {
        toast('ℹ️ Category already exists — updated it instead', { duration: 3000 });
        setShowForm(false);
        fetchCategories();
        return;
      }

      if (!res.ok) throw new Error(data.error);

      toast.success(editing ? '✅ Category updated!' : '✅ Category created!');
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete category ── */
  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res  = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('✅ Deleted successfully');
        fetchCategories();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  /* ── Derived state ── */
  const existingSlugs = categories.map(c => c.slug);
  const missingCats   = ALLOWED_CATEGORIES.filter(
    c => !existingSlugs.includes(c.slug)
  );

  /* ── Render category card ── */
  const renderCategoryCard = (cat) => {
    const allowed = ALLOWED_CATEGORIES.find(c => c.slug === cat.slug);
    return (
      <div key={cat.id} className={styles.catCard} style={{ borderColor: cat.color }}>
        <div className={styles.catHeader}>
          <div
            className={styles.catIcon}
            style={{ background: `${cat.color}20`, color: cat.color }}
          >
            {cat.banner?.url ? (
              <img
                src={cat.banner.url}
                alt={cat.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              cat.icon || allowed?.icon || cat.name[0]
            )}
          </div>
          <div className={styles.catActions}>
            <button onClick={() => openEdit(cat)} className={styles.editBtn}>✏️</button>
            <button
              onClick={() => handleDelete(cat.id, cat.name)}
              className={styles.deleteBtn}
            >
              🗑️
            </button>
          </div>
        </div>

        <h3 className={styles.catName}>{cat.name}</h3>
        {cat.description && <p className={styles.catDesc}>{cat.description}</p>}

        {cat.gridImages?.length > 0 && (
          <p style={{ fontSize: '11px', color: '#888', margin: '4px 0 0' }}>
            🖼️ {cat.gridImages.length} grid image(s)
          </p>
        )}
        {cat.banner?.url && (
          <p style={{ fontSize: '11px', color: '#10b981', margin: '4px 0 0' }}>
            ✅ Banner set
          </p>
        )}

        <div className={styles.catMeta}>
          <span style={{ background: `${cat.color}15`, color: cat.color }}>
            {cat.slug}
          </span>
        </div>
      </div>
    );
  };

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Categories 🗂️</h1>
          <p>{categories.length} / {ALLOWED_CATEGORIES.length} categories set up</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', fontSize: '13px' }}
            onClick={openAdd}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* ── ALLOWED CATEGORIES INFO BOX ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)',
        border: '2px solid #EDD9FF',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '24px',
      }}>
        <h4 style={{
          margin: '0 0 10px', color: '#2D1A4A',
          fontSize: '0.90rem', fontWeight: '800',
        }}>
          ✅ Allowed Categories (9 total — fixed order)
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {ALLOWED_CATEGORIES.map((cat, i) => (
            <span key={cat.slug} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              background: existingSlugs.includes(cat.slug)
                ? `${cat.color}15`
                : '#FEE2E2',
              border: `1.5px solid ${
                existingSlugs.includes(cat.slug) ? cat.color : '#FECACA'
              }`,
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: '700',
              color: existingSlugs.includes(cat.slug) ? cat.color : '#DC2626',
            }}>
              {i + 1}. {cat.icon} {cat.name}
              {existingSlugs.includes(cat.slug) ? ' ✅' : ' ❌ Missing'}
            </span>
          ))}
        </div>
      </div>

      {/* ── MISSING CATEGORIES — Quick Create ── */}
      {missingCats.length > 0 && (
        <div style={{
          background: '#FEF3C7',
          border: '2px solid #FDE68A',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
        }}>
          <h4 style={{
            margin: '0 0 12px', color: '#92400E',
            fontSize: '0.90rem', fontWeight: '800',
          }}>
            ⚠️ {missingCats.length} category(ies) not in database yet — Click to create:
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {missingCats.map(cat => (
              <button
                key={cat.slug}
                onClick={() => quickCreate(cat)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  background: cat.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                + {cat.icon} {cat.name}
              </button>
            ))}
          </div>
          <p style={{
            margin: '10px 0 0', fontSize: '0.76rem',
            color: '#92400E', fontWeight: '600',
          }}>
            💡 Click any button above to instantly create that category in the database.
          </p>
        </div>
      )}

      {/* ── ALL CREATED ── */}
      {missingCats.length === 0 && categories.length > 0 && (
        <div style={{
          background: '#F0FDF4',
          border: '2px solid #BBF7D0',
          borderRadius: '16px',
          padding: '14px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '1.4rem' }}>🎉</span>
          <div>
            <p style={{ margin: 0, fontWeight: '800', color: '#166534', fontSize: '0.90rem' }}>
              All 9 categories are set up!
            </p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534', fontWeight: '600' }}>
              Admin → Add Product → Category dropdown will show all 9 in correct order.
            </p>
          </div>
        </div>
      )}

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalCard} style={{ maxWidth: '680px' }}>
            <div className={styles.modalHeader}>
              <h2>{editing ? '✏️ Edit Category' : '➕ Add Category'}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>

              {/* ✅ Category picker — only when adding new */}
              {!editing && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    color: '#9585B0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px',
                  }}>
                    Select Category to Create
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {ALLOWED_CATEGORIES.map(cat => {
                      const exists   = existingSlugs.includes(cat.slug);
                      const selected = form.name === cat.name;
                      return (
                        <button
                          key={cat.slug}
                          type="button"
                          disabled={exists}
                          onClick={() => setForm(f => ({
                            ...f,
                            name:  cat.name,
                            icon:  cat.icon,
                            color: cat.color,
                          }))}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '999px',
                            border: `2px solid ${selected ? cat.color : '#EDD9FF'}`,
                            background: exists
                              ? '#F3F4F6'
                              : selected ? cat.color : 'white',
                            color: exists
                              ? '#9CA3AF'
                              : selected ? 'white' : cat.color,
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            cursor: exists ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            opacity: exists ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {cat.icon} {cat.name}
                          {exists && ' ✅'}
                        </button>
                      );
                    })}
                  </div>
                  <p style={{
                    fontSize: '0.72rem', color: '#9585B0',
                    marginTop: '8px', fontWeight: '600',
                  }}>
                    ✅ = Already in database. Grey = Cannot create duplicate.
                  </p>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label>Category Name *</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Clothing"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Short description"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label>Icon (emoji)</label>
                      <input
                        className="form-control"
                        value={form.icon}
                        onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                        placeholder="👗"
                      />
                    </div>
                    <div className="form-group">
                      <label>Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={form.color}
                          onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                          style={{
                            width: '44px', height: '38px',
                            border: '2px solid #eee',
                            borderRadius: '8px', cursor: 'pointer',
                          }}
                        />
                        <input
                          className="form-control"
                          value={form.color}
                          onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Banner Upload */}
                  <div className="form-group">
                    <label>🖼️ Banner Image</label>
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                      />
                      <div style={{
                        width: '100%', height: '110px',
                        border: `2px dashed ${form.color || '#FF6B35'}`,
                        borderRadius: '12px', background: '#fff8fb',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', cursor: 'pointer',
                      }}>
                        {uploading ? (
                          <p style={{ margin: 0, fontSize: '0.84rem', color: '#888' }}>
                            ⏳ Uploading...
                          </p>
                        ) : form.banner?.url ? (
                          <img
                            src={form.banner.url}
                            alt="banner"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '28px' }}>🖼️</div>
                            <p style={{
                              fontSize: '11px', color: '#FF6B35',
                              fontWeight: '700', margin: '4px 0 0',
                            }}>
                              Upload Banner
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                    {form.banner?.url && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, banner: null }))}
                        style={{
                          marginTop: '6px', background: '#fee2e2',
                          color: '#dc2626', border: 'none',
                          borderRadius: '6px', padding: '6px',
                          width: '100%', cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        🗑️ Remove Banner
                      </button>
                    )}
                  </div>

                  {/* Grid Images */}
                  <div className="form-group">
                    <label>📷 Grid Images</label>
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGridImageUpload}
                        style={{ display: 'none' }}
                        disabled={uploadingGrid}
                      />
                      <div style={{
                        width: '100%', height: '70px',
                        border: '2px dashed #0ea5e9',
                        borderRadius: '12px', background: '#f0f9ff',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}>
                        {uploadingGrid ? (
                          <p style={{ margin: 0, fontSize: '0.84rem', color: '#888' }}>
                            ⏳ Uploading...
                          </p>
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px' }}>📷</div>
                            <p style={{
                              fontSize: '11px', color: '#0ea5e9',
                              fontWeight: '700', margin: '4px 0 0',
                            }}>
                              Upload Grid Images
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                    {form.gridImages?.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '6px', marginTop: '10px',
                      }}>
                        {form.gridImages.map((img, i) => (
                          <div key={i} style={{
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                          }}>
                            <img
                              src={img.url}
                              alt=""
                              style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                            />
                            <button
                              type="button"
                              onClick={() => removeGridImage(i)}
                              style={{
                                position: 'absolute', top: '4px', right: '4px',
                                background: 'rgba(220,38,38,0.9)', color: 'white',
                                border: 'none', borderRadius: '50%',
                                width: '20px', height: '20px',
                                fontSize: '10px', cursor: 'pointer',
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || uploading || uploadingGrid}
                >
                  {saving
                    ? '⏳ Saving...'
                    : editing
                      ? '💾 Update'
                      : '✨ Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CATEGORY GRID ── */}
      {loading ? (
        <div className={styles.loadingGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`skeleton ${styles.skeletonCard}`} />
          ))}
        </div>
      ) : (
        <div className={styles.catGrid}>
          {categories.length === 0 ? (
            <div style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: '60px 20px',
              color: '#888',
            }}>
              <div style={{ fontSize: '50px', marginBottom: '16px' }}>📦</div>
              <p style={{ fontWeight: '600', marginBottom: '8px' }}>
                No categories in database yet
              </p>
              <p style={{ fontSize: '0.84rem', color: '#aaa', marginBottom: '20px' }}>
                Use the yellow panel above to quickly create all 9 required categories
              </p>
              <button onClick={openAdd} className="btn btn-primary">
                + Add Category
              </button>
            </div>
          ) : (
            categories.map(renderCategoryCard)
          )}
        </div>
      )}
    </div>
  );
}