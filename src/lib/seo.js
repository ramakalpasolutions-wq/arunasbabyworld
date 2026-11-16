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

// ---------------------------------------------------------------
// Product offer details shared by structured data and the Google Shopping feed.
// Must match src/lib/policies.js (shipping and exchange terms).
// ---------------------------------------------------------------

export const FREE_DELIVERY_FROM = 800;
export const DELIVERY_CHARGE = 50;
export const EXCHANGE_DAYS = 3;

/** Regular and selling price as the product card shows them (first colour variant wins). */
export function productPrices(product) {
  const v = product.hasVariants && product.colorVariants?.length ? product.colorVariants[0] : null;
  const price = Number(v?.price ?? product.price) || 0;
  const discount = Number(v?.discountPrice ?? product.discountPrice) || 0;
  const onSale = discount > 0 && discount < price;
  return { price, salePrice: onSale ? discount : null, selling: onSale ? discount : price };
}

/** In stock as the product page first shows it (the first colour variant, when there are variants). */
export function productInStock(product) {
  const v = product.hasVariants && product.colorVariants?.length ? product.colorVariants[0] : null;
  return (Number(v ? v.stock : product.stock) || 0) > 0;
}

export function shippingCost(sellingPrice) {
  return sellingPrice >= FREE_DELIVERY_FROM ? 0 : DELIVERY_CHARGE;
}

/** schema.org OfferShippingDetails for delivery anywhere in India. */
export function shippingDetailsLd(sellingPrice) {
  return {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: shippingCost(sellingPrice), currency: 'INR' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'DAY' },
    },
  };
}

/**
 * Store-wide delivery rates (free from FREE_DELIVERY_FROM). Google reads this from the
 * home page and can show "Free delivery over ₹800" next to products in search results.
 */
const servicePeriod = (min, max) => ({
  '@type': 'ServicePeriod',
  duration: { '@type': 'QuantitativeValue', minValue: min, maxValue: max, unitCode: 'd' },
});
export const SHIPPING_SERVICE_LD = {
  '@type': 'ShippingService',
  name: 'Standard delivery across India',
  handlingTime: servicePeriod(1, 2),
  shippingConditions: [
    {
      '@type': 'ShippingConditions',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
      orderValue: { '@type': 'MonetaryAmount', minValue: 0, maxValue: FREE_DELIVERY_FROM - 0.01, currency: 'INR' },
      shippingRate: { '@type': 'MonetaryAmount', value: DELIVERY_CHARGE, currency: 'INR' },
      transitTime: servicePeriod(3, 7),
    },
    {
      '@type': 'ShippingConditions',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
      orderValue: { '@type': 'MonetaryAmount', minValue: FREE_DELIVERY_FROM, currency: 'INR' },
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
      transitTime: servicePeriod(3, 7),
    },
  ],
};

export const RETURN_POLICY_LD = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'IN',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: EXCHANGE_DAYS,
  returnMethod: 'https://schema.org/ReturnByMail',
  merchantReturnLink: absoluteUrl('/refund-policy'),
};
