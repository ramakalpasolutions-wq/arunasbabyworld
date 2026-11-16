import { NextResponse } from 'next/server';
import { getSearchIndex, rankDocs, buildSuggestions } from '@/lib/search';

// Type-ahead for the header search box:
//   keyword completions, matching categories, and top products.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().slice(0, 100);
    if (q.length < 2) {
      return NextResponse.json({ query: q, suggestions: [], categories: [], products: [], total: 0 });
    }

    const idx = await getSearchIndex();
    const result = rankDocs(idx, idx.docs, q, { mode: 'suggest' });

    // In-stock first, then relevance
    const ranked = [
      ...result.ranked.filter((r) => r.doc.stock > 0),
      ...result.ranked.filter((r) => r.doc.stock <= 0),
    ];

    const suggestions = buildSuggestions(idx, result, q, 6);

    // Categories the matching products belong to (by weight of strong matches)
    const catCount = new Map();
    for (const { doc } of result.ranked.slice(0, 200)) {
      if (!doc.category) continue;
      const c = catCount.get(doc.category.id) || { ...doc.category, count: 0 };
      c.count++;
      catCount.set(doc.category.id, c);
    }
    const categories = [...catCount.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(({ name, slug, count }) => ({ name, slug, count }));

    const products = ranked.slice(0, 6).map(({ doc }) => ({
      id: doc.id,
      slug: doc.slug,
      name: doc.name,
      brand: doc.brand,
      image: doc.image,
      price: doc.price,
      discountPrice: doc.discountPrice,
      stock: doc.stock,
      category: doc.category?.name || null,
    }));

    return NextResponse.json(
      {
        query: q,
        correctedQuery: result.correctedQuery,
        suggestions,
        categories,
        products,
        total: result.ranked.length,
      },
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } },
    );
  } catch (error) {
    console.error('Search suggest error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
