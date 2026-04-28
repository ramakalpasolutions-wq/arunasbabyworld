'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AGE_GROUPS = [
  '0-3 months',
  '3-6 months',
  '6-12 months',
  '1-2 years',
  '2-3 years',
  '3-5 years',
  '5+ years',
  'All ages',
];

export default function BulkUploadClient() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []));
  }, []);

  const handleFiles = async (files) => {
    if (!selectedCategory) {
      toast.error('⚠️ Please select a category first!');
      return;
    }

    const imageFiles = Array.from(files).filter(f =>
      f.type.startsWith('image/')
    );

    if (!imageFiles.length) {
      toast.error('Please select image files only');
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${imageFiles.length} images...`);

    try {
      const fd = new FormData();
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} too large. Max 5MB`);
          continue;
        }
        fd.append('file', file);
      }
      fd.append('folder', 'firstcry/products');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const uploadedImages = data.images || [];

      if (uploadedImages.length === 0) {
        toast.error('No images uploaded');
        return;
      }

      // ✅ Each image = 1 product card with ageGroup field
      const newProducts = uploadedImages.map((img, i) => ({
        id: `${Date.now()}-${i}`,
        name: '',
        price: '',
        discountPrice: '',
        stock: '',
        shortDescription: '',
        brand: '',
        ageGroup: '',
        isFeatured: false,
        isTrending: false,
        isActive: true,
        images: [img],
      }));

      setProducts(prev => [...prev, ...newProducts]);
      toast.success(`✅ ${uploadedImages.length} images uploaded! Fill details below.`);

    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const updateProduct = (id, key, value) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, [key]: value } : p)
    );
  };

  const removeProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Removed');
  };

  const handleSaveAll = async () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }
    if (products.length === 0) {
      toast.error('No products to save');
      return;
    }

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.name) { toast.error(`Product #${i + 1}: Name is required`); return; }
      if (!p.price) { toast.error(`Product #${i + 1}: Price is required`); return; }
      if (!p.stock) { toast.error(`Product #${i + 1}: Stock is required`); return; }
    }

    setSaving(true);
    const toastId = toast.loading(`Saving ${products.length} products...`);

    try {
      const payload = {
        categoryId: selectedCategory,
        products: products.map(p => ({
          name: p.name,
          shortDescription: p.shortDescription || null,
          price: parseFloat(p.price),
          discountPrice: p.discountPrice ? parseFloat(p.discountPrice) : null,
          stock: parseInt(p.stock),
          brand: p.brand || null,
          ageGroup: p.ageGroup || null,
          isFeatured: p.isFeatured,
          isTrending: p.isTrending,
          isActive: p.isActive,
          images: p.images,
          tags: [],
          features: [],
        })),
      };

      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      toast.dismiss(toastId);

      if (!res.ok) throw new Error(data.error || 'Save failed');

      toast.success(`🎉 ${data.saved} products saved to ${selectedCategoryName}!`);

      if (data.failed > 0) {
        toast.error(`❌ ${data.failed} products failed`);
      }

      setProducts([]);
      setTimeout(() => router.push('/admin/products'), 1500);

    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryName =
    categories.find(c => c.id === selectedCategory)?.name || '';

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px' }}>
            📦 Bulk Product Upload
          </h1>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
            Upload multiple images → Each image = 1 product in selected category
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/products')}
          style={{
            padding: '8px 20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Back to Products
        </button>
      </div>

      {/* STEP 1 - CATEGORY */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: selectedCategory ? '2px solid #10b981' : '2px solid #eee',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700' }}>
          📌 Step 1: Select Category
        </h3>
        <p style={{ color: '#999', fontSize: '13px', margin: '0 0 16px' }}>
          All uploaded products will go into this category
        </p>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px',
            border: '2px solid #eee',
            borderRadius: '10px',
            fontSize: '15px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">-- Select Category --</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ''}{c.name}
            </option>
          ))}
        </select>
        {selectedCategory && (
          <p style={{ color: '#10b981', fontSize: '14px', marginTop: '10px', fontWeight: '600' }}>
            ✅ Category: {selectedCategoryName}
          </p>
        )}
      </div>

      {/* STEP 2 - UPLOAD */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: products.length > 0 ? '2px solid #10b981' : '2px solid #eee',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700' }}>
          🖼️ Step 2: Upload Product Images
        </h3>
        <p style={{ color: '#999', fontSize: '13px', margin: '0 0 16px' }}>
          Select multiple images. Each image = 1 separate product.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#7c3aed' : '#ff6b9d'}`,
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            background: dragOver ? '#f3e8ff' : '#fff8fb',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
            style={{ display: 'none' }}
            disabled={uploading}
          />

          {uploading ? (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
              <p style={{ fontWeight: '600', color: '#ff6b9d', fontSize: '16px', margin: 0 }}>
                Uploading to Cloudinary...
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '56px', marginBottom: '12px' }}>📤</div>
              <p style={{ fontWeight: '700', fontSize: '18px', margin: '0 0 8px', color: '#1a1a2e' }}>
                Drag & Drop Images Here
              </p>
              <p style={{ color: '#999', fontSize: '14px', margin: '0 0 20px' }}>
                Each image → 1 product in{' '}
                <strong style={{ color: '#ff6b9d' }}>
                  {selectedCategoryName || 'selected category'}
                </strong>
              </p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{
                  background: 'linear-gradient(135deg, #ff6b9d, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                📁 Browse Multiple Images
              </button>
              <p style={{ color: '#bbb', fontSize: '12px', marginTop: '12px' }}>
                PNG, JPG, WEBP • Max 5MB each
              </p>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3 - FILL DETAILS */}
      {products.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700' }}>
                ✏️ Step 3: Fill Product Details
              </h3>
              <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>
                {products.length} products • Category: <strong>{selectedCategoryName}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setProducts([])}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ff4444',
                  color: '#ff4444',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                🗑️ Clear All
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #ff6b9d, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? '⏳ Saving...' : `✨ Save All ${products.length} Products`}
              </button>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {products.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={p.images[0]?.url}
                    alt={`Product ${idx + 1}`}
                    style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                  />
                  <span style={{
                    position: 'absolute', top: '8px', left: '8px',
                    background: '#ff6b9d', color: 'white',
                    padding: '2px 10px', borderRadius: '6px',
                    fontSize: '12px', fontWeight: '700',
                  }}>
                    #{idx + 1}
                  </span>
                  <span style={{
                    position: 'absolute', top: '8px', right: '40px',
                    background: 'rgba(0,0,0,0.6)', color: 'white',
                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                  }}>
                    {selectedCategoryName}
                  </span>
                  <button
                    onClick={() => removeProduct(p.id)}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(220,38,38,0.9)', color: 'white',
                      border: 'none', width: '28px', height: '28px',
                      borderRadius: '50%', cursor: 'pointer', fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Fields */}
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                  {/* Name */}
                  <input
                    value={p.name}
                    onChange={e => updateProduct(p.id, 'name', e.target.value)}
                    placeholder="Product Name *"
                    style={{
                      width: '100%', padding: '8px 10px',
                      border: !p.name ? '1px solid #ff4444' : '1px solid #eee',
                      borderRadius: '8px', fontSize: '13px',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  />

                  {/* Short Description */}
                  <input
                    value={p.shortDescription}
                    onChange={e => updateProduct(p.id, 'shortDescription', e.target.value)}
                    placeholder="Short Description"
                    style={{
                      width: '100%', padding: '8px 10px',
                      border: '1px solid #eee', borderRadius: '8px',
                      fontSize: '13px', boxSizing: 'border-box', outline: 'none',
                    }}
                  />

                  {/* Price & Discount */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="number"
                      value={p.price}
                      onChange={e => updateProduct(p.id, 'price', e.target.value)}
                      placeholder="Price ₹ *"
                      min="0"
                      style={{
                        width: '100%', padding: '8px 10px',
                        border: !p.price ? '1px solid #ff4444' : '1px solid #eee',
                        borderRadius: '8px', fontSize: '13px',
                        boxSizing: 'border-box', outline: 'none',
                      }}
                    />
                    <input
                      type="number"
                      value={p.discountPrice}
                      onChange={e => updateProduct(p.id, 'discountPrice', e.target.value)}
                      placeholder="Discount ₹"
                      min="0"
                      style={{
                        width: '100%', padding: '8px 10px',
                        border: '1px solid #eee', borderRadius: '8px',
                        fontSize: '13px', boxSizing: 'border-box', outline: 'none',
                      }}
                    />
                  </div>

                  {/* Stock & Brand */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="number"
                      value={p.stock}
                      onChange={e => updateProduct(p.id, 'stock', e.target.value)}
                      placeholder="Stock *"
                      min="0"
                      style={{
                        width: '100%', padding: '8px 10px',
                        border: !p.stock ? '1px solid #ff4444' : '1px solid #eee',
                        borderRadius: '8px', fontSize: '13px',
                        boxSizing: 'border-box', outline: 'none',
                      }}
                    />
                    <input
                      value={p.brand}
                      onChange={e => updateProduct(p.id, 'brand', e.target.value)}
                      placeholder="Brand"
                      style={{
                        width: '100%', padding: '8px 10px',
                        border: '1px solid #eee', borderRadius: '8px',
                        fontSize: '13px', boxSizing: 'border-box', outline: 'none',
                      }}
                    />
                  </div>

                  {/* ✅ AGE GROUP DROPDOWN */}
                  <div>
                    <label style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: '4px',
                    }}>
                      👶 Age Group
                    </label>
                    <select
                      value={p.ageGroup}
                      onChange={e => updateProduct(p.id, 'ageGroup', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select Age Group</option>
                      {AGE_GROUPS.map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>

                  {/* Checkboxes */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={p.isActive}
                        onChange={e => updateProduct(p.id, 'isActive', e.target.checked)}
                      />
                      ✅ Active
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={p.isFeatured}
                        onChange={e => updateProduct(p.id, 'isFeatured', e.target.checked)}
                      />
                      ⭐ Featured
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={p.isTrending}
                        onChange={e => updateProduct(p.id, 'isTrending', e.target.checked)}
                      />
                      🔥 Trending
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Save */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                padding: '14px 48px',
                background: saving ? '#ccc' : 'linear-gradient(135deg, #ff6b9d, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving
                ? '⏳ Saving all products...'
                : `✨ Save All ${products.length} Products to ${selectedCategoryName}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}