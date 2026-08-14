import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3';

// ✅ Vercel timeout config — Pro users get 60s
export const maxDuration = 60;   // seconds
export const dynamic     = 'force-dynamic';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const OLD_PREFIX = 'first' + 'cry';
const NEW_PREFIX = 'arunas';

// ✅ Chunk size — process only this many files per request
const COPY_CHUNK_SIZE = 200;
const DB_CHUNK_SIZE   = 100;

/* ============================================================
   GET — Quick status check (FAST version)
   ============================================================ */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const skipCount = searchParams.get('skipCount') === 'true';

    let oldFolderFiles = 0;
    let newFolderFiles = 0;

    if (!skipCount) {
      // ✅ Quick count with limit (avoids timeout)
      try {
        const oldCmd = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: `${OLD_PREFIX}/`,
          MaxKeys: 1000,
        });
        const oldRes = await R2.send(oldCmd);
        oldFolderFiles = oldRes.KeyCount || 0;
        if (oldRes.IsTruncated) oldFolderFiles = `${oldFolderFiles}+`;

        const newCmd = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: `${NEW_PREFIX}/`,
          MaxKeys: 1000,
        });
        const newRes = await R2.send(newCmd);
        newFolderFiles = newRes.KeyCount || 0;
        if (newRes.IsTruncated) newFolderFiles = `${newFolderFiles}+`;
      } catch (err) {
        console.error('R2 count error:', err);
      }
    }

    // ✅ Quick DB counts (no full scan)
    const [totalProducts, totalBanners, totalBrands] = await Promise.all([
      prisma.product.count(),
      prisma.banner.count(),
      prisma.brand.count(),
    ]);

    return NextResponse.json({
      r2: {
        oldFolderFiles,
        newFolderFiles,
      },
      database: {
        totalProducts,
        totalBanners,
        totalBrands,
      },
      config: {
        bucket:         BUCKET_NAME,
        oldPrefix:      OLD_PREFIX,
        newPrefix:      NEW_PREFIX,
        copyChunkSize:  COPY_CHUNK_SIZE,
        dbChunkSize:    DB_CHUNK_SIZE,
      },
    });

  } catch (error) {
    console.error('Migration status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ============================================================
   POST — Run migration in CHUNKS
   ============================================================ */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { action, continuationToken, dbSkip } = await request.json();

    if (action === 'copy-chunk') {
      const result = await copyR2FilesChunk(continuationToken);
      return NextResponse.json(result);
    }

    if (action === 'update-products-chunk') {
      const result = await updateProductsChunk(dbSkip || 0);
      return NextResponse.json(result);
    }

    if (action === 'update-banners') {
      const result = await updateBanners();
      return NextResponse.json(result);
    }

    if (action === 'update-brands') {
      const result = await updateBrands();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ============================================================
   COPY CHUNK OF R2 FILES
   ============================================================ */
async function copyR2FilesChunk(continuationToken) {
  let copied = 0;
  let errors = 0;
  const errorList = [];

  const listCmd = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: `${OLD_PREFIX}/`,
    MaxKeys: COPY_CHUNK_SIZE,
    ContinuationToken: continuationToken,
  });

  const listRes = await R2.send(listCmd);
  const files = listRes.Contents || [];

  // ✅ Parallel copy — 20 at a time for speed
  const BATCH_SIZE = 20;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (file) => {
        const oldKey = file.Key;
        const newKey = oldKey.replace(`${OLD_PREFIX}/`, `${NEW_PREFIX}/`);

        try {
          const copyCmd = new CopyObjectCommand({
            Bucket:     BUCKET_NAME,
            CopySource: `${BUCKET_NAME}/${encodeURIComponent(oldKey)}`,
            Key:        newKey,
          });
          await R2.send(copyCmd);
          copied++;
        } catch (err) {
          errors++;
          errorList.push({ file: oldKey, error: err.message });
        }
      })
    );
  }

  return {
    copied,
    errors,
    errorList: errorList.slice(0, 10),
    hasMore: listRes.IsTruncated || false,
    nextToken: listRes.NextContinuationToken || null,
    processedCount: files.length,
  };
}

/* ============================================================
   UPDATE PRODUCTS CHUNK
   ============================================================ */
async function updateProductsChunk(skip = 0) {
  const oldPattern = `/${OLD_PREFIX}/`;
  const newPattern = `/${NEW_PREFIX}/`;
  const oldKeyPattern = `${OLD_PREFIX}/`;
  const newKeyPattern = `${NEW_PREFIX}/`;

  const products = await prisma.product.findMany({
    skip,
    take: DB_CHUNK_SIZE,
  });

  let updated = 0;
  const errors = [];

  for (const product of products) {
    let modified = false;
    const updateData = {};

    if (product.images?.length > 0) {
      const newImages = product.images.map(img => {
        if (img?.url?.includes(oldPattern)) {
          modified = true;
          return {
            ...img,
            url:      img.url.replace(oldPattern, newPattern),
            publicId: img.publicId?.replace(oldKeyPattern, newKeyPattern) || img.publicId,
          };
        }
        return img;
      });
      updateData.images = newImages;
    }

    if (product.colorVariants?.length > 0) {
      const newVariants = product.colorVariants.map(v => {
        if (v.images?.length > 0) {
          const newVariantImages = v.images.map(img => {
            if (img?.url?.includes(oldPattern)) {
              modified = true;
              return {
                ...img,
                url:      img.url.replace(oldPattern, newPattern),
                publicId: img.publicId?.replace(oldKeyPattern, newKeyPattern) || img.publicId,
              };
            }
            return img;
          });
          return { ...v, images: newVariantImages };
        }
        return v;
      });
      if (modified) updateData.colorVariants = newVariants;
    }

    if (modified) {
      try {
        await prisma.product.update({
          where: { id: product.id },
          data:  updateData,
        });
        updated++;
      } catch (err) {
        errors.push({ id: product.id, error: err.message });
      }
    }
  }

  return {
    updated,
    processedCount: products.length,
    errors: errors.slice(0, 10),
    hasMore: products.length === DB_CHUNK_SIZE,
    nextSkip: skip + DB_CHUNK_SIZE,
  };
}

/* ============================================================
   UPDATE ALL BANNERS (small number, do in one shot)
   ============================================================ */
async function updateBanners() {
  const oldPattern = `/${OLD_PREFIX}/`;
  const newPattern = `/${NEW_PREFIX}/`;
  const oldKeyPattern = `${OLD_PREFIX}/`;
  const newKeyPattern = `${NEW_PREFIX}/`;

  const banners = await prisma.banner.findMany();
  let updated = 0;
  const errors = [];

  for (const banner of banners) {
    let modified = false;
    const updateData = {};

    if (banner.image?.url?.includes(oldPattern)) {
      updateData.image = {
        ...banner.image,
        url:      banner.image.url.replace(oldPattern, newPattern),
        publicId: banner.image.publicId?.replace(oldKeyPattern, newKeyPattern) || banner.image.publicId,
      };
      modified = true;
    }

    if (banner.mobileImage?.url?.includes(oldPattern)) {
      updateData.mobileImage = {
        ...banner.mobileImage,
        url:      banner.mobileImage.url.replace(oldPattern, newPattern),
        publicId: banner.mobileImage.publicId?.replace(oldKeyPattern, newKeyPattern) || banner.mobileImage.publicId,
      };
      modified = true;
    }

    if (banner.panels?.length > 0) {
      const newPanels = banner.panels.map(p => {
        if (p?.url?.includes(oldPattern)) {
          modified = true;
          return {
            ...p,
            url:      p.url.replace(oldPattern, newPattern),
            publicId: p.publicId?.replace(oldKeyPattern, newKeyPattern) || p.publicId,
          };
        }
        return p;
      });
      updateData.panels = newPanels;
    }

    if (banner.gridImages?.length > 0) {
      const newGridImages = banner.gridImages.map(g => {
        if (g?.url?.includes(oldPattern)) {
          modified = true;
          return {
            ...g,
            url:      g.url.replace(oldPattern, newPattern),
            publicId: g.publicId?.replace(oldKeyPattern, newKeyPattern) || g.publicId,
          };
        }
        return g;
      });
      updateData.gridImages = newGridImages;
    }

    if (modified) {
      try {
        await prisma.banner.update({
          where: { id: banner.id },
          data:  updateData,
        });
        updated++;
      } catch (err) {
        errors.push({ id: banner.id, error: err.message });
      }
    }
  }

  return { updated, total: banners.length, errors };
}

/* ============================================================
   UPDATE ALL BRANDS
   ============================================================ */
async function updateBrands() {
  const oldPattern = `/${OLD_PREFIX}/`;
  const newPattern = `/${NEW_PREFIX}/`;
  const oldKeyPattern = `${OLD_PREFIX}/`;
  const newKeyPattern = `${NEW_PREFIX}/`;

  const brands = await prisma.brand.findMany();
  let updated = 0;
  const errors = [];

  for (const brand of brands) {
    if (brand.logo?.url?.includes(oldPattern)) {
      try {
        await prisma.brand.update({
          where: { id: brand.id },
          data: {
            logo: {
              ...brand.logo,
              url:      brand.logo.url.replace(oldPattern, newPattern),
              publicId: brand.logo.publicId?.replace(oldKeyPattern, newKeyPattern) || brand.logo.publicId,
            },
          },
        });
        updated++;
      } catch (err) {
        errors.push({ id: brand.id, error: err.message });
      }
    }
  }

  return { updated, total: brands.length, errors };
}