// src/lib/r2.js

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// ✅ R2 Client Setup
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

/**
 * Generate unique filename
 * @param {string} originalName - Original file name
 * @param {string} folder - Folder path inside bucket
 */
const generateFileName = (originalName, folder = 'products') => {
  const ext = originalName.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${folder}/${timestamp}-${random}.${ext}`;
};

/**
 * Upload image to Cloudflare R2
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} folder - Folder inside bucket
 * @returns {Promise<{url: string, key: string, secure_url: string, public_id: string}>}
 */
export const uploadToR2 = async (
  buffer,
  filename,
  mimeType = 'image/jpeg',
  folder = 'products'
) => {
  try {
    // ✅ Generate unique key (path inside bucket)
    const key = generateFileName(filename, folder);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // ✅ Make file publicly readable
      // ACL: 'public-read', // Only if bucket ACL is enabled
    });

    await R2.send(command);

    // ✅ Build public URL
    const url = `${PUBLIC_URL}/${key}`;

    return {
      url,
      key,
      secure_url: url,   // ✅ Cloudinary compatibility
      public_id: key,    // ✅ Cloudinary compatibility (key used for deletion)
    };
  } catch (error) {
    console.error('R2 upload failed:', error);
    throw new Error('Failed to upload image to R2: ' + error.message);
  }
};

/**
 * Delete image from Cloudflare R2
 * @param {string} key - File key (path inside bucket)
 * @returns {Promise<{result: string}>}
 */
export const deleteFromR2 = async (key) => {
  try {
    if (!key) return { result: 'ok' };

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await R2.send(command);

    return { result: 'ok' };
  } catch (error) {
    console.error('R2 delete failed:', error);
    throw new Error('Failed to delete image from R2: ' + error.message);
  }
};

/**
 * Get full public URL from key
 * @param {string} key - File key
 */
export const getR2Url = (key) => {
  return `${PUBLIC_URL}/${key}`;
};

export default R2;