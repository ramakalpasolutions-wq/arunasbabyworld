'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export function isGunturPincode(pincode) {
  if (!pincode) return false;
  const p = String(pincode).trim();
  return p.startsWith('522');
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

  const isGuntur = isGunturPincode(userPincode) || userCity.toLowerCase().includes('guntur');

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