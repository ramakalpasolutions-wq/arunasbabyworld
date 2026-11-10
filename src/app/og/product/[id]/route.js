import prisma from '@/lib/prisma';

// Share-preview image for a product: /og/product/<id>
// WhatsApp, Facebook and others want a JPEG/PNG around 1200x630 and under ~300 KB.
// Product photos are stored as WebP in any shape, so this converts them on the fly.

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(request, { params }) {
  const { id } = await params;
  const fallback = new URL('/og-image.jpg', request.url);

  if (!/^[a-f0-9]{24}$/i.test(id)) return Response.redirect(fallback, 302);

  let imageUrl = null;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { images: true, colorVariants: true },
    });
    imageUrl =
      product?.images?.[0]?.url ||
      product?.colorVariants?.[0]?.images?.[0]?.url ||
      null;
  } catch {
    imageUrl = null;
  }

  if (!imageUrl) return Response.redirect(fallback, 302);

  try {
    const source = await fetch(imageUrl, { cache: 'no-store' });
    if (!source.ok) throw new Error(`image fetch failed: ${source.status}`);

    const sharp = (await import('sharp')).default;
    const jpeg = await sharp(Buffer.from(await source.arrayBuffer()))
      .rotate()
      .resize(WIDTH, HEIGHT, { fit: 'contain', background: '#FFFFFF' })
      .flatten({ background: '#FFFFFF' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return new Response(jpeg, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Product share image error:', error);
    // Conversion unavailable: fall back to the original photo
    return Response.redirect(imageUrl, 302);
  }
}
