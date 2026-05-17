// src/app/api/upload/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadToR2 } from '@/lib/r2';  // ✅ Changed from cloudinary

export async function POST(request) {
  try {
    // ✅ Auth check
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const folder = formData.get('folder') || 'products'; // ✅ R2 folder/prefix

    // ✅ Get ALL files from formData
    const files = formData.getAll('file');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // ✅ Allowed types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB
    const uploaded = [];

    for (const file of files) {
      if (!file || typeof file === 'string') continue;

      // ✅ Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`,
          },
          { status: 400 }
        );
      }

      // ✅ Validate file size
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 10MB limit` },
          { status: 400 }
        );
      }

      // ✅ Convert to buffer - No base64 needed (more efficient)
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // ✅ Upload to R2
      const result = await uploadToR2(buffer, file.name, file.type, folder);

      uploaded.push({
        url: result.url,
        publicId: result.key,  // ✅ R2 key (used for deletion later)
      });
    }

    // ✅ Same response structure - no frontend changes needed
    return NextResponse.json({
      images: uploaded,
      url: uploaded[0]?.url,
      publicId: uploaded[0]?.publicId,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}