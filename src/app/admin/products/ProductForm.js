'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './form.module.css';

// ✅ Drag & Drop Image Upload Component
function ImageUploader({ images, onUpload, onRemove, uploading }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/')
    );
    if (files.length) onUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) onUpload(files);
    e.target.value = '';
  };

  return (
    <div className={styles.uploaderWrap}>
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''} ${uploading ? styles.uploading : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />

        {uploading ? (
          <div className={styles.uploadingState}>
            <div className={styles.spinner} />
            <p>Uploading images...</p>
          </div>
        ) : (
          <div className={styles.dropContent}>
            <div className={styles.uploadIcon}>📤</div>
            <p className={styles.dropTitle}>Drag & Drop images here</p>
            <p className={styles.dropOr}>— or —</p>
            <button
              type="button"
              className={styles.browseBtn}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              📁 Browse Files
            </button>
            <p className={styles.dropHint}>
              PNG, JPG, JPEG, WEBP • Max 5MB each • Select 3-10 images
            </p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h4>Uploaded Images ({images.length})</h4>
            <small>First image is the main product image</small>
          </div>
          <div className={styles.previewGrid}>
            {images.map((img, i) => (
              <div key={i} className={styles.previewCard}>
                <div className={styles.previewImgWrap}>
                  <img
                    src={img.url}
                    alt={`Product ${i + 1}`}
                    className={styles.previewImg}
                  />
                  {i === 0 && (
                    <span className={styles.mainBadge}>⭐ Main</span>
                  )}
                  <button
                    type="button"
                    className={styles.removeImgBtn}
                    onClick={() => onRemove(i)}
                    title="Remove image"
                  >
                    🗑️
                  </button>
                </div>
                <p className={styles.imgLabel}>
                  {i === 0 ? 'Main Image' : `Image ${i + 1}`}
                </p>
              </div>
            ))}

            <div
              className={styles.addMoreCard}
              onClick={() => inputRef.current?.click()}
            >
              <span>+</span>
              <p>Add More</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductForm({ id }) {
  const router = useRouter();
  const isEdit = !!id;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    stock: '',
    brand: '',
    categoryId: '',
    ageGroup: '',
    tags: '',
    isFeatured: false,
    isTrending: false,
    isActive: true,
    features: '',
    images: [],
  });

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        if (d.categories && d.categories.length > 0) {
          setCategories(d.categories);
        }
      })
      .catch(err => console.error('Category load error:', err));

    if (isEdit) {
      fetch(`/api/products/${id}`)
        .then(r => r.json())
        .then(d => {
          const p = d.product;
          if (p) {
            setForm({
              name: p.name || '',
              description: p.description || '',
              shortDescription: p.shortDescription || '',
              price: p.price || '',
              discountPrice: p.discountPrice || '',
              stock: p.stock || '',
              brand: p.brand || '',
              categoryId: p.categoryId || '',
              ageGroup: p.ageGroup || '',
              tags: p.tags?.join(', ') || '',
              isFeatured: p.isFeatured || false,
              isTrending: p.isTrending || false,
              isActive: p.isActive !== false,
              features: p.features?.join('\n') || '',
              images: p.images || [],
            });
          }
        })
        .catch(err => console.error('Product load error:', err));
    }
  }, [id, isEdit]);

  // ✅ BULK upload - ALL files in ONE request
  const handleImageUpload = async (files) => {
    if (!files.length) return;
    setUploading(true);

    try {
      // ✅ Step 1 - Validate all files
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max 5MB`);
          setUploading(false);
          return;
        }
      }

      // ✅ Step 2 - Add ALL files in ONE FormData
      const fd = new FormData();
      for (const file of files) {
        fd.append('file', file);
      }
      fd.append('folder', 'firstcry/products');

      // ✅ Step 3 - Send ONE request with all files
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // ✅ Step 4 - Get ALL images from response
      const newImages = data.images || [];
      if (newImages.length === 0) {
        toast.error('No images uploaded');
        return;
      }

      // ✅ Step 5 - Add all to form
      setForm(f => ({ ...f, images: [...f.images, ...newImages] }));
      toast.success(`${newImages.length} image(s) uploaded ✅`);

    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, i) => i !== idx),
    }));
    toast.success('Image removed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.stock || !form.categoryId || !form.description) {
      toast.error('Please fill all required fields');
      return;
    }

    if (form.images.length === 0) {
      toast.error('Please upload at least one product image');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        shortDescription: form.shortDescription || null,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice
          ? parseFloat(form.discountPrice)
          : null,
        stock: parseInt(form.stock),
        brand: form.brand || null,
        categoryId: form.categoryId,
        ageGroup: form.ageGroup || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        features: form.features.split('\n').map(f => f.trim()).filter(Boolean),
        isFeatured: form.isFeatured,
        isTrending: form.isTrending,
        isActive: form.isActive,
        images: form.images,
      };

      if (payload.discountPrice && payload.price) {
        payload.discountPercent = Math.round(
          ((payload.price - payload.discountPrice) / payload.price) * 100
        );
      }

      const url = isEdit ? `/api/products/${id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(isEdit ? '✅ Product updated!' : '✅ Product created!');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>{isEdit ? '✏️ Edit Product' : '➕ Add New Product'}</h1>
          <p>
            {isEdit
              ? 'Update product details below'
              : 'Fill in the details to add a new product'}
          </p>
        </div>
        <button onClick={() => router.back()} className="btn btn-outline">
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>

          {/* ===== LEFT COLUMN ===== */}
          <div className={styles.col}>

            <div className={styles.card}>
              <h3>📝 Basic Information</h3>

              <div className="form-group">
                <label>Product Name *</label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Short Description</label>
                <input
                  className="form-control"
                  value={form.shortDescription}
                  onChange={e => set('shortDescription', e.target.value)}
                  placeholder="Brief description shown on product cards"
                />
              </div>

              <div className="form-group">
                <label>Full Description *</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Detailed product description..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Key Features (one per line)</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.features}
                  onChange={e => set('features', e.target.value)}
                  placeholder={`Soft cotton material\nMachine washable\nBIS certified safe`}
                />
              </div>
            </div>

            {/* ✅ IMAGE UPLOAD */}
            <div className={styles.card}>
              <h3>🖼️ Product Images (3-10 images)</h3>
              <ImageUploader
                images={form.images}
                onUpload={handleImageUpload}
                onRemove={removeImage}
                uploading={uploading}
              />
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className={styles.col}>

            <div className={styles.card}>
              <h3>💰 Pricing & Stock</h3>

              <div className={styles.row2}>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.price}
                    onChange={e => set('price', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Discount Price (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.discountPrice}
                    onChange={e => set('discountPrice', e.target.value)}
                    placeholder="Optional"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {form.price && form.discountPrice && (
                <div className={styles.discountPreview}>
                  🏷️ Discount:{' '}
                  <strong>
                    {Math.round(
                      ((form.price - form.discountPrice) / form.price) * 100
                    )}% off
                  </strong>
                  {' '}— Customer saves{' '}
                  <strong>
                    ₹{(form.price - form.discountPrice).toFixed(2)}
                  </strong>
                </div>
              )}

              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.stock}
                  onChange={e => set('stock', e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className={styles.card}>
              <h3>🗂️ Organization</h3>

              <div className="form-group">
                <label>Category *</label>
                <select
                  className="form-control"
                  value={form.categoryId}
                  onChange={e => set('categoryId', e.target.value)}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <small style={{ color: 'red' }}>
                    ⚠️ No categories. Run: node scripts/seed.js
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input
                  className="form-control"
                  value={form.brand}
                  onChange={e => set('brand', e.target.value)}
                  placeholder="Brand name"
                />
              </div>

              <div className="form-group">
                <label>Age Group</label>
                <select
                  className="form-control"
                  value={form.ageGroup}
                  onChange={e => set('ageGroup', e.target.value)}
                >
                  <option value="">Select Age Group</option>
                  {[
                    '0-3 months', '3-6 months', '6-12 months',
                    '1-2 years', '2-3 years', '3-5 years',
                    '5+ years', 'All ages',
                  ].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  className="form-control"
                  value={form.tags}
                  onChange={e => set('tags', e.target.value)}
                  placeholder="cotton, newborn, summer"
                />
              </div>
            </div>

            <div className={styles.card}>
              <h3>👁️ Visibility</h3>
              <div className={styles.checkboxes}>
                {[
                  { key: 'isActive', label: '✅ Active (visible to customers)' },
                  { key: 'isFeatured', label: '⭐ Featured (shown on home page)' },
                  { key: 'isTrending', label: '🔥 Trending (shown on home page)' },
                ].map(({ key, label }) => (
                  <label key={key} className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={e => set(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                ℹ️ Active products appear immediately on customer pages.
              </p>
            </div>

            <div className={styles.submitRow}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || uploading}
                style={{ flex: 1 }}
              >
                {loading
                  ? '⏳ Saving...'
                  : isEdit
                  ? '💾 Update Product'
                  : '✨ Create Product'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}