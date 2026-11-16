import { NextResponse } from 'next/server';
import { queryCatalog } from '@/lib/catalogQuery';

// Brands available for the current filters/search (brand filter itself ignored),
// de-duplicated across case/spacing variants ("Mee Mee", "mee mee ", "Mee MEe").
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const { idx, docs } = await queryCatalog(searchParams, { ignoreBrand: true });

    const keys = new Set(docs.map((d) => d.brandKey).filter(Boolean));
    const brands = [...keys]
      .map((k) => idx.brandLabels.get(k))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    return NextResponse.json({ brands, total: brands.length });
  } catch (error) {
    console.error('Brands API error:', error);
    return NextResponse.json({ error: 'Failed to load brands' }, { status: 500 });
  }
}
