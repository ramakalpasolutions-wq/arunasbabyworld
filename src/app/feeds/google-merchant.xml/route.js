// Google Merchant Center product feed (free listings in Google Shopping).
// Add https://www.arunasbabyworld.com/feeds/google-merchant.xml in Merchant Center
// as a scheduled-fetch data source.
import prisma from '@/lib/prisma';
import {
  SITE_URL, SITE_NAME, absoluteUrl, cleanText,
  productPrices, productInStock, shippingCost,
} from '@/lib/seo';

export const revalidate = 3600;

const esc = (v) => String(v ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const money = (n) => `${Number(n).toFixed(2)} INR`;
const tag = (name, value) => (value === null || value === undefined || value === '' ? '' : `<${name}>${esc(value)}</${name}>`);

function item(p) {
  const imgs = [
    ...(p.images || []).map((i) => i?.url),
    ...(p.colorVariants || []).flatMap((v) => (v.images || []).map((i) => i?.url)),
  ].filter(Boolean);
  const unique = [...new Set(imgs)];
  if (!unique.length) return '';

  const { price, salePrice, selling } = productPrices(p);
  if (!price) return '';

  // Same stock status the product page shows, so Merchant Center finds no mismatch
  const inStock = productInStock(p);

  return [
    '<item>',
    tag('g:id', p.sku || p.id),
    tag('g:title', p.name.slice(0, 150)),
    tag('g:description', cleanText(p.description || p.shortDescription || p.name, 5000)),
    tag('g:link', absoluteUrl(`/products/${p.slug || p.id}`)),
    tag('g:image_link', unique[0]),
    ...unique.slice(1, 10).map((u) => tag('g:additional_image_link', u)),
    tag('g:availability', inStock ? 'in_stock' : 'out_of_stock'),
    tag('g:price', money(price)),
    salePrice ? tag('g:sale_price', money(salePrice)) : '',
    tag('g:condition', 'new'),
    p.brand ? tag('g:brand', p.brand.trim()) : '',
    // No GTIN/barcodes are stored for products yet
    tag('g:identifier_exists', 'no'),
    tag('g:product_type', p.category?.name ? `Baby & Kids > ${p.category.name}` : 'Baby & Kids'),
    tag('g:item_group_id', p.hasVariants ? p.id : ''),
    `<g:shipping><g:country>IN</g:country><g:service>Standard</g:service><g:price>${money(shippingCost(selling))}</g:price></g:shipping>`,
    '</item>',
  ].filter(Boolean).join('');
}

export async function GET() {
  let products = [];
  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true, sku: true, slug: true, name: true, description: true, shortDescription: true,
        price: true, discountPrice: true, stock: true, brand: true, images: true,
        hasVariants: true, colorVariants: true,
        category: { select: { name: true } },
      },
    });
  } catch (error) {
    console.error('Merchant feed: could not load products', error);
    return new Response('Feed temporarily unavailable', { status: 503 });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(SITE_NAME)}</title>
<link>${esc(SITE_URL)}</link>
<description>${esc(`${SITE_NAME} product feed`)}</description>
${products.map(item).filter(Boolean).join('\n')}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
