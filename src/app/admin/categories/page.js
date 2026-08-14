// src/app/admin/categories/page.js
'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './page.module.css';

/* ============================================================
   ✅ Predefined 9 categories — fixed order (shown first)
   ✅ But admin can ALSO add custom categories now
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
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [isCustom,   setIsCustom]   = useState(false);

  const emptyForm = {
    name: '', description: '', color: '#FF6B35',
    icon: '', type: 'normal',
  };

  const [form, setForm] = useState(emptyForm);

  /* ── Fetch categories ── */
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/categories?all=true');
      const data = await res.json();
      const all  = data.categories || [];

      // ✅ Show predefined categories first (in order), then custom ones
      const predefinedSlugs = ALLOWED_CATEGORIES.map(c => c.slug);
      const predefined = ALLOWED_CATEGORIES
        .map(allowed => all.find(db => db.slug === allowed.slug))
        .filter(Boolean);
      const custom = all.filter(db => !predefinedSlugs.includes(db.slug));

      setCategories([...predefined, ...custom]);
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
    setIsCustom(false);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  /* ── Open Edit form ── */
  const openEdit = (cat) => {
    setEditing(cat);
    setIsCustom(true);
    setForm({
      name:        cat.name        || '',
      description: cat.description || '',
      color:       cat.color       || '#FF6B35',
      icon:        cat.icon        || '',
      type:        cat.type        || 'normal',
    });
    setShowForm(true);
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
    if (!form.name?.trim()) { toast.error('Category name is required'); return; }

    // ✅ Check duplicates by slug
    if (!editing) {
      const slug = form.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const existingSlugs = categories.map(c => c.slug);
      if (existingSlugs.includes(slug)) {
        toast.error(`❌ "${form.name}" already exists. Please choose a different name.`);
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
  const customCats = categories.filter(
    c => !ALLOWED_CATEGORIES.some(a => a.slug === c.slug)
  );

  /* ── Render category card ── */
  const renderCategoryCard = (cat) => {
    const allowed = ALLOWED_CATEGORIES.find(c => c.slug === cat.slug);
    const isCustomCat = !allowed;
    return (
      <div key={cat.id} className={styles.catCard} style={{ borderColor: cat.color }}>
        <div className={styles.catHeader}>
          <div
            className={styles.catIcon}
            style={{ background: `${cat.color}20`, color: cat.color }}
          >
            {cat.icon || allowed?.icon || cat.name[0]}
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

        <h3 className={styles.catName}>
          {cat.name}
          {isCustomCat && (
            <span style={{
              marginLeft: '6px',
              fontSize: '10px',
              background: '#FEF3C7',
              color: '#92400E',
              padding: '2px 6px',
              borderRadius: '6px',
              fontWeight: '700',
            }}>
              CUSTOM
            </span>
          )}
        </h3>
        {cat.description && <p className={styles.catDesc}>{cat.description}</p>}

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
          <p>
            {categories.length} total ({ALLOWED_CATEGORIES.filter(c => existingSlugs.includes(c.slug)).length}/{ALLOWED_CATEGORIES.length} predefined
            {customCats.length > 0 && `, ${customCats.length} custom`})
          </p>
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

      {/* ── PREDEFINED CATEGORIES INFO BOX ── */}
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
          ⭐ Predefined Categories (9 recommended)
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
        <p style={{
          margin: '10px 0 0', fontSize: '0.76rem',
          color: '#6B5B85', fontWeight: '600',
        }}>
          💡 You can also create your own custom categories using "+ Add Category" button.
        </p>
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
            ⚠️ {missingCats.length} predefined category(ies) not in database yet — Click to create:
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
        </div>
      )}

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalCard} style={{ maxWidth: '560px' }}>
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

              {/* ✅ Mode toggle — only when adding new */}
              {!editing && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '14px',
                    background: '#F3E8FF',
                    padding: '4px',
                    borderRadius: '12px',
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setForm({ ...emptyForm });
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: !isCustom ? 'white' : 'transparent',
                        color: !isCustom ? '#7B2FBE' : '#9585B0',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: !isCustom ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      ⭐ Predefined
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustom(true);
                        setForm({ ...emptyForm });
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: isCustom ? 'white' : 'transparent',
                        color: isCustom ? '#7B2FBE' : '#9585B0',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        boxShadow: isCustom ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      ✨ Custom (New)
                    </button>
                  </div>

                  {!isCustom && (
                    <>
                      <label style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        color: '#9585B0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '10px',
                      }}>
                        Select Predefined Category
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
                        ✅ = Already in database. Switch to "Custom" tab to create your own category.
                      </p>
                    </>
                  )}

                  {isCustom && (
                    <div style={{
                      background: '#FEF3C7',
                      border: '1.5px solid #FDE68A',
                      borderRadius: '10px',
                      padding: '12px 14px',
                    }}>
                      <p style={{
                        margin: 0, fontSize: '0.82rem',
                        color: '#92400E', fontWeight: '700',
                      }}>
                        ✨ Custom Category Mode
                      </p>
                      <p style={{
                        margin: '4px 0 0', fontSize: '0.74rem',
                        color: '#92400E', fontWeight: '600',
                      }}>
                        Type any category name below (e.g. "Books", "Shoes", "Gifts").
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── FORM FIELDS ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={isCustom ? "e.g. Books, Shoes, Gifts..." : "e.g. Clothing"}
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
                          flexShrink: 0,
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
                  disabled={saving}
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
                Use the yellow panel above to quickly create predefined categories, or click "+ Add Category" to create custom ones.
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