import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// ✅ Strip fields Prisma doesn't allow in update
function cleanData(data) {
  const {
    id,
    _id,
    createdAt,
    updatedAt,
    ...cleanedData
  } = data;
  return cleanedData;
}

// GET — Fetch company settings (public — needed for invoice)
export async function GET() {
  try {
    let settings = await prisma.companySettings.findFirst();

    // Create default if none exists
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName:   "Arunas Baby World",
          tagline:       "Where Every Little Moment Matters",
          invoicePrefix: "INV",
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Company settings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT — Update company settings (admin only)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const rawData = await request.json();

    // ✅ Remove fields Prisma won't accept in update
    const data = cleanData(rawData);

    let settings = await prisma.companySettings.findFirst();

    if (settings) {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      settings = await prisma.companySettings.create({ data });
    }

    return NextResponse.json({ settings, message: 'Settings updated' });
  } catch (error) {
    console.error('Company settings PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}