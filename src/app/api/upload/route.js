// src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadToR2 } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes timeout for large files

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || userRole !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const folder   = formData.get('folder') || 'products';
    const files    = formData.getAll('file');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v',
    ];

    const uploaded = [];

    for (const file of files) {
      if (!file || typeof file === 'string') continue;

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid type: ${file.type}` },
          { status: 400 }
        );
      }

      // Read buffer directly without file size restriction
      const bytes  = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await uploadToR2(buffer, file.name, file.type, folder);

      const isVideo = file.type.startsWith('video/');
      uploaded.push({
        url:      result.url,
        publicId: result.key,
        type:     isVideo ? 'video' : 'image',
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