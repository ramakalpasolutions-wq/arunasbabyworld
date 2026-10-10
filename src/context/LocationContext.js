'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

// ✅ STRICT ELIGIBLE GUNTUR CITY PINCODES ONLY
export const ELIGIBLE_GUNTUR_PINCODES = [
  '522001', // Guntur HO and central areas
  '522002', // Guntur Head Post Office (Main delivery office)
  '522003', // Etukuru Road and Hindu College area
  '522004', // A.T. Agraharam and Guntur Collectorate
  '522006', // S.V.N. Colony
  '522007', // Chandramouli Nagar
  '522034', // Industrial Estate
];

export function isGunturPincode(pincode) {
  if (!pincode) return false;
  const p = String(pincode).trim();
  return ELIGIBLE_GUNTUR_PINCODES.includes(p);
}

export function LocationProvider({ children }) {
  const [userPincode, setUserPincode] = useState('');
  const [userCity, setUserCity] = useState('');
  const [isLocationSet, setIsLocationSet] = useState(false);
  // Kept for optional manual override elsewhere (Header etc.) — never auto-opened
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    // 1. Use saved location if available
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      try {
        const { pincode, city } = JSON.parse(saved);
        setUserPincode(pincode || '');
        setUserCity(city || '');
        setIsLocationSet(true);
        return;
      } catch {}
    }

    // 2. No saved location → silent auto-detect (NO modal)
    autoDetectLocation();
  }, []);

  const saveLocation = (pincode, city = '') => {
    setUserPincode(pincode);
    setUserCity(city);
    setIsLocationSet(true);
    setShowLocationModal(false);
    localStorage.setItem('userLocation', JSON.stringify({ pincode, city }));
  };

  const autoDetectLocation = async () => {
    // Method 1: IP geolocation (silent, no browser permission popup)
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        const pincode = data.postal || '';
        const city = data.city || '';
        if (pincode) {
          saveLocation(pincode, city);
          return;
        }
      }
    } catch (err) {
      console.warn('IP geolocation failed, trying browser geolocation...', err);
    }

    // Method 2: Browser geolocation fallback
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await res.json();
          const pincode = data.address?.postcode || '';
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            '';
          if (pincode) {
            saveLocation(pincode, city);
          }
        } catch (err) {
          console.warn('Reverse geocode failed', err);
        }
      },
      (err) => {
        // Denied / timeout — stay without location, no modal
        console.warn('Geolocation denied/error', err);
      },
      { timeout: 8000, maximumAge: 600000 }
    );
  };

  const clearLocation = () => {
    setUserPincode('');
    setUserCity('');
    setIsLocationSet(false);
    localStorage.removeItem('userLocation');
  };

  const isGuntur = isGunturPincode(userPincode);

  return (
    <LocationContext.Provider
      value={{
        userPincode,
        userCity,
        isLocationSet,
        isGuntur,
        showLocationModal,
        setShowLocationModal,
        saveLocation,
        clearLocation,
        autoDetectLocation,
        ELIGIBLE_GUNTUR_PINCODES,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};