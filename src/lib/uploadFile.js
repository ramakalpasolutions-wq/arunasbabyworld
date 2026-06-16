// src/lib/uploadFile.js

/**
 * ✅ Upload file directly to R2 via presigned URL
 * Bypasses Vercel's 4.5 MB serverless body limit
 * Works for files up to 50 MB
 *
 * @param {File} file - The file to upload (from input.files[0])
 * @param {string} folder - R2 folder path (e.g., 'firstcry/banners/hero')
 * @param {(percent: number) => void} onProgress - Optional progress callback
 * @returns {Promise<{url: string, publicId: string, type: 'image'|'video'}>}
 */
export async function uploadFileToR2(file, folder = 'uploads', onProgress) {
  if (!file) throw new Error('No file provided');

  // ✅ Client-side validation
  const isVideo = file.type.startsWith('video/');
  const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    const limitMB = isVideo ? 50 : 10;
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: ${limitMB} MB`
    );
  }

  // 1️⃣ Get presigned URL from your API
  const presignRes = await fetch('/api/upload-presign', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      filename:    file.name,
      contentType: file.type,
      folder,
    }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    throw new Error(err.error || `Presign failed (${presignRes.status})`);
  }

  const { uploadUrl, publicUrl, key } = await presignRes.json();

  // 2️⃣ Upload file DIRECTLY to R2 (bypasses Vercel completely)
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status}`));
      }
    };

    xhr.onerror   = () => reject(new Error('Network error during upload'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.timeout = 5 * 60 * 1000;   // 5 minutes
    xhr.send(file);
  });

  // 3️⃣ Return in your existing format
  return {
    url:      publicUrl,
    publicId: key,
    type:     isVideo ? 'video' : 'image',
  };
}