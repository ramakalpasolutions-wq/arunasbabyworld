import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

// ✅ Use different variable names to avoid replacement issues
const OLD_PREFIX = 'first' + 'cry';   // becomes "firstcry" but won't be replaced
const NEW_PREFIX = 'arunas';

/* ============================================================
   GET — Check migration status
   ============================================================ */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Count files in R2
    let oldFolderFiles = 0;
    let newFolderFiles = 0;
    let continuationToken;

    // Count OLD prefix files
    do {
      const cmd = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `${OLD_PREFIX}/`,
        ContinuationToken: continuationToken,
      });
      const res = await R2.send(cmd);
      oldFolderFiles += (res.Contents?.length || 0);
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    // Count NEW prefix files
    continuationToken = undefined;
    do {
      const cmd = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `${NEW_PREFIX}/`,
        ContinuationToken: continuationToken,
      });
      const res = await R2.send(cmd);
      newFolderFiles += (res.Contents?.length || 0);
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    // Count DB records with old URLs
    const products = await prisma.product.findMany({
      select: { id: true, images: true, colorVariants: true },
    });

    let productsWithOldUrls = 0;
    let productImagesWithOldUrls = 0;
    let variantImagesWithOldUrls = 0;

    const oldPattern = `/${OLD_PREFIX}/`;

    products.forEach(p => {
      let hasOld = false;
      p.images?.forEach(img => {
        if (img?.url?.includes(oldPattern)) {
          productImagesWithOldUrls++;
          hasOld = true;
        }
      });
      p.colorVariants?.forEach(v => {
        v.images?.forEach(img => {
          if (img?.url?.includes(oldPattern)) {
            variantImagesWithOldUrls++;
            hasOld = true;
          }
        });
      });
      if (hasOld) productsWithOldUrls++;
    });

    const banners = await prisma.banner.findMany({
      select: { id: true, image: true, mobileImage: true, panels: true, gridImages: true },
    });

    let bannersWithOldUrls = 0;
    banners.forEach(b => {
      let hasOld = false;
      if (b.image?.url?.includes(oldPattern)) hasOld = true;
      if (b.mobileImage?.url?.includes(oldPattern)) hasOld = true;
      b.panels?.forEach(p => {
        if (p?.url?.includes(oldPattern)) hasOld = true;
      });
      b.gridImages?.forEach(g => {
        if (g?.url?.includes(oldPattern)) hasOld = true;
      });
      if (hasOld) bannersWithOldUrls++;
    });

    const brands = await prisma.brand.findMany({
      select: { id: true, logo: true },
    });
    const brandsWithOldUrls = brands.filter(b =>
      b.logo?.url?.includes(oldPattern)
    ).length;

    return NextResponse.json({
      r2: {
        oldFolderFiles,
        newFolderFiles,
        totalFiles: oldFolderFiles + newFolderFiles,
      },
      database: {
        totalProducts:            products.length,
        productsWithOldUrls,
        productImagesWithOldUrls,
        variantImagesWithOldUrls,
        totalBanners:             banners.length,
        bannersWithOldUrls,
        totalBrands:              brands.length,
        brandsWithOldUrls,
      },
      config: {
        bucket:    BUCKET_NAME,
        oldPrefix: OLD_PREFIX,
        newPrefix: NEW_PREFIX,
      },
    });

  } catch (error) {
    console.error('Migration status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ============================================================
   POST — Run migration
   ============================================================ */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { action } = await request.json();

    const results = {
      copyResults: null,
      dbResults: null,
    };

    if (action === 'copy-files' || action === 'full') {
      results.copyResults = await copyR2Files();
    }

    if (action === 'update-db' || action === 'full') {
      results.dbResults = await updateDatabaseUrls();
    }

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ============================================================
   COPY R2 FILES
   ============================================================ */
async function copyR2Files() {
  let copied = 0;
  let errors = 0;
  let continuationToken;
  const errorList = [];

  do {
    const listCmd = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${OLD_PREFIX}/`,
      ContinuationToken: continuationToken,
    });

    const listRes = await R2.send(listCmd);
    const files = listRes.Contents || [];

    for (const file of files) {
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

        if (copied % 100 === 0) {
          console.log(`✅ Copied ${copied} files...`);
        }
      } catch (err) {
        errors++;
        errorList.push({ file: oldKey, error: err.message });
        console.error(`❌ Failed to copy ${oldKey}:`, err.message);
      }
    }

    continuationToken = listRes.NextContinuationToken;
  } while (continuationToken);

  console.log(`\n🎉 Copy complete: ${copied} copied, ${errors} errors`);

  return {
    copied,
    errors,
    errorList: errorList.slice(0, 20),
  };
}

/* ============================================================
   UPDATE DATABASE URLs
   ============================================================ */
async function updateDatabaseUrls() {
  const results = {
    productsUpdated: 0,
    bannersUpdated:  0,
    brandsUpdated:   0,
    errors:          [],
  };

  const oldPattern = `/${OLD_PREFIX}/`;
  const newPattern = `/${NEW_PREFIX}/`;
  const oldKeyPattern = `${OLD_PREFIX}/`;
  const newKeyPattern = `${NEW_PREFIX}/`;

  // ✅ Update Products
  console.log('📦 Updating Products...');
  const products = await prisma.product.findMany();

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
      updateData.colorVariants = newVariants;
    }

    if (modified) {
      try {
        await prisma.product.update({
          where: { id: product.id },
          data:  updateData,
        });
        results.productsUpdated++;
      } catch (err) {
        results.errors.push({
          type: 'product',
          id:   product.id,
          error: err.message,
        });
      }
    }
  }

  // ✅ Update Banners
  console.log('🖼️ Updating Banners...');
  const banners = await prisma.banner.findMany();

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
        results.bannersUpdated++;
      } catch (err) {
        results.errors.push({
          type: 'banner',
          id:   banner.id,
          error: err.message,
        });
      }
    }
  }

  // ✅ Update Brands
  console.log('🏷️ Updating Brands...');
  const brands = await prisma.brand.findMany();

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
        results.brandsUpdated++;
      } catch (err) {
        results.errors.push({
          type: 'brand',
          id:   brand.id,
          error: err.message,
        });
      }
    }
  }

  console.log(`\n🎉 DB update complete!`);
  console.log(`   Products: ${results.productsUpdated}`);
  console.log(`   Banners:  ${results.bannersUpdated}`);
  console.log(`   Brands:   ${results.brandsUpdated}`);

  return results;
}