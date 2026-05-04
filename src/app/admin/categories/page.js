// src/app/admin/categories/page.js
'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './page.module.css';

const CATEGORY_TYPES = [
  { value: 'normal',        label: '📦 Normal Category' },
  { value: 'maternity',     label: '🤰 Maternity' },
  { value: 'personal-care', label: '💄 Women Personal Care' },
  { value: 'healthy-care',  label: '💊 Healthy Care' },
];

export default function AdminCategories() {
  const [categories,     setCategories]     = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showForm,       setShowForm]       = useState(false);
  const [editing,        setEditing]        = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadingGrid,  setUploadingGrid]  = useState(false);
  const [activeTab,      setActiveTab]      = useState('normal');
  const [showMerge,      setShowMerge]      = useState(false);
  const [mergeFrom,      setMergeFrom]      = useState('');
  const [mergeTo,        setMergeTo]        = useState('');
  const [merging,        setMerging]        = useState(false);

  const emptyForm = {
    name: '', description: '', color: '#ff6b9d',
    icon: '', type: 'normal', banner: null, gridImages: [],
  };

  const [form, setForm] = useState(emptyForm);

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => { setCategories(d.categories || []); setLoading(false); });
  };

  useEffect(() => { fetchCategories(); }, []);

  const normalCats       = categories.filter(c => c.type === 'normal'        || !c.type);
  const maternityCats    = categories.filter(c => c.type === 'maternity');
  const personalCareCats = categories.filter(c => c.type === 'personal-care');
  const healthyCats      = categories.filter(c => c.type === 'healthy-care');

  const openAdd = (type = 'normal') => {
    setEditing(null);
    setForm({ ...emptyForm, type });
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name:        cat.name        || '',
      description: cat.description || '',
      color:       cat.color       || '#ff6b9d',
      icon:        cat.icon        || '',
      type:        cat.type        || 'normal',
      banner:      cat.banner      || null,
      gridImages:  cat.gridImages  || [],
    });
    setShowForm(true);
  };

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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      const url    = editing ? `/api/categories/${editing.id}` : '/api/categories';
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? 'Updated! ✅' : 'Created! ✅');
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res  = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.status === 409) {
        const choice = window.confirm(
          `⚠️ "${name}" has ${data.productCount} product(s)!\n\n` +
          `OK → Move to "Uncategorized" and DELETE\n` +
          `Cancel → DEACTIVATE (keep products)`
        );
        const res2 = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: choice ? 'force' : 'deactivate' }),
        });
        const data2 = await res2.json();
        if (res2.ok) { toast.success(`✅ ${data2.message}`); fetchCategories(); }
        else toast.error(data2.error || 'Failed');
        return;
      }
      if (res.ok) { toast.success('Deleted ✅'); fetchCategories(); }
      else toast.error(data.error || 'Failed to delete');
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleMerge = async () => {
    if (!mergeFrom || !mergeTo) { toast.error('Select both categories'); return; }
    if (mergeFrom === mergeTo)  { toast.error('Cannot merge same!'); return; }
    const fromCat = categories.find(c => c.id === mergeFrom);
    const toCat   = categories.find(c => c.id === mergeTo);
    if (!confirm(`Merge "${fromCat?.name}" → "${toCat?.name}"?`)) return;
    setMerging(true);
    try {
      const res  = await fetch('/api/categories/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: mergeFrom, toId: mergeTo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`✅ ${data.message}`);
      setShowMerge(false);
      setMergeFrom(''); setMergeTo('');
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  const tabStyle = (tab) => ({
    padding: '8px 14px',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    background: activeTab === tab
      ? 'linear-gradient(135deg, #ff6b9d, #7c3aed)'
      : '#f3f4f6',
    color: activeTab === tab ? 'white' : '#666',
  });

  const renderCategoryCard = (cat) => (
    <div key={cat.id} className={styles.catCard} style={{ borderColor: cat.color }}>
      <div className={styles.catHeader}>
        <div className={styles.catIcon}
          style={{ background: `${cat.color}20`, color: cat.color }}>
          {cat.banner?.url ? (
            <img src={cat.banner.url} alt={cat.name}
              style={{ width: '100%', height: '100%',
                objectFit: 'cover', borderRadius: '50%' }} />
          ) : (cat.icon || cat.name[0])}
        </div>
        <div className={styles.catActions}>
          <button onClick={() => openEdit(cat)} className={styles.editBtn}>✏️</button>
          <button onClick={() => handleDelete(cat.id, cat.name)}
            className={styles.deleteBtn}>🗑️</button>
        </div>
      </div>
      <h3 className={styles.catName}>{cat.name}</h3>
      {cat.description && (
        <p className={styles.catDesc}>{cat.description}</p>
      )}
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

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div>
          <h1>Categories 🗂️</h1>
          <p>{categories.length} categories total</p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowMerge(true)}
            style={{
              padding: '9px 14px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white', border: 'none',
              borderRadius: '10px', fontWeight: '700',
              fontSize: '13px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            🔀 Merge
          </button>
          <button
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', fontSize: '13px' }}
            onClick={() => openAdd(
              activeTab === 'normal'          ? 'normal'
              : activeTab === 'maternity'     ? 'maternity'
              : activeTab === 'personal-care' ? 'personal-care'
              : 'healthy-care'
            )}
          >
            + Add {
              activeTab === 'normal'          ? 'Category'
              : activeTab === 'maternity'     ? 'Maternity'
              : activeTab === 'personal-care' ? 'Personal Care'
              : 'Healthy Care'
            }
          </button>
        </div>
      </div>

      {/* ── MERGE MODAL ── */}
      {showMerge && (
        <div className={styles.modal}>
          <div className={styles.modalCard} style={{ maxWidth: '480px' }}>
            <div className={styles.modalHeader}>
              <h2>🔀 Merge Categories</h2>
              <button className={styles.closeBtn}
                onClick={() => { setShowMerge(false); setMergeFrom(''); setMergeTo(''); }}>
                ✕
              </button>
            </div>
            <div style={{
              background: '#fffbeb', border: '1px solid #fcd34d',
              borderRadius: '10px', padding: '12px 14px',
              marginBottom: '16px', fontSize: '13px', color: '#92400e',
            }}>
              ⚠️ All products from <strong>FROM</strong> → <strong>TO</strong>.
              FROM category will be deleted.
            </div>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem',
                color: '#444', display: 'block', marginBottom: '6px' }}>
                FROM — Delete this 🗑️
              </label>
              <select className="form-control" value={mergeFrom}
                onChange={e => setMergeFrom(e.target.value)}>
                <option value="">-- Select FROM category --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon || ''} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ textAlign: 'center', fontSize: '1.4rem',
              marginBottom: '14px', color: '#f59e0b' }}>⬇️</div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: '700', fontSize: '0.85rem',
                color: '#444', display: 'block', marginBottom: '6px' }}>
                TO — Keep this ✅
              </label>
              <select className="form-control" value={mergeTo}
                onChange={e => setMergeTo(e.target.value)}>
                <option value="">-- Select TO category --</option>
                {categories.filter(c => c.id !== mergeFrom).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon || ''} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }}
                onClick={() => { setShowMerge(false); setMergeFrom(''); setMergeTo(''); }}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!mergeFrom || !mergeTo || merging}
                onClick={handleMerge}
                style={{
                  flex: 2, padding: '12px',
                  background: merging || !mergeFrom || !mergeTo
                    ? '#ddd'
                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: merging || !mergeFrom || !mergeTo ? '#999' : 'white',
                  border: 'none', borderRadius: '10px',
                  fontWeight: '800', fontSize: '0.88rem',
                  cursor: merging || !mergeFrom || !mergeTo ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {merging ? '⏳ Merging...' : '🔀 Merge & Delete FROM'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{
        display: 'flex', gap: '8px',
        marginBottom: '16px', flexWrap: 'wrap',
      }}>
        <button style={tabStyle('normal')} onClick={() => setActiveTab('normal')}>
          📦 Normal ({normalCats.length})
        </button>
        <button style={tabStyle('maternity')} onClick={() => setActiveTab('maternity')}>
          🤰 Maternity ({maternityCats.length})
        </button>
        <button style={tabStyle('personal-care')} onClick={() => setActiveTab('personal-care')}>
          💄 Personal Care ({personalCareCats.length})
        </button>
        <button style={tabStyle('healthy-care')} onClick={() => setActiveTab('healthy-care')}>
          💊 Healthy Care ({healthyCats.length})
        </button>
      </div>

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div className={styles.modal}>
          <div className={styles.modalCard} style={{ maxWidth: '680px' }}>
            <div className={styles.modalHeader}>
              <h2>
                {editing ? '✏️ Edit' : '➕ Add'}{' '}
                {CATEGORY_TYPES.find(t => t.value === form.type)?.label}
              </h2>
              <button className={styles.closeBtn}
                onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className={styles.form}>
              {/* Responsive 2-col → 1-col */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}>
                {/* LEFT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label>Category Name *</label>
                    <input className="form-control" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Maternity Wear" required />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select className="form-control" value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {CATEGORY_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-control" rows={2} value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Short description" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label>Icon (emoji)</label>
                      <input className="form-control" value={form.icon}
                        onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                        placeholder="🤰" />
                    </div>
                    <div className="form-group">
                      <label>Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={form.color}
                          onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                          style={{ width: '44px', height: '38px',
                            border: '2px solid #eee', borderRadius: '8px', cursor: 'pointer' }} />
                        <input className="form-control" value={form.color}
                          onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Banner Upload */}
                  <div className="form-group">
                    <label>🖼️ Banner Image</label>
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <input type="file" accept="image/*"
                        onChange={handleBannerUpload}
                        style={{ display: 'none' }} disabled={uploading} />
                      <div style={{
                        width: '100%', height: '110px',
                        border: `2px dashed ${form.color || '#ff6b9d'}`,
                        borderRadius: '12px', background: '#fff8fb',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', cursor: 'pointer',
                      }}>
                        {uploading ? (
                          <div style={{ textAlign: 'center' }}>
                            ⏳
                            <p style={{ fontSize: '11px', color: '#ff6b9d' }}>Uploading...</p>
                          </div>
                        ) : form.banner?.url ? (
                          <img src={form.banner.url} alt="banner"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px' }}>🖼️</div>
                            <p style={{ fontSize: '11px', color: '#ff6b9d', fontWeight: '700' }}>
                              Upload Banner
                            </p>
                          </div>
                        )}
                      </div>
                    </label>
                    {form.banner?.url && (
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, banner: null }))}
                        style={{ marginTop: '4px', background: '#fee2e2',
                          color: '#dc2626', border: 'none', borderRadius: '6px',
                          padding: '4px 10px', fontSize: '11px',
                          cursor: 'pointer', width: '100%' }}>
                        🗑️ Remove
                      </button>
                    )}
                  </div>

                  {/* Grid Images */}
                  <div className="form-group">
                    <label>📷 Grid Images</label>
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <input type="file" accept="image/*" multiple
                        onChange={handleGridImageUpload}
                        style={{ display: 'none' }} disabled={uploadingGrid} />
                      <div style={{
                        width: '100%', height: '70px',
                        border: '2px dashed #0ea5e9',
                        borderRadius: '12px', background: '#f0f9ff',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}>
                        {uploadingGrid ? (
                          <p style={{ fontSize: '11px', color: '#0ea5e9' }}>⏳ Uploading...</p>
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '18px' }}>📷</div>
                            <p style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: '700' }}>
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
                        gap: '6px', marginTop: '8px',
                      }}>
                        {form.gridImages.map((img, i) => (
                          <div key={i} style={{
                            position: 'relative', borderRadius: '8px',
                            overflow: 'hidden', aspectRatio: '1',
                          }}>
                            <img src={img.url} alt={`Grid ${i+1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => removeGridImage(i)}
                              style={{
                                position: 'absolute', top: '2px', right: '2px',
                                background: 'rgba(220,38,38,0.9)', color: 'white',
                                border: 'none', borderRadius: '50%',
                                width: '18px', height: '18px', fontSize: '10px',
                                cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                              }}>
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className="btn btn-outline"
                  onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"
                  disabled={saving || uploading || uploadingGrid}>
                  {saving ? '⏳ Saving...' : editing ? '💾 Update' : '✨ Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CATEGORY GRIDS ── */}
      {loading ? (
        <div className={styles.loadingGrid}>
          {[1,2,3].map(i => (
            <div key={i} className={`skeleton ${styles.skeletonCard}`} />
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'normal' && (
            <div className={styles.catGrid}>
              {normalCats.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center',
                  padding: '40px', color: '#999' }}>
                  <div style={{ fontSize: '40px' }}>📦</div>
                  <p>No normal categories yet</p>
                  <button onClick={() => openAdd('normal')} className="btn btn-primary"
                    style={{ marginTop: '12px' }}>+ Add Category</button>
                </div>
              ) : normalCats.map(renderCategoryCard)}
            </div>
          )}

          {activeTab === 'maternity' && (
            <div>
              <div style={{
                background: '#fdf2f8', border: '1px solid #f0abfc',
                borderRadius: '10px', padding: '10px 14px',
                marginBottom: '14px', fontSize: '13px', color: '#701a75',
              }}>
                ℹ️ Add <strong>1 banner image</strong> + <strong>grid images</strong>.
              </div>
              <div className={styles.catGrid}>
                {maternityCats.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center',
                    padding: '40px', color: '#999' }}>
                    <div style={{ fontSize: '40px' }}>🤰</div>
                    <p>No maternity categories yet</p>
                    <button onClick={() => openAdd('maternity')} className="btn btn-primary"
                      style={{ marginTop: '12px' }}>+ Add Maternity</button>
                  </div>
                ) : maternityCats.map(renderCategoryCard)}
              </div>
            </div>
          )}

          {activeTab === 'personal-care' && (
            <div>
              <div style={{
                background: '#fdf2f8', border: '1px solid #f0abfc',
                borderRadius: '10px', padding: '10px 14px',
                marginBottom: '14px', fontSize: '13px', color: '#701a75',
              }}>
                ℹ️ Add <strong>1 banner image</strong> + <strong>grid images</strong>.
              </div>
              <div className={styles.catGrid}>
                {personalCareCats.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center',
                    padding: '40px', color: '#999' }}>
                    <div style={{ fontSize: '40px' }}>💄</div>
                    <p>No personal care categories yet</p>
                    <button onClick={() => openAdd('personal-care')}
                      className="btn btn-primary" style={{ marginTop: '12px' }}>
                      + Add Personal Care
                    </button>
                  </div>
                ) : personalCareCats.map(renderCategoryCard)}
              </div>
            </div>
          )}

          {activeTab === 'healthy-care' && (
            <div>
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: '10px', padding: '10px 14px',
                marginBottom: '14px', fontSize: '13px', color: '#166534',
              }}>
                ℹ️ Add <strong>1 banner image</strong> + <strong>grid images</strong>.
              </div>
              <div className={styles.catGrid}>
                {healthyCats.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center',
                    padding: '40px', color: '#999' }}>
                    <div style={{ fontSize: '40px' }}>💊</div>
                    <p>No healthy care categories yet</p>
                    <button onClick={() => openAdd('healthy-care')}
                      className="btn btn-primary" style={{ marginTop: '12px' }}>
                      + Add Healthy Care
                    </button>
                  </div>
                ) : healthyCats.map(renderCategoryCard)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}