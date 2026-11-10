import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
import Providers from './providers';
import '@/styles/globals.css';
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
} from '@/lib/seo';

// =========================================================
// WEBSITE METADATA
// =========================================================

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Baby & Kids Store Online`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'shopping',
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
    title: `${SITE_NAME} - Baby & Kids Store Online`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME, width: 1200, height: 630, type: 'image/jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Baby & Kids Store Online`,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export const viewport = {
  themeColor: '#264653',
};

// =========================================================
// GOOGLE ANALYTICS 4 & MICROSOFT CLARITY
// =========================================================

const GOOGLE_ANALYTICS_ID = 'G-WRC6VQLGE2';
const CLARITY_PROJECT_ID = 'yvi9pf6emf';

// =========================================================
// ROOT LAYOUT
// =========================================================

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || '';

  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>

      <body suppressHydrationWarning={true}>

        {/* ================================================= */}
        {/* MICROSOFT CLARITY - HEATMAPS AND SESSION REPLAYS */}
        {/* ================================================= */}

        {CLARITY_PROJECT_ID && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
          >
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){
                  (c[a].q=c[a].q||[]).push(arguments)
                };
                t=l.createElement(r);
                t.async=1;
                t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];
                y.parentNode.insertBefore(t,y);
              })(
                window,
                document,
                "clarity",
                "script",
                "${CLARITY_PROJECT_ID}"
              );
            `}
          </Script>
        )}

        {/* ================================================= */}
        {/* MICROSOFT CLARITY - LOGGED-IN USER IDENTIFICATION */}
        {/* ================================================= */}

        {userId && CLARITY_PROJECT_ID && (
          <Script
            id="clarity-identify"
            strategy="afterInteractive"
          >
            {`
              if (window.clarity) {
                window.clarity(
                  "identify",
                  ${JSON.stringify(userId)}
                );
              }
            `}
          </Script>
        )}

        {/* ================================================= */}
        {/* APPLICATION PROVIDERS */}
        {/* ================================================= */}

        <Providers session={session}>
          {children}

          {/* ============================================= */}
          {/* REACT HOT TOAST NOTIFICATIONS */}
          {/* ============================================= */}

          <Toaster
            position="bottom-center"
            reverseOrder={false}
            gutter={12}
            containerStyle={{
              bottom:
                'calc(env(safe-area-inset-bottom, 20px) + 20px)',
              left: 16,
              right: 16,
            }}
            toastOptions={{
              duration: 3000,
              style: {
                background:
                  'linear-gradient(135deg, #1F2937, #111827)',
                color: '#fff',
                padding: '14px 20px',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: 'Nunito, sans-serif',
                maxWidth: '92vw',
                boxShadow:
                  '0 12px 32px rgba(0, 0, 0, 0.25)',
                minWidth: '220px',
              },
              success: {
                duration: 3000,
                style: {
                  background:
                    'linear-gradient(135deg, #43A047, #388E3C)',
                  color: '#fff',
                  border:
                    '1.5px solid rgba(255,255,255,0.15)',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#43A047',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background:
                    'linear-gradient(135deg, #E53935, #C62828)',
                  color: '#fff',
                  border:
                    '1.5px solid rgba(255,255,255,0.15)',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#E53935',
                },
              },
              loading: {
                duration: Infinity,
                style: {
                  background:
                    'linear-gradient(135deg, #4FA3F0, #0369A1)',
                  color: '#fff',
                },
              },
              blank: {
                duration: 3000,
              },
            }}
          />
        </Providers>

        {/* ================================================= */}
        {/* GOOGLE ANALYTICS 4 - WEBSITE TRACKING */}
        {/* ================================================= */}

        <GoogleAnalytics gaId={GOOGLE_ANALYTICS_ID} />

      </body>
    </html>
  );
}