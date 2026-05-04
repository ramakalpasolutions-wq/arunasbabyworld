'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AGE_GROUPS = [
  '0-3 months', '3-6 months', '6-12 months',
  '1-2 years', '2-3 years', '3-5 years',
  '5-8 years', '8-12 years', '12+ years',
  'All ages',
];

const SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '0-3M', '3-6M', '6-9M', '6-12M',
  '12-18M', '18-24M',
  '1Y', '2Y', '3Y', '4Y', '5Y',
  '6Y', '7Y', '8Y', '9Y', '10Y',
  'Free Size',
];

const GENDERS = [
  { value: 'boy',    label: 'Boy' },
  { value: 'girl',   label: 'Girl' },
  { value: 'unisex', label: 'Unisex' },
];

const COLORS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Pink',
  'Purple', 'Orange', 'White', 'Black', 'Grey',
  'Brown', 'Navy', 'Maroon', 'Multicolor', 'Printed',
];

const MATERIALS = [
  'Cotton', 'Organic Cotton', 'Polyester',
  'Wool', 'Fleece', 'Denim', 'Linen',
  'Silk', 'Blend',
];

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #eee',
  borderRadius: '8px',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'inherit',
};

const labelStyle = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'block',
  marginBottom: '4px',
};

const selectStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #eee',
  borderRadius: '8px',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none',
  background: 'white',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export default function BulkUploadClient() {
  const router    = useRouter();
  const inputRef  = useRef(null);

  const [categories,        setCategories]        = useState([]);
  const [selectedCategory,  setSelectedCategory]  = useState('');
  const [uploading,         setUploading]         = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [dragOver,          setDragOver]          = useState(false);
  const [products,          setProducts]          = useState([]);

  // ✅ Check if selected category is clothing
  const selectedCat     = categories.find(c => c.id === selectedCategory);
  const selectedCatName = selectedCat?.name || '';
  const isClothingCat   = selectedCat?.slug?.toLowerCase().includes('cloth') ||
                          selectedCat?.name?.toLowerCase().includes('cloth') ||
                          selectedCat?.slug?.toLowerCase().includes('wear')  ||
                          selectedCat?.slug?.toLowerCase().includes('apparel');

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []));
  }, []);

  const handleFiles = async (files) => {
    if (!selectedCategory) {
      toast.error('Please select a category first!');
      return;
    }

    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
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

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      toast.dismiss(toastId);

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const uploadedImages = data.images || [];
      if (!uploadedImages.length) { toast.error('No images uploaded'); return; }

      const newProducts = uploadedImages.map((img, i) => ({
        id:               `${Date.now()}-${i}`,
        name:             '',
        price:            '',
        discountPrice:    '',
        stock:            '',
        shortDescription: '',
        brand:            '',
        ageGroup:         '',
        gender:           '',
        size:             '',
        color:            '',
        material:         '',
        isFeatured:       false,
        isTrending:       false,
        isActive:         true,
        images:           [img],
      }));

      setProducts(prev => [...prev, ...newProducts]);
      toast.success(`${uploadedImages.length} images uploaded! Fill details below.`);
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

  const updateProduct = (id, key, value) =>
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));

  const removeProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Removed');
  };

  const handleSaveAll = async () => {
    if (!selectedCategory) { toast.error('Please select a category'); return; }
    if (!products.length)   { toast.error('No products to save');     return; }

    // ✅ Validate
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (!p.name)  { toast.error(`Product #${i + 1}: Name required`);  return; }
      if (!p.price) { toast.error(`Product #${i + 1}: Price required`); return; }
      if (!p.stock) { toast.error(`Product #${i + 1}: Stock required`); return; }

      // ✅ Clothing validation
      if (isClothingCat && !p.gender) {
        toast.error(`Product #${i + 1}: Gender required for clothing`);
        return;
      }
      if (isClothingCat && !p.size) {
        toast.error(`Product #${i + 1}: Size required for clothing`);
        return;
      }
    }

    setSaving(true);
    const toastId = toast.loading(`Saving ${products.length} products...`);

    try {
      const payload = {
        categoryId: selectedCategory,
        products: products.map(p => ({
          name:             p.name,
          shortDescription: p.shortDescription || null,
          price:            parseFloat(p.price),
          discountPrice:    p.discountPrice ? parseFloat(p.discountPrice) : null,
          stock:            parseInt(p.stock),
          brand:            p.brand    || null,
          ageGroup:         p.ageGroup || null,
          gender:           p.gender   || null,
          size:             p.size     || null,
          color:            p.color    || null,
          material:         p.material || null,
          isFeatured:       p.isFeatured,
          isTrending:       p.isTrending,
          isActive:         p.isActive,
          images:           p.images,
          tags:             [],
          features:         [],
        })),
      };

      const res  = await fetch('/api/admin/products/bulk', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      toast.dismiss(toastId);

      if (!res.ok) throw new Error(data.error || 'Save failed');

      toast.success(`${data.saved} products saved to ${selectedCatName}!`);
      if (data.failed > 0) toast.error(`${data.failed} products failed`);

      setProducts([]);
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: "'Nunito', sans-serif",
    }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px', color: '#2D1A4A' }}>
            Bulk Product Upload
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '14px' }}>
            Upload multiple images — Each image becomes 1 product
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/products')}
          style={{
            padding: '8px 20px',
            border: '2px solid #EDD9FF',
            borderRadius: '10px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            color: '#6B4E8A',
            fontFamily: 'inherit',
          }}
        >
          Back to Products
        </button>
      </div>

      {/* ── STEP 1 — CATEGORY ── */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 12px rgba(123,47,190,0.08)',
        border: selectedCategory ? '2px solid #FF6B35' : '2px solid #EDD9FF',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#2D1A4A' }}>
          Step 1 — Select Category
        </h3>
        <p style={{ color: '#9585B0', fontSize: '13px', margin: '0 0 16px' }}>
          All uploaded products will go into this category
        </p>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{
            ...selectStyle,
            maxWidth: '400px',
            padding: '12px 16px',
            fontSize: '15px',
            border: '2px solid #EDD9FF',
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
          <div style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{
              padding: '5px 16px',
              background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)',
              border: '1.5px solid #EDD9FF',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: '700',
              color: '#FF6B35',
            }}>
              Selected: {selectedCatName}
            </span>
            {isClothingCat && (
              <span style={{
                padding: '5px 16px',
                background: '#FFF3EC',
                border: '1.5px solid #FFD4B8',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#FF6B35',
              }}>
                Clothing — Gender & Size required
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── STEP 2 — UPLOAD ── */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 12px rgba(123,47,190,0.08)',
        border: products.length > 0 ? '2px solid #FF6B35' : '2px solid #EDD9FF',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#2D1A4A' }}>
          Step 2 — Upload Product Images
        </h3>
        <p style={{ color: '#9585B0', fontSize: '13px', margin: '0 0 16px' }}>
          Select multiple images. Each image = 1 separate product.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#7B2FBE' : '#FF6B35'}`,
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            background: dragOver ? '#F3E8FF' : '#FFF9F5',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
            style={{ display: 'none' }}
            disabled={uploading}
          />

          {uploading ? (
            <div>
              <div style={{
                width: '44px', height: '44px',
                border: '4px solid rgba(255,107,53,0.2)',
                borderTop: '4px solid #FF6B35',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                margin: '0 auto 16px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ fontWeight: '700', color: '#FF6B35', fontSize: '16px', margin: 0 }}>
                Uploading to cloud...
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: '800', fontSize: '18px', margin: '0 0 8px', color: '#2D1A4A' }}>
                Drag & Drop Images Here
              </p>
              <p style={{ color: '#9585B0', fontSize: '14px', margin: '0 0 20px' }}>
                Each image → 1 product in{' '}
                <strong style={{ color: '#FF6B35' }}>
                  {selectedCatName || 'selected category'}
                </strong>
              </p>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{
                  background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Browse Multiple Images
              </button>
              <p style={{ color: '#C8B8DC', fontSize: '12px', marginTop: '12px' }}>
                PNG, JPG, WEBP — Max 5MB each
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── STEP 3 — FILL DETAILS ── */}
      {products.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(123,47,190,0.08)',
          border: '2px solid #EDD9FF',
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
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#2D1A4A' }}>
                Step 3 — Fill Product Details
              </h3>
              <p style={{ color: '#9585B0', fontSize: '13px', margin: 0 }}>
                {products.length} products — Category: <strong>{selectedCatName}</strong>
                {isClothingCat && (
                  <span style={{ color: '#FF6B35', marginLeft: '8px' }}>
                    (Gender & Size required)
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setProducts([])}
                style={{
                  padding: '8px 16px',
                  border: '2px solid #ff4444',
                  color: '#ff4444',
                  borderRadius: '10px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  fontFamily: 'inherit',
                }}
              >
                Clear All
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                style={{
                  padding: '10px 24px',
                  background: saving
                    ? '#ccc'
                    : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: saving ? 'none' : '0 4px 14px rgba(255,107,53,0.28)',
                }}
              >
                {saving ? 'Saving...' : `Save All ${products.length} Products`}
              </button>
            </div>
          </div>

          {/* ── PRODUCT CARDS GRID ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {products.map((p, idx) => (
              <div
                key={p.id}
                style={{
                  border: '2px solid #EDD9FF',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'white',
                  boxShadow: '0 2px 12px rgba(123,47,190,0.06)',
                }}
              >
                {/* Image */}
                <div style={{ position: 'relative' }}>
                  <img
                    src={p.images[0]?.url}
                    alt={`Product ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <span style={{
                    position: 'absolute', top: '8px', left: '8px',
                    background: 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                    color: 'white',
                    padding: '3px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}>
                    #{idx + 1}
                  </span>
                  <span style={{
                    position: 'absolute', top: '8px', right: '40px',
                    background: 'rgba(45,26,74,0.75)',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}>
                    {selectedCatName}
                  </span>
                  <button
                    onClick={() => removeProduct(p.id)}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(220,38,38,0.9)',
                      color: 'white',
                      border: 'none',
                      width: '28px', height: '28px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    x
                  </button>
                </div>

                {/* ── FIELDS ── */}
                <div style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>

                  {/* Name */}
                  <div>
                    <label style={labelStyle}>Product Name *</label>
                    <input
                      value={p.name}
                      onChange={e => updateProduct(p.id, 'name', e.target.value)}
                      placeholder="e.g. Baby Cotton T-Shirt"
                      style={{
                        ...inputStyle,
                        border: !p.name ? '1px solid #ff4444' : '1px solid #EDD9FF',
                      }}
                    />
                  </div>

                  {/* Short Description */}
                  <div>
                    <label style={labelStyle}>Short Description</label>
                    <input
                      value={p.shortDescription}
                      onChange={e => updateProduct(p.id, 'shortDescription', e.target.value)}
                      placeholder="Brief product description"
                      style={{ ...inputStyle, border: '1px solid #EDD9FF' }}
                    />
                  </div>

                  {/* Price & Discount */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>Price (Rs) *</label>
                      <input
                        type="number"
                        value={p.price}
                        onChange={e => updateProduct(p.id, 'price', e.target.value)}
                        placeholder="0"
                        min="0"
                        style={{
                          ...inputStyle,
                          border: !p.price ? '1px solid #ff4444' : '1px solid #EDD9FF',
                        }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Discount (Rs)</label>
                      <input
                        type="number"
                        value={p.discountPrice}
                        onChange={e => updateProduct(p.id, 'discountPrice', e.target.value)}
                        placeholder="Optional"
                        min="0"
                        style={{ ...inputStyle, border: '1px solid #EDD9FF' }}
                      />
                    </div>
                  </div>

                  {/* Stock & Brand */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>Stock *</label>
                      <input
                        type="number"
                        value={p.stock}
                        onChange={e => updateProduct(p.id, 'stock', e.target.value)}
                        placeholder="0"
                        min="0"
                        style={{
                          ...inputStyle,
                          border: !p.stock ? '1px solid #ff4444' : '1px solid #EDD9FF',
                        }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Brand</label>
                      <input
                        value={p.brand}
                        onChange={e => updateProduct(p.id, 'brand', e.target.value)}
                        placeholder="Brand name"
                        style={{ ...inputStyle, border: '1px solid #EDD9FF' }}
                      />
                    </div>
                  </div>

                  {/* Age Group */}
                  <div>
                    <label style={labelStyle}>Age Group</label>
                    <select
                      value={p.ageGroup}
                      onChange={e => updateProduct(p.id, 'ageGroup', e.target.value)}
                      style={{ ...selectStyle, border: '1px solid #EDD9FF' }}
                    >
                      <option value="">Select Age Group</option>
                      {AGE_GROUPS.map(age => (
                        <option key={age} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>

                  {/* ✅ CLOTHING FIELDS */}
                  {isClothingCat && (
                    <div style={{
                      background: 'linear-gradient(135deg, #FFF3EC, #F3E8FF)',
                      border: '1.5px solid #EDD9FF',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        color: '#FF6B35',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}>
                        Clothing Details
                      </div>

                      {/* Gender */}
                      <div>
                        <label style={labelStyle}>
                          Gender *
                          {isClothingCat && !p.gender && (
                            <span style={{ color: '#ff4444', marginLeft: '4px' }}>Required</span>
                          )}
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {GENDERS.map(g => (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => updateProduct(p.id, 'gender', g.value)}
                              style={{
                                flex: 1,
                                padding: '7px 4px',
                                borderRadius: '8px',
                                border: '1.5px solid',
                                borderColor: p.gender === g.value ? '#FF6B35' : '#EDD9FF',
                                background: p.gender === g.value
                                  ? 'linear-gradient(135deg, #FF6B35, #7B2FBE)'
                                  : 'white',
                                color: p.gender === g.value ? 'white' : '#6B4E8A',
                                fontWeight: '700',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontFamily: 'inherit',
                              }}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Size */}
                      <div>
                        <label style={labelStyle}>
                          Size *
                          {isClothingCat && !p.size && (
                            <span style={{ color: '#ff4444', marginLeft: '4px' }}>Required</span>
                          )}
                        </label>
                        <select
                          value={p.size}
                          onChange={e => updateProduct(p.id, 'size', e.target.value)}
                          style={{
                            ...selectStyle,
                            border: isClothingCat && !p.size
                              ? '1px solid #ff4444'
                              : '1px solid #EDD9FF',
                          }}
                        >
                          <option value="">Select Size</option>
                          <optgroup label="Baby Sizes">
                            {['0-3M','3-6M','6-9M','6-12M','12-18M','18-24M'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Kids Sizes (Years)">
                            {['1Y','2Y','3Y','4Y','5Y','6Y','7Y','8Y','9Y','10Y'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Standard Sizes">
                            {['XS','S','M','L','XL','XXL','Free Size'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Color */}
                      <div>
                        <label style={labelStyle}>Color</label>
                        <select
                          value={p.color}
                          onChange={e => updateProduct(p.id, 'color', e.target.value)}
                          style={{ ...selectStyle, border: '1px solid #EDD9FF' }}
                        >
                          <option value="">Select Color</option>
                          {COLORS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Material */}
                      <div>
                        <label style={labelStyle}>Material</label>
                        <select
                          value={p.material}
                          onChange={e => updateProduct(p.id, 'material', e.target.value)}
                          style={{ ...selectStyle, border: '1px solid #EDD9FF' }}
                        >
                          <option value="">Select Material</option>
                          {MATERIALS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      {/* Summary */}
                      {(p.gender || p.size) && (
                        <div style={{
                          padding: '8px 12px',
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid #EDD9FF',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6B4E8A',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}>
                          {p.gender   && <span style={{ color: '#FF6B35' }}>Gender: {p.gender.charAt(0).toUpperCase() + p.gender.slice(1)}</span>}
                          {p.size     && <span style={{ color: '#7B2FBE' }}>Size: {p.size}</span>}
                          {p.color    && <span style={{ color: '#0EA5E9' }}>Color: {p.color}</span>}
                          {p.material && <span style={{ color: '#22C55E' }}>Material: {p.material}</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkboxes */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'isActive',   label: 'Active' },
                      { key: 'isFeatured', label: 'Featured' },
                      { key: 'isTrending', label: 'Trending' },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          color: '#6B4E8A',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={p[key]}
                          onChange={e => updateProduct(p.id, key, e.target.checked)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Save Button */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                padding: '14px 48px',
                background: saving
                  ? '#ccc'
                  : 'linear-gradient(135deg, #FF6B35, #7B2FBE)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '800',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: saving ? 'none' : '0 6px 20px rgba(255,107,53,0.30)',
              }}
            >
              {saving
                ? 'Saving all products...'
                : `Save All ${products.length} Products to ${selectedCatName}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}