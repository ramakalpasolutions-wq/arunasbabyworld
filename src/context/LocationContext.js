'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

// ✅ STRICT ELIGIBLE GUNTUR CITY PINCODES ONLY
export const ELIGIBLE_GUNTUR_PINCODES = [
  '522001', // Guntur Bus Stand and central city areas
  '522002', // Guntur Head Post Office (HO) and Brodipet
  '522003', // Hindu College and Etukuru Road
  '522004', // A.T. Agraharam and Guntur Collectorate
  '522006', // S.V.N. Colony
  '522007', // Amaravathi Road and Chandramoulinagar
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
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Load location from localStorage on first mount
  useEffect(() => {
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      try {
        const { pincode, city } = JSON.parse(saved);
        setUserPincode(pincode || '');
        setUserCity(city || '');
        setIsLocationSet(true);
      } catch {}
    } else {
      // Show modal after 1 second delay for smooth UX
      const timer = setTimeout(() => {
        setShowLocationModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveLocation = (pincode, city = '') => {
    setUserPincode(pincode);
    setUserCity(city);
    setIsLocationSet(true);
    setShowLocationModal(false);
    localStorage.setItem('userLocation', JSON.stringify({ pincode, city }));
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