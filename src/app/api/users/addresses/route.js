import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// Helper to sanitize database output address formats
function formatAddresses(addresses) {
  return (addresses || []).map(a => ({
    name: a.name || '',
    phone: a.phone || '',
    address: a.address || '',
    city: a.city || '',
    state: a.state || '',
    pincode: a.pincode || '',
    isDefault: a.isDefault ?? false,
  }));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { addresses: true },
    });

    return NextResponse.json({ addresses: formatAddresses(user?.addresses) });
  } catch (error) {
    console.error('GET addresses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, address, city, state, pincode, isDefault } = body;

    if (!name || !phone || !address || !city || !state || !pincode) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { addresses: true },
    });

    let currentAddresses = formatAddresses(user?.addresses);

    // If marked default or if it is the very first address, demote other defaults
    const shouldBeDefault = isDefault || currentAddresses.length === 0;

    if (shouldBeDefault) {
      currentAddresses = currentAddresses.map(a => ({ ...a, isDefault: false }));
    }

    currentAddresses.push({
      name,
      phone,
      address,
      city,
      state,
      pincode,
      isDefault: shouldBeDefault,
    });

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { addresses: currentAddresses },
      select: { addresses: true },
    });

    return NextResponse.json({ addresses: formatAddresses(updatedUser.addresses) });
  } catch (error) {
    console.error('POST address error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const index = parseInt(searchParams.get('index'));
    const action = searchParams.get('action'); // e.g., 'setDefault'

    if (isNaN(index)) {
      return NextResponse.json({ error: 'Invalid index specified' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { addresses: true },
    });

    let currentAddresses = formatAddresses(user?.addresses);

    if (index < 0 || index >= currentAddresses.length) {
      return NextResponse.json({ error: 'Address index out of bounds' }, { status: 404 });
    }

    if (action === 'setDefault') {
      currentAddresses = currentAddresses.map((addr, i) => ({
        ...addr,
        isDefault: i === index,
      }));
    } else {
      const body = await request.json();
      const { name, phone, address, city, state, pincode, isDefault } = body;

      const shouldBeDefault = isDefault || currentAddresses.length === 1;

      if (shouldBeDefault) {
        currentAddresses = currentAddresses.map(a => ({ ...a, isDefault: false }));
      }

      currentAddresses[index] = {
        name: name || currentAddresses[index].name,
        phone: phone || currentAddresses[index].phone,
        address: address || currentAddresses[index].address,
        city: city || currentAddresses[index].city,
        state: state || currentAddresses[index].state,
        pincode: pincode || currentAddresses[index].pincode,
        isDefault: shouldBeDefault,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { addresses: currentAddresses },
      select: { addresses: true },
    });

    return NextResponse.json({ addresses: formatAddresses(updatedUser.addresses) });
  } catch (error) {
    console.error('PUT address error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const index = parseInt(searchParams.get('index'));

    if (isNaN(index)) {
      return NextResponse.json({ error: 'Invalid index specified' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { addresses: true },
    });

    let currentAddresses = formatAddresses(user?.addresses);

    if (index < 0 || index >= currentAddresses.length) {
      return NextResponse.json({ error: 'Address index out of bounds' }, { status: 404 });
    }

    const removedWasDefault = currentAddresses[index].isDefault;
    currentAddresses = currentAddresses.filter((_, i) => i !== index);

    // If we deleted the default address, promote the next available address as default
    if (removedWasDefault && currentAddresses.length > 0) {
      currentAddresses[0].isDefault = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { addresses: currentAddresses },
      select: { addresses: true },
    });

    return NextResponse.json({ addresses: formatAddresses(updatedUser.addresses) });
  } catch (error) {
    console.error('DELETE address error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}