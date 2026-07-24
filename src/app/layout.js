import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import Providers from './providers';
import '@/styles/globals.css';

export const metadata = {
  title: {
    default: 'Arunas Baby World',
    template: '%s | Arunas Baby World',
  },
  description: 'Shop the best baby clothing, toys, gear, and more. Premium quality for your little ones.',
  keywords: ['baby products', 'kids clothing', 'toys', 'baby gear'],
};

export default async function RootLayout({ children }) {
  // ✅ Get session on server side
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
        {/* ✅ Single Providers wrapper with session passed in */}
        <Providers session={session}>
          <CartProvider>
            <WishlistProvider>
              {children}

              {/* ✅ Bottom-center Toast — mobile safe + auto-close */}
              <Toaster
                position="bottom-center"
                reverseOrder={false}
                gutter={12}
                containerStyle={{
                  bottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)',
                  left: 16,
                  right: 16,
                }}
                toastOptions={{
                  // ✅ Default duration — auto-close after 3 seconds
                  duration: 3000,

                  // ✅ Default style
                  style: {
                    background: 'linear-gradient(135deg, #1F2937, #111827)',
                    color: '#fff',
                    padding: '14px 20px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: '700',
                    fontFamily: 'Nunito, sans-serif',
                    maxWidth: '92vw',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
                    minWidth: '220px',
                  },

                  // ✅ Success — Sky Blue theme
                  success: {
                    duration: 3000,
                    style: {
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#fff',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#10B981',
                    },
                  },

                  // ✅ Error
                  error: {
                    duration: 4000,
                    style: {
                      background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                      color: '#fff',
                      border: '1.5px solid rgba(255,255,255,0.15)',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#EF4444',
                    },
                  },

                  // ✅ Loading toast (spinner)
                  loading: {
                    duration: Infinity,
                    style: {
                      background: 'linear-gradient(135deg, #38BDF8, #0369A1)',
                      color: '#fff',
                    },
                  },

                  // ✅ Blank/custom toast
                  blank: {
                    duration: 3000,
                  },
                }}
              />
            </WishlistProvider>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}