'use client';
import { useState } from 'react';
import { useLocation, isGunturPincode, ELIGIBLE_GUNTUR_PINCODES } from '@/context/LocationContext';
import toast from 'react-hot-toast';

export default function LocationModal() {
  const { showLocationModal, saveLocation } = useLocation();
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [detecting, setDetecting] = useState(false);

  if (!showLocationModal) return null;

  const isEligible = isGunturPincode(pincode);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    saveLocation(pincode, city);
    if (isEligible) {
      toast.success('🎉 Guntur City detected! You get 10% off on all Baby Food items!', { duration: 4000 });
    } else {
      toast.success('📍 Location saved!');
    }
  };

  const handleAutoDetect = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await res.json();
          const detectedPincode = data.address?.postcode || '';
          const detectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';

          if (detectedPincode) {
            setPincode(detectedPincode);
            setCity(detectedCity);
            toast.success(`📍 Detected: ${detectedCity}, ${detectedPincode}`);
          } else {
            toast.error('Could not detect pincode. Please enter manually.');
          }
        } catch (err) {
          toast.error('Location detection failed');
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        toast.error('Please allow location access or type pincode manually.');
      },
      { timeout: 10000 }
    );
  };

  const handleSkip = () => {
    saveLocation('', '');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.55)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: 'Nunito, sans-serif',
      }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6B9D, #7B2FBE)',
          padding: '24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px', right: '-50px',
            width: '150px', height: '150px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
          }} />
          <div style={{ fontSize: '3rem', marginBottom: '8px', position: 'relative' }}>📍</div>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: '900', position: 'relative' }}>
            Where should we deliver?
          </h2>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.95)', fontSize: '0.85rem', fontWeight: '600', position: 'relative' }}>
            Enter your pincode to check delivery availability and local deals
          </p>
        </div>

        {/* Body Content */}
        <div style={{ padding: '22px' }}>
          {/* Guntur Special Banner with precise clickable pills */}
          <div style={{
            padding: '12px 14px',
            background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
            border: '1.5px solid #10B981',
            borderRadius: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem' }}>🎉</span>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '900', color: '#065F46' }}>
                Guntur City Special Offer!
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: '700', color: '#047857', lineHeight: 1.4 }}>
              Get <strong>10% OFF</strong> on all Baby Food items for eligible Guntur pincodes:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
              {ELIGIBLE_GUNTUR_PINCODES.map(p => (
                <span
                  key={p}
                  onClick={() => setPincode(p)}
                  style={{
                    padding: '3px 8px',
                    background: pincode === p ? '#059669' : 'white',
                    color: pincode === p ? 'white' : '#065F46',
                    border: '1px solid #10B981',
                    borderRadius: '6px',
                    fontSize: '0.70rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={{
              display: 'block',
              fontSize: '0.80rem',
              fontWeight: '800',
              color: '#6B4E8A',
              marginBottom: '6px',
              textTransform: 'uppercase',
            }}>
              Enter Delivery Pincode *
            </label>
            <input
              type="tel"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 522007"
              autoFocus
              maxLength={6}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `2px solid ${isEligible ? '#10B981' : '#EDD9FF'}`,
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '900',
                outline: 'none',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                textAlign: 'center',
                letterSpacing: '2px',
              }}
            />

            {pincode.length === 6 && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                background: isEligible ? '#ECFDF5' : '#F9FAFB',
                border: `1.5px solid ${isEligible ? '#10B981' : '#E5E7EB'}`,
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '800',
                color: isEligible ? '#065F46' : '#6B7280',
                textAlign: 'center',
              }}>
                {isEligible
                  ? '🎉 Eligible Guntur Pincode — 10% Food Discount Active!'
                  : '📍 Standard Delivery Rates Apply'}
              </div>
            )}

            <button
              type="button"
              onClick={handleAutoDetect}
              disabled={detecting}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '12px',
                background: 'white',
                border: '1.5px dashed #7B2FBE',
                borderRadius: '10px',
                color: '#7B2FBE',
                fontWeight: '800',
                cursor: detecting ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {detecting ? (
                <>
                  <div style={{
                    width: '14px', height: '14px',
                    border: '2px solid #E9D5FF',
                    borderTop: '2px solid #7B2FBE',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Detecting your location...
                </>
              ) : (
                <>📡 Auto-Detect Location</>
              )}
            </button>

            <button
              type="submit"
              disabled={pincode.length !== 6}
              style={{
                width: '100%',
                padding: '13px',
                marginTop: '12px',
                background: pincode.length === 6 ? 'linear-gradient(135deg, #FF6B35, #7B2FBE)' : '#E5E7EB',
                border: 'none',
                borderRadius: '12px',
                color: pincode.length === 6 ? 'white' : '#9CA3AF',
                fontWeight: '900',
                fontSize: '0.95rem',
                cursor: pincode.length === 6 ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                boxShadow: pincode.length === 6 ? '0 4px 14px rgba(123,47,190,0.25)' : 'none',
              }}
            >
              Confirm Delivery Location ✓
            </button>

            <button
              type="button"
              onClick={handleSkip}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '8px',
                background: 'transparent',
                border: 'none',
                color: '#94969F',
                fontWeight: '600',
                fontSize: '0.80rem',
                cursor: 'pointer',
              }}
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}