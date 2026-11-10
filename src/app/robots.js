import { SITE_URL } from '@/lib/seo';

// Served at /robots.txt
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/cart',
          '/checkout',
          '/orders',
          '/profile',
          '/wishlist',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
