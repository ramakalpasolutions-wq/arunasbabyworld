// src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const folder   = formData.get('folder') || 'products';
    const files    = formData.getAll('file');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // ✅ Allowed types — IMAGES + VIDEOS
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      // Videos
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v',
    ];

    const maxImageSize = 10 * 1024 * 1024;   // 10 MB images
    const maxVideoSize = 50 * 1024 * 1024;   // 50 MB videos
    const uploaded = [];

    for (const file of files) {
      if (!file || typeof file === 'string') continue;

      // ✅ Validate type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid type: ${file.type}. Allowed: Images (JPEG/PNG/WebP/GIF) or Videos (MP4/WebM/MOV)` },
          { status: 400 }
        );
      }

      // ✅ Validate size (different for images vs videos)
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? maxVideoSize : maxImageSize;
      if (file.size > maxSize) {
        const limitMB = isVideo ? 50 : 10;
        return NextResponse.json(
          { error: `File "${file.name}" exceeds ${limitMB} MB limit` },
          { status: 400 }
        );
      }

      const bytes  = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await uploadToR2(buffer, file.name, file.type, folder);

      uploaded.push({
        url:      result.url,
        publicId: result.key,
        type:     isVideo ? 'video' : 'image',  // ✅ extra metadata
      });
    }

    return NextResponse.json({
      images:   uploaded,
      url:      uploaded[0]?.url,
      publicId: uploaded[0]?.publicId,
      type:     uploaded[0]?.type,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}