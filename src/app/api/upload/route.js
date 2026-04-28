import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const folder = formData.get('folder') || 'firstcry';

    // ✅ Get ALL files from formData
    const files = formData.getAll('file');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploaded = [];

    // ✅ Upload each file to Cloudinary
    for (const file of files) {
      if (!file || typeof file === 'string') continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

      const result = await uploadToCloudinary(base64, folder);
      uploaded.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    return NextResponse.json({
      // ✅ Return all uploaded images
      images: uploaded,
      // ✅ Also return first image for backward compatibility
      url: uploaded[0]?.url,
      publicId: uploaded[0]?.publicId,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}