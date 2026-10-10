'use client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { LocationProvider } from '@/context/LocationContext';
import FloatingWhatsApp from '@/components/layout/FloatingWhatsApp';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <LocationProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            <FloatingWhatsApp />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: '700',
                },
              }}
            />
          </WishlistProvider>
        </CartProvider>
      </LocationProvider>
    </SessionProvider>
  );
}