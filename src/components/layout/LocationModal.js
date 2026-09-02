'use client';
import { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import toast from 'react-hot-toast';

export default function LocationModal() {
  const { showLocationModal, setShowLocationModal, saveLocation } = useLocation();
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [detecting, setDetecting] = useState(false);

  if (!showLocationModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    saveLocation(pincode, city);
    if (pincode.startsWith('522')) {
      toast.success('🎉 Guntur location detected! You get 10% off on food items!', { duration: 4000 });
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
          // Reverse-geocode using OpenStreetMap (free & no API key required)
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
        toast.error('Please allow location access');
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
          <div style={{
            position: 'absolute',
            bottom: '-40px', left: '-40px',
            width: '120px', height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{ fontSize: '3rem', marginBottom: '8px', position: 'relative' }}>📍</div>
          <h2 style={{
            margin: 0,
            color: 'white',
            fontSize: '1.4rem',
            fontWeight: '900',
            position: 'relative',
          }}>
            Where are you shopping from?
          </h2>
          <p style={{
            margin: '6px 0 0',
            color: 'rgba(255,255,255,0.95)',
            fontSize: '0.85rem',
            fontWeight: '600',
            position: 'relative',
          }}>
            Get personalized offers & delivery details
          </p>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px' }}>
          {/* Guntur Special Banner */}
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
            border: '1.5px solid #10B981',
            borderRadius: '12px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{ fontSize: '1.5rem' }}>🎉</div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '900', color: '#065F46' }}>
                Guntur Residents Special!
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', fontWeight: '700', color: '#047857' }}>
                Get 10% OFF on all baby food items + Free Delivery
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: '800',
              color: '#6B4E8A',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Enter your Pincode *
            </label>
            <input
              type="tel"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g., 522007 for Guntur"
              autoFocus
              maxLength={6}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #EDD9FF',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                letterSpacing: '1.5px',
                textAlign: 'center',
              }}
            />

            {city && (
              <p style={{
                margin: '10px 0 0',
                fontSize: '0.82rem',
                color: '#6B7280',
                fontWeight: '700',
                textAlign: 'center',
              }}>
                📍 {city}
              </p>
            )}

            {pincode && pincode.length === 6 && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: pincode.startsWith('522') ? '#ECFDF5' : '#F9FAFB',
                border: `1.5px solid ${pincode.startsWith('522') ? '#10B981' : '#E5E7EB'}`,
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: '700',
                color: pincode.startsWith('522') ? '#065F46' : '#6B7280',
                textAlign: 'center',
              }}>
                {pincode.startsWith('522')
                  ? '🎉 Guntur Detected — 10% food discount unlocked!'
                  : '📍 Standard delivery rates apply'}
              </div>
            )}

            <button
              type="button"
              onClick={handleAutoDetect}
              disabled={detecting}
              style={{
                width: '100%',
                padding: '11px',
                marginTop: '14px',
                background: 'white',
                border: '1.5px dashed #7B2FBE',
                borderRadius: '10px',
                color: '#7B2FBE',
                fontWeight: '800',
                cursor: detecting ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
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
                <>📡 Auto-Detect My Location</>
              )}
            </button>

            <button
              type="submit"
              disabled={pincode.length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '14px',
                background: pincode.length === 6 ? 'linear-gradient(135deg, #FF6B9D, #7B2FBE)' : '#E5E7EB',
                border: 'none',
                borderRadius: '12px',
                color: pincode.length === 6 ? 'white' : '#9CA3AF',
                fontWeight: '900',
                fontSize: '0.95rem',
                cursor: pincode.length === 6 ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                boxShadow: pincode.length === 6 ? '0 6px 20px rgba(123,47,190,0.30)' : 'none',
              }}
            >
              Confirm Location ✓
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
                fontFamily: 'inherit',
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