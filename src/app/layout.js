import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
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

// ⬇️ Replace with your Microsoft Clarity Project ID from https://clarity.microsoft.com/
const CLARITY_PROJECT_ID = 'YOUR_CLARITY_PROJECT_ID';

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || '';

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

        {/* ========================================================= */}
        {/* 🔥 MICROSOFT CLARITY — Click/Scroll Heatmaps + Replays   */}
        {/* ========================================================= */}
        {CLARITY_PROJECT_ID !== 'YOUR_CLARITY_PROJECT_ID' && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
            `}
          </Script>
        )}

        {/* Link logged-in users for personalized replays */}
        {userId && CLARITY_PROJECT_ID !== 'YOUR_CLARITY_PROJECT_ID' && (
          <Script id="clarity-identify" strategy="afterInteractive">
            {`
              if (window.clarity) {
                window.clarity("identify", "${userId}");
              }
            `}
          </Script>
        )}

        <Providers session={session}>
          {children}

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
              duration: 3000,
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
              success: {
                duration: 3000,
                style: {
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                },
                iconTheme: { primary: '#fff', secondary: '#10B981' },
              },
              error: {
                duration: 4000,
                style: {
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#fff',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                },
                iconTheme: { primary: '#fff', secondary: '#EF4444' },
              },
              loading: {
                duration: Infinity,
                style: {
                  background: 'linear-gradient(135deg, #38BDF8, #0369A1)',
                  color: '#fff',
                },
              },
              blank: { duration: 3000 },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}