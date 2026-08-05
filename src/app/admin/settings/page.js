'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { uploadFileToR2 } from '@/lib/uploadFile';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    companyName:        '',
    tagline:            '',
    address:            '',
    city:               '',
    state:              '',
    pincode:            '',
    country:            'India',
    phone:              '',
    altPhone:           '',
    email:              '',
    website:            '',
    gstNumber:          '',
    panNumber:          '',
    logoUrl:            '',
    invoicePrefix:      'INV',
    invoiceFooter:      '',
    termsAndConditions: '',
    bankName:           '',
    accountNumber:      '',
    ifscCode:           '',
    upiId:              '',
  });
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res  = await fetch('/api/company-settings');
      const data = await res.json();
      if (data.settings) {
        // ✅ Strip DB-only fields before setting state
        const { id, _id, createdAt, updatedAt, ...cleanSettings } = data.settings;
        setSettings(prev => ({ ...prev, ...cleanSettings }));
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFileToR2(file, 'arunas/company');
      set('logoUrl', result.url);
      toast.success('Logo uploaded!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // ✅ Strip any DB fields that may have crept in
      const { id, _id, createdAt, updatedAt, ...payload } = settings;

      const res = await fetch('/api/company-settings', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('✅ Company settings saved!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width: '100%', padding: '10px 12px',
    border: '2px solid #EDD9FF', borderRadius: '10px',
    fontSize: '14px', fontFamily: 'Nunito, sans-serif',
    outline: 'none', background: 'white', color: '#2D1A4A',
    boxSizing: 'border-box',
  };

  const lbl = {
    display: 'block', fontSize: '11px', fontWeight: '800',
    color: '#7B2FBE', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: '#9585B0', fontWeight: '700' }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Nunito, sans-serif', maxWidth: '1000px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: '900', color: '#2D1A4A', margin: '0 0 4px' }}>
            ⚙️ Company Settings
          </h1>
          <p style={{ color: '#9585B0', margin: 0, fontSize: '0.9rem' }}>
            These details will appear on invoices and bills
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '11px 26px',
            background: saving ? '#ccc' : 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '14px', fontWeight: '800',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: saving ? 'none' : '0 6px 18px rgba(255,107,53,0.30)',
          }}
        >
          {saving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {/* Company Info Section */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        border: '2px solid #EDD9FF', marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(123,47,190,0.06)',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#7B2FBE', marginTop: 0, marginBottom: '18px' }}>
          🏢 Company Information
        </h2>

        <div style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label style={lbl}>Company Name *</label>
            <input
              type="text"
              value={settings.companyName || ''}
              onChange={e => set('companyName', e.target.value)}
              placeholder="Arunas Baby World"
              style={inp}
            />
          </div>

          <div>
            <label style={lbl}>Tagline</label>
            <input
              type="text"
              value={settings.tagline || ''}
              onChange={e => set('tagline', e.target.value)}
              placeholder="Where Every Little Moment Matters"
              style={inp}
            />
          </div>

          <div>
            <label style={lbl}>Logo</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt="Logo"
                  style={{
                    width: '80px', height: '80px', objectFit: 'contain',
                    border: '2px solid #EDD9FF', borderRadius: '10px',
                    padding: '4px', background: 'white',
                  }}
                />
              )}
              <label style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: 'linear-gradient(135deg,#F3E8FF,#EDE9FE)',
                border: '2px dashed #7B2FBE',
                borderRadius: '10px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: '800',
                color: '#7B2FBE',
                fontSize: '13px',
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                {uploading ? '⏳ Uploading...' : '📤 Upload Logo'}
              </label>
              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => set('logoUrl', '')}
                  style={{
                    padding: '8px 14px', background: '#FEE2E2', color: '#DC2626',
                    border: '1.5px solid #FCA5A5', borderRadius: '8px',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        border: '2px solid #EDD9FF', marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(123,47,190,0.06)',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#7B2FBE', marginTop: 0, marginBottom: '18px' }}>
          📍 Address
        </h2>

        <div style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label style={lbl}>Street Address</label>
            <textarea
              value={settings.address || ''}
              onChange={e => set('address', e.target.value)}
              placeholder="Shop No. 12, Main Street, Area"
              rows={2}
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}>City</label>
              <input
                type="text"
                value={settings.city || ''}
                onChange={e => set('city', e.target.value)}
                placeholder="Guntur"
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>State</label>
              <input
                type="text"
                value={settings.state || ''}
                onChange={e => set('state', e.target.value)}
                placeholder="Andhra Pradesh"
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Pincode</label>
              <input
                type="text"
                value={settings.pincode || ''}
                onChange={e => set('pincode', e.target.value)}
                placeholder="522007"
                maxLength={6}
                style={inp}
              />
            </div>
          </div>

          <div>
            <label style={lbl}>Country</label>
            <input
              type="text"
              value={settings.country || ''}
              onChange={e => set('country', e.target.value)}
              style={inp}
            />
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        border: '2px solid #EDD9FF', marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(123,47,190,0.06)',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#7B2FBE', marginTop: 0, marginBottom: '18px' }}>
          📞 Contact Information
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={lbl}>Primary Phone *</label>
            <input
              type="tel"
              value={settings.phone || ''}
              onChange={e => set('phone', e.target.value)}
              placeholder="+91 98765 43210"
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Alternate Phone</label>
            <input
              type="tel"
              value={settings.altPhone || ''}
              onChange={e => set('altPhone', e.target.value)}
              placeholder="+91 98765 43211"
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input
              type="email"
              value={settings.email || ''}
              onChange={e => set('email', e.target.value)}
              placeholder="info@arunasbabyworld.com"
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Website</label>
            <input
              type="url"
              value={settings.website || ''}
              onChange={e => set('website', e.target.value)}
              placeholder="www.arunasbabyworld.com"
              style={inp}
            />
          </div>
        </div>
      </div>

      {/* Tax Info Section */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        border: '2px solid #EDD9FF', marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(123,47,190,0.06)',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#7B2FBE', marginTop: 0, marginBottom: '18px' }}>
          🧾 Tax Information
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={lbl}>GST Number</label>
            <input
              type="text"
              value={settings.gstNumber || ''}
              onChange={e => set('gstNumber', e.target.value.toUpperCase())}
              placeholder="27AAAAA0000A1Z5"
              maxLength={15}
              style={{ ...inp, fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={lbl}>PAN Number</label>
            <input
              type="text"
              value={settings.panNumber || ''}
              onChange={e => set('panNumber', e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              style={{ ...inp, fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>

      {/* Invoice Settings */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        border: '2px solid #EDD9FF', marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(123,47,190,0.06)',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#7B2FBE', marginTop: 0, marginBottom: '18px' }}>
          📄 Invoice Settings
        </h2>

        <div style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label style={lbl}>Invoice Prefix</label>
            <input
              type="text"
              value={settings.invoicePrefix || ''}
              onChange={e => set('invoicePrefix', e.target.value.toUpperCase())}
              placeholder="INV"
              maxLength={5}
              style={inp}
            />
            <p style={{ fontSize: '11px', color: '#9585B0', marginTop: '4px', fontWeight: '600' }}>
              Example: INV-001, ABW-001
            </p>
          </div>

          <div>
            <label style={lbl}>Invoice Footer</label>
            <textarea
              value={settings.invoiceFooter || ''}
              onChange={e => set('invoiceFooter', e.target.value)}
              placeholder="Thank you for shopping with us!"
              rows={2}
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={lbl}>Terms & Conditions</label>
            <textarea
              value={settings.termsAndConditions || ''}
              onChange={e => set('termsAndConditions', e.target.value)}
              placeholder="1. Goods once sold cannot be returned...&#10;2. Warranty terms..."
              rows={4}
              style={{ ...inp, resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* Bank Details (Optional) */}
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        border: '2px solid #EDD9FF', marginBottom: '20px',
        boxShadow: '0 4px 16px rgba(123,47,190,0.06)',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#7B2FBE', marginTop: 0, marginBottom: '18px' }}>
          🏦 Bank Details (Optional — shown on invoice)
        </h2>

        <div style={{ display: 'grid', gap: '14px' }}>
          <div>
            <label style={lbl}>Bank Name</label>
            <input
              type="text"
              value={settings.bankName || ''}
              onChange={e => set('bankName', e.target.value)}
              placeholder="State Bank of India"
              style={inp}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={lbl}>Account Number</label>
              <input
                type="text"
                value={settings.accountNumber || ''}
                onChange={e => set('accountNumber', e.target.value)}
                placeholder="1234567890"
                style={{ ...inp, fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={lbl}>IFSC Code</label>
              <input
                type="text"
                value={settings.ifscCode || ''}
                onChange={e => set('ifscCode', e.target.value.toUpperCase())}
                placeholder="SBIN0001234"
                maxLength={11}
                style={{ ...inp, fontFamily: 'monospace' }}
              />
            </div>
          </div>
          <div>
            <label style={lbl}>UPI ID</label>
            <input
              type="text"
              value={settings.upiId || ''}
              onChange={e => set('upiId', e.target.value)}
              placeholder="yourname@paytm"
              style={inp}
            />
          </div>
        </div>
      </div>

      {/* Save Button (bottom) */}
      <div style={{
        display: 'flex', justifyContent: 'center', padding: '20px 0',
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '14px 40px',
            background: saving ? '#ccc' : 'linear-gradient(135deg,#FF6B35,#7B2FBE)',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: '900',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: saving ? 'none' : '0 8px 24px rgba(255,107,53,0.30)',
          }}
        >
          {saving ? '⏳ Saving...' : '💾 Save All Settings'}
        </button>
      </div>
    </div>
  );
}