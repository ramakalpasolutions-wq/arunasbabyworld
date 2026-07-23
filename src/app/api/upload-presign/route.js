// src/app/api/upload-presign/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPresignedUploadUrl } from '@/lib/r2';

export async function POST(request) {
  try {
    // ✅ Admin auth check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { filename, contentType, folder = 'products' } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      );
    }

    // ✅ Validate file types (IMAGES + VIDEOS)
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v',
    ];

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid type: ${contentType}. Allowed: Images (JPEG/PNG/WebP/GIF) or Videos (MP4/WebM/MOV)` },
        { status: 400 }
      );
    }

    // ✅ Generate presigned URL
    const { uploadUrl, publicUrl, key } = await getPresignedUploadUrl(
      filename,
      contentType,
      folder
    );

    return NextResponse.json({
      uploadUrl,                                                       // PUT to this URL
      publicUrl,                                                       // After upload, file lives here
      key,                                                             // R2 key
      url:      publicUrl,                                             // Cloudinary compatibility
      publicId: key,                                                   // Cloudinary compatibility
      type:     contentType.startsWith('video/') ? 'video' : 'image',
    });
  } catch (err) {
    console.error('Presign error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}