// src/lib/uploadFile.js

/**
 * ✅ Upload file directly to R2 via presigned URL
 * Bypasses Vercel's 4.5 MB serverless body limit
 *
 * @param {File} file - The file to upload (from input.files[0])
 * @param {string} folder - R2 folder path (e.g., 'arunas/banners/hero')
 * @param {(percent: number) => void} onProgress - Optional progress callback
 * @returns {Promise<{url: string, publicId: string, type: 'image'|'video'}>}
 */
export async function uploadFileToR2(file, folder = 'uploads', onProgress) {
  if (!file) throw new Error('No file provided');

  // 1️⃣ Fix empty file type (Common on Windows/iOS for video files)
  let contentType = file.type;
  if (!contentType) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const mimeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      m4v: 'video/x-m4v',
    };
    contentType = mimeMap[ext] || 'application/octet-stream';
  }

  // 2️⃣ Client-side size validation
  const isVideo = contentType.startsWith('video/');
  const maxSize = isVideo ? 100 * 1024 * 1024 : 15 * 1024 * 1024; // 100MB for video, 15MB for image
  if (file.size > maxSize) {
    const limitMB = isVideo ? 100 : 15;
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max limit: ${limitMB} MB`
    );
  }

  // 3️⃣ Get presigned URL from API
  const presignRes = await fetch('/api/upload-presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: contentType,
      folder,
    }),
  });

  const presignData = await presignRes.json().catch(() => ({}));

  if (!presignRes.ok) {
    throw new Error(presignData.error || `Presign failed (${presignRes.status})`);
  }

  const { uploadUrl, publicUrl, key } = presignData;

  if (!uploadUrl) {
    throw new Error('Upload URL missing from server response. Check R2 environment variables.');
  }

  // 4️⃣ Direct PUT upload to Cloudflare R2
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
        reject(
          new Error(
            `R2 returned error ${xhr.status}. Check R2 bucket permissions or env keys.`
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Upload blocked by browser or network. Open F12 > Network tab to inspect failing request.'
        )
      );
    };

    xhr.ontimeout = () => reject(new Error('Upload timed out. Try a smaller file.'));

    xhr.open('PUT', uploadUrl);
    // MUST match contentType sent to presign API exactly
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.timeout = 10 * 60 * 1000; // 10 minute timeout for large videos
    xhr.send(file);
  });

  // 5️⃣ Return standard response format
  return {
    url: publicUrl,
    publicId: key,
    type: isVideo ? 'video' : 'image',
  };
}