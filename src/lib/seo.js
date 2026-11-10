// Shared SEO helpers: one place for the site URL, default texts and metadata builders.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arunasbabyworld.com'
).replace(/\/$/, '');

export const SITE_NAME = 'Arunas Baby World';

export const DEFAULT_DESCRIPTION =
  'Shop baby clothing, toys, baby gear, feeding, bath and skin care, strollers, cradles and kids electric vehicles at Arunas Baby World. Trusted brands and fast delivery across India.';

export const DEFAULT_KEYWORDS = [
  'Arunas Baby World',
  'baby products online',
  'baby store Guntur',
  'baby clothing',
  'kids toys',
  'baby gear',
  'baby food',
  'baby care products',
  'strollers and prams',
  'kids electric vehicles',
];

// 1200x630 JPEG: the size and format WhatsApp, Facebook and X expect for link previews
export const DEFAULT_OG_IMAGE = '/og-image.jpg';
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function cleanText(value, max = 160) {
  if (!value) return '';
  const text = String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

/**
 * Metadata for a public, indexable page.
 * `title` goes through the root layout template ("%s | Arunas Baby World")
 * unless `absoluteTitle` is true.
 */
export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  absoluteTitle = false,
  keywords,
  index = true,
}) {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: path },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      images: image
        ? [{ url: image, alt: socialTitle, ...(image === DEFAULT_OG_IMAGE ? { ...OG_IMAGE_SIZE, type: 'image/jpeg' } : {}) }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: image ? [image] : [],
    },
  };
}

/** Metadata for account, cart and other private pages: kept out of search results. */
export function privateMetadata(title) {
  return {
    title,
    robots: { index: false, follow: false },
  };
}

/** Renders a JSON-LD structured-data script tag. */
export function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
