import { Toaster } from 'react-hot-toast';
import SessionWrapper from '@/components/layout/SessionWrapper';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import '@/styles/globals.css';

export const metadata = {
  title: { default: 'BabyBliss - Premium Baby & Kids Store', template: '%s | BabyBliss' },
  description: 'Shop the best baby clothing, toys, gear, and more. Premium quality for your little ones.',
  keywords: ['baby products', 'kids clothing', 'toys', 'baby gear'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SessionWrapper>
          <CartProvider>
            <WishlistProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    fontFamily: 'Nunito, sans-serif',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                  },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
