import { NextResponse } from 'next/server';
import { trackShipment } from '@/lib/nimbuspost';

export async function GET(request, { params }) {
  try {
    const { awb } = await params;

    if (!awb || awb === 'undefined') {
      return NextResponse.json({ error: 'AWB required' }, { status: 400 });
    }

    const tracking = await trackShipment(awb);

    return NextResponse.json({ success: true, tracking });

  } catch (error) {
    console.error('Track shipment error:', error);
    return NextResponse.json(
      { error: error.message || 'Tracking failed' },
      { status: 500 }
    );
  }
}