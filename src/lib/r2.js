// src/lib/r2.js

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ✅ R2 Client Setup
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const PUBLIC_URL  = process.env.CLOUDFLARE_R2_PUBLIC_URL;

/**
 * Generate unique filename
 * @param {string} originalName - Original file name
 * @param {string} folder - Folder path inside bucket
 */
const generateFileName = (originalName, folder = 'products') => {
  const ext       = originalName.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const random    = Math.random().toString(36).slice(2, 8);
  return `${folder}/${timestamp}-${random}.${ext}`;
};

/**
 * Upload file to Cloudflare R2 (server-side — small files only on Vercel)
 * @param {Buffer} buffer - File buffer
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
    const key = generateFileName(filename, folder);

    const command = new PutObjectCommand({
      Bucket:      BUCKET_NAME,
      Key:         key,
      Body:        buffer,
      ContentType: mimeType,
    });

    await R2.send(command);

    const url = `${PUBLIC_URL}/${key}`;

    return {
      url,
      key,
      secure_url: url,
      public_id:  key,
    };
  } catch (error) {
    console.error('R2 upload failed:', error);
    throw new Error('Failed to upload to R2: ' + error.message);
  }
};

/**
 * ✅ Generate presigned URL for direct browser → R2 upload
 * Bypasses Vercel's 4.5 MB serverless body limit
 * @param {string} filename - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} folder - Folder inside bucket
 * @returns {Promise<{uploadUrl: string, publicUrl: string, key: string}>}
 */
export const getPresignedUploadUrl = async (
  filename,
  mimeType,
  folder = 'products'
) => {
  try {
    const key = generateFileName(filename, folder);

    const command = new PutObjectCommand({
      Bucket:      BUCKET_NAME,
      Key:         key,
      ContentType: mimeType,
    });

    // Valid for 5 minutes
    const uploadUrl = await getSignedUrl(R2, command, { expiresIn: 300 });
    const publicUrl = `${PUBLIC_URL}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
    };
  } catch (error) {
    console.error('R2 presign failed:', error);
    throw new Error('Failed to generate upload URL: ' + error.message);
  }
};

/**
 * Delete file from Cloudflare R2
 * @param {string} key - File key (path inside bucket)
 * @returns {Promise<{result: string}>}
 */
export const deleteFromR2 = async (key) => {
  try {
    if (!key) return { result: 'ok' };

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key:    key,
    });

    await R2.send(command);

    return { result: 'ok' };
  } catch (error) {
    console.error('R2 delete failed:', error);
    throw new Error('Failed to delete from R2: ' + error.message);
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