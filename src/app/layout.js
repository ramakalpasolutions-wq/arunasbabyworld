import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Toaster } from 'react-hot-toast';
import SessionWrapper from '@/components/layout/SessionWrapper';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import '@/styles/globals.css';

export const metadata = {
  title: {
    default: 'BabyBliss - Premium Baby & Kids Store',
    template: '%s | BabyBliss',
  },
  description: 'Shop the best baby clothing, toys, gear, and more. Premium quality for your little ones.',
  keywords: ['baby products', 'kids clothing', 'toys', 'baby gear'],
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning={true}>
        <SessionWrapper session={session}>
          <CartProvider>
            <WishlistProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: '700',
                    borderRadius: '12px',
                    fontSize: '14px',
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