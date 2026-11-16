/**
 * Catalog search engine (marketplace-style: Amazon / Flipkart / Meesho).
 *
 *  - Word-based matching in any order ("lotion baby" == "baby lotion")
 *  - Singular / plural ("diapers" == "diaper"), compounds ("t shirt" == "tshirt")
 *  - Typo tolerance ("diper" -> diaper, "strollr" -> stroller) with "did you mean"
 *  - Synonyms common in Indian baby retail (pram/stroller, jhula/cradle, frock/dress…)
 *  - Field-weighted relevance (name > brand > category > tags > description)
 *  - No substring noise ("car" no longer matches "care" / "carrier")
 *  - Prefix completion for type-ahead ("baby lot" -> baby lotion)
 *
 * The index holds light fields of every active product and is cached in memory.
 */
import prisma from '@/lib/prisma';

/* ───────────────────────── text normalisation ───────────────────────── */

const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'for', 'with', 'of', 'in', 'on', 'to', 'by', 'from', 'at', 'or', 'is', 'my',
]);

// Multi-word spellings folded into one token (both in products and in queries).
const COMPOUNDS = [
  ['t shirt', 'tshirt'], ['tee shirt', 'tshirt'],
  ['new born', 'newborn'], ['high chair', 'highchair'], ['bath tub', 'bathtub'],
  ['play pen', 'playpen'], ['night suit', 'nightsuit'], ['ride on', 'rideon'],
  ['tooth brush', 'toothbrush'], ['play mat', 'playmat'], ['baby wipe', 'babywipe'],
];
// When a product says "highchair", also index "high" + "chair" so "chair" still finds it.
const DECOMPOUND = {
  tshirt: ['shirt'], highchair: ['high', 'chair'], bathtub: ['bath', 'tub'], playpen: ['play', 'pen'],
  nightsuit: ['night', 'suit'], rideon: ['ride'], toothbrush: ['tooth', 'brush'], playmat: ['play', 'mat'],
  babywipe: ['baby', 'wipe'], newborn: ['newborn'],
};
const COMPOUND_RES = COMPOUNDS.map(([phrase, joined]) => [new RegExp(`\\b${phrase}\\b`, 'g'), joined]);

// Common misspellings / variants canonicalised everywhere.
const ALIASES = {
  brest: 'breast', pajama: 'pyjama', pyjamas: 'pyjama', pajamas: 'pyjama', nappies: 'nappy',
  colour: 'color', jhoola: 'jhula', diapr: 'diaper', tshirts: 'tshirt', teddybear: 'teddy',
};

// Query-side synonyms (applied after stemming). Bidirectional groups…
const SYNONYM_GROUPS = [
  ['diaper', 'nappy'],
  ['stroller', 'pram', 'buggy'],
  ['cradle', 'jhula', 'palna'],
  ['crib', 'cot'],
  ['tshirt', 'tee'],
  ['frock', 'dress', 'gown'],
  ['pyjama', 'nightsuit', 'nightwear'],
  ['soother', 'pacifier', 'dummy'],
  ['scooter', 'scooty'],
  ['potty', 'toilet'],
  ['talc', 'powder'],
  ['romper', 'onesie', 'bodysuit', 'jumpsuit', 'sleepsuit'],
  ['sipper', 'sippy'],
  ['teether', 'teething'],
  ['kid', 'child', 'children'],
  ['bike', 'motorbike'],
];
// …and one-way expansions (query word -> also match these).
const SYNONYM_ONE_WAY = {
  cycle: ['bicycle', 'tricycle'],
  bicycle: ['cycle'],
  feeder: ['bottle'],
  tub: ['bathtub'],
  chair: ['highchair'],
  jeep: ['car'],
};

export function stem(w) {
  if (w.length <= 3 || /\d/.test(w)) return w;
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('sses')) return w.slice(0, -2);
  if (/(xes|ches|shes|zes)$/.test(w)) return w.slice(0, -2);
  if (/(ss|us|is)$/.test(w)) return w;
  if (w.endsWith('s')) return w.slice(0, -1);
  return w;
}

const canon = (w) => stem(ALIASES[w] || w);

/** Lower-case, strip accents/punctuation, split "100ml" -> "100 ml", fold compounds. */
export function normalizeText(s, { compounds = true } = {}) {
  let t = String(s || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (compounds) for (const [re, joined] of COMPOUND_RES) t = t.replace(re, joined);
  return t;
}

/** Tokens for indexing a product field (stemmed, no stopwords, compounds expanded). */
function indexTokens(text) {
  const out = new Set();
  for (const raw of normalizeText(text).split(' ')) {
    if (!raw || STOPWORDS.has(raw)) continue;
    const c = canon(raw);
    out.add(c);
    for (const part of DECOMPOUND[c] || []) out.add(part);
  }
  return out;
}

/** Query tokens: [{ raw, stem }] — stopwords dropped unless the query is only stopwords. */
export function queryTokens(q) {
  const words = normalizeText(q).split(' ').filter(Boolean);
  let kept = words.filter((w) => !STOPWORDS.has(w));
  if (kept.length === 0) kept = words;
  return kept.slice(0, 8).map((raw) => ({ raw, stem: canon(raw) }));
}

const SYNONYMS = (() => {
  const map = new Map();
  const add = (a, b) => {
    const ka = canon(a), kb = canon(b);
    if (ka === kb) return;
    if (!map.has(ka)) map.set(ka, new Set());
    map.get(ka).add(kb);
  };
  for (const g of SYNONYM_GROUPS) for (const a of g) for (const b of g) add(a, b);
  for (const [a, list] of Object.entries(SYNONYM_ONE_WAY)) for (const b of list) add(a, b);
  return map;
})();

/** Optimal-string-alignment distance (Levenshtein + transpositions), capped. */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length, n = b.length;
  let prev2 = null;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[n];
}

const maxTypos = (len) => (len >= 8 ? 2 : len >= 4 ? 1 : 0);

/* ───────────────────────────── the index ───────────────────────────── */

const FIELD_WEIGHTS = { name: 10, brand: 8, category: 7, tags: 5, gender: 4, attrs: 3, short: 3, desc: 1 };
const FIELDS = Object.keys(FIELD_WEIGHTS);

export const brandKey = (b) => String(b || '').trim().replace(/\s+/g, ' ').toLowerCase();

const TTL_MS = 60 * 1000;
let cache = { builtAt: 0, promise: null };

export function invalidateSearchIndex() {
  cache = { builtAt: 0, promise: null };
}

/** Use the stored gender; when empty, infer it from the title ("Girls Dress" -> girl). */
function inferGender(gender, name) {
  const g = String(gender || '').trim().toLowerCase();
  if (g) return g;
  const girl = /\bgirls?\b/i.test(name || '');
  const boy = /\bboys?\b/i.test(name || '');
  if (girl && !boy) return 'girl';
  if (boy && !girl) return 'boy';
  return '';
}

async function buildIndex() {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, slug: true, brand: true, tags: true, gender: true, color: true,
      material: true, ageGroup: true, shortDescription: true, description: true,
      price: true, discountPrice: true, discountPercent: true, stock: true, rating: true,
      numReviews: true, isFeatured: true, isTrending: true, createdAt: true, categoryId: true,
      images: true, colorVariants: { select: { colorName: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  const vocab = new Map(); // token -> document frequency (all fields)
  const strong = new Map(); // token -> document frequency (all fields except description)
  const brandDisplay = new Map(); // brandKey -> { label -> count }

  const docs = rows.map((p) => {
    const fields = {
      name: indexTokens(p.name),
      brand: indexTokens(p.brand),
      category: indexTokens(`${p.category?.name || ''} ${(p.category?.slug || '').replace(/-/g, ' ')}`),
      tags: indexTokens((p.tags || []).join(' ')),
      gender: indexTokens(p.gender),
      attrs: indexTokens([p.color, p.material, p.ageGroup, ...(p.colorVariants || []).map((v) => v.colorName)].filter(Boolean).join(' ')),
      short: indexTokens(p.shortDescription),
      desc: indexTokens(String(p.description || '').slice(0, 2000)),
    };
    const all = new Set();
    for (const f of FIELDS) for (const t of fields[f]) all.add(t);
    for (const t of all) vocab.set(t, (vocab.get(t) || 0) + 1);
    const strongSet = new Set();
    for (const f of FIELDS) if (f !== 'desc') for (const t of fields[f]) strongSet.add(t);
    for (const t of strongSet) strong.set(t, (strong.get(t) || 0) + 1);

    const bk = brandKey(p.brand);
    if (bk) {
      const label = String(p.brand).trim().replace(/\s+/g, ' ');
      if (!brandDisplay.has(bk)) brandDisplay.set(bk, new Map());
      const m = brandDisplay.get(bk);
      m.set(label, (m.get(label) || 0) + 1);
    }

    const effPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand ? String(p.brand).trim() : null,
      brandKey: bk,
      gender: inferGender(p.gender, p.name),
      categoryId: p.categoryId,
      category: p.category,
      price: p.price,
      discountPrice: p.discountPrice,
      effPrice,
      discountPercent: p.discountPercent || 0,
      stock: p.stock || 0,
      rating: p.rating || 0,
      numReviews: p.numReviews || 0,
      isFeatured: !!p.isFeatured,
      isTrending: !!p.isTrending,
      createdAt: new Date(p.createdAt).getTime(),
      image: p.images?.[0]?.url || null,
      nameNorm: ` ${normalizeText(p.name)} `,
      nameWords: normalizeText(p.name).split(' ').filter(Boolean),
      displayWords: normalizeText(p.name, { compounds: false }).split(' ').filter(Boolean),
      fields,
    };
  });

  // Most common spelling of each brand, for display ("Mee Mee", not "mee mee ").
  const brandLabels = new Map();
  for (const [k, m] of brandDisplay) {
    brandLabels.set(k, [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]);
  }

  return { docs, vocab, strong, strongList: [...strong.keys()], brandLabels, builtAt: Date.now() };
}

export async function getSearchIndex() {
  const fresh = cache.promise && Date.now() - cache.builtAt < TTL_MS;
  if (!fresh) {
    const promise = buildIndex();
    cache = { builtAt: Date.now(), promise };
    promise.catch(() => { if (cache.promise === promise) invalidateSearchIndex(); });
  }
  return cache.promise;
}

/* ───────────────────────────── matching ───────────────────────────── */

/**
 * Which index tokens a query token may match, with a quality in (0,1].
 * Returns { matches: Map<token, quality>, corrected: string|null }
 */
function expandToken(idx, tok, { prefix, minPrefix }) {
  const matches = new Map();
  const { raw, stem: s } = tok;
  const exactDf = idx.strong.get(s) || 0; // how often the word appears in titles/brands/categories

  if (idx.vocab.has(s)) matches.set(s, 1);
  for (const syn of SYNONYMS.get(s) || []) {
    if (idx.vocab.has(syn) && !matches.has(syn)) matches.set(syn, 0.9);
  }

  // Prefix completion ("lot" -> lotion). Also used for partially typed words.
  const usePrefix = prefix && raw.length >= minPrefix && !/^\d+$/.test(raw);
  let prefixFound = 0;
  if (usePrefix) {
    const found = [];
    for (const v of idx.strongList) {
      if (v !== s && (v.startsWith(raw) || v.startsWith(s)) && !matches.has(v)) found.push(v);
    }
    found.sort((a, b) => (idx.strong.get(b) || 0) - (idx.strong.get(a) || 0));
    for (const v of found.slice(0, 40)) matches.set(v, 0.55 + 0.3 * Math.min(1, raw.length / v.length));
    prefixFound = found.length;
  }

  // Typo tolerance — only when the word is unknown / very rare and does not complete to anything.
  let corrected = null;
  const typos = maxTypos(s.length);
  if (typos > 0 && exactDf < 3 && !prefixFound && !/^\d+$/.test(s)) {
    let best = typos + 1;
    let cands = [];
    for (const v of idx.strongList) {
      if (v === s || Math.abs(v.length - s.length) > typos || (v[0] !== s[0] && typos < 2)) continue;
      const d = editDistance(s, v, typos);
      if (d < best) { best = d; cands = [v]; } else if (d === best) cands.push(v);
    }
    if (best <= typos) {
      cands.sort((a, b) => (idx.strong.get(b) || 0) - (idx.strong.get(a) || 0));
      for (const v of cands.slice(0, 5)) if (!matches.has(v)) matches.set(v, 0.8 - 0.1 * (best - 1));
      if (!exactDf) corrected = cands[0];
    }
  }

  return { matches, corrected };
}

/** Index of the first place the query words appear consecutively in the title, or -1. */
function findPhrase(nameWords, tokens) {
  const stems = nameWords.map(canon);
  const n = tokens.length;
  for (let i = 0; i + n <= stems.length; i++) {
    let ok = true;
    for (let j = 0; j < n && ok; j++) ok = stems[i + j] === tokens[j].stem;
    if (ok) return i;
  }
  return -1;
}

/** Per query token: best weighted field match (0 when the token is not found). */
function scoreDoc(doc, expansions) {
  const perToken = [];
  for (const { matches } of expansions) {
    let best = 0;
    let bestField = null;
    let extra = 0; // the same word also in category / tags / brand => more on-topic
    for (const f of FIELDS) {
      const set = doc.fields[f];
      if (!set.size) continue;
      let fieldBest = 0;
      for (const [tok, q] of matches) {
        // Description is long and noisy: only exact / synonym hits count there.
        if (f === 'desc' && q < 0.9) continue;
        if (set.has(tok)) fieldBest = Math.max(fieldBest, FIELD_WEIGHTS[f] * q);
      }
      if (!fieldBest) continue;
      if (fieldBest > best) {
        if (best && bestField !== 'desc') extra += best;
        best = fieldBest; bestField = f;
      } else if (f !== 'desc') {
        extra += fieldBest;
      }
    }
    if (best && bestField === 'name') {
      // Words near the start of a title describe the product ("Baby Cap…" vs "…bottle with cap")
      const pos = doc.nameWords.findIndex((w) => matches.has(canon(w)) || matches.has(w));
      if (pos >= 0) best *= 1 + 0.25 * Math.max(0, 1 - pos / 8);
    }
    perToken.push({ best: best ? best + 0.25 * extra : 0, bestField });
  }
  return perToken;
}

/**
 * Rank docs for a query.
 * mode 'full'    -> results page (strict, with progressive relaxation)
 * mode 'suggest' -> type-ahead (last word is treated as a prefix)
 *
 * Returns { ranked: [{doc, score}], correctedQuery, relaxed, tokens }
 */
export function rankDocs(idx, docs, query, { mode = 'full' } = {}) {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return { ranked: [], correctedQuery: null, relaxed: false, tokens };

  const queryNorm = tokens.map((t) => t.raw).join(' ');
  const attempts = mode === 'suggest'
    ? [{ prefixLast: 1, prefixAll: 0, partial: false }, { prefixLast: 1, prefixAll: 3, partial: true }]
    : [
        { prefixLast: 0, prefixAll: 0, partial: false },
        { prefixLast: 3, prefixAll: 3, partial: false },
        { prefixLast: 3, prefixAll: 3, partial: true },
      ];

  for (const att of attempts) {
    const expansions = tokens.map((t, i) => {
      const isLast = i === tokens.length - 1;
      const minPrefix = isLast && att.prefixLast ? att.prefixLast : att.prefixAll;
      // In strict full mode, still complete a word that is rare/unknown (e.g. "walk" -> walker).
      const rareWord = (idx.strong.get(t.stem) || 0) < 5 && t.raw.length >= 4;
      return expandToken(idx, t, { prefix: minPrefix > 0 || rareWord, minPrefix: minPrefix || 4 });
    });

    const need = att.partial ? Math.max(1, Math.ceil(tokens.length / 2)) : tokens.length;
    const hits = [];
    const tokenDocCount = new Array(tokens.length).fill(0);

    for (const doc of docs) {
      const per = scoreDoc(doc, expansions);
      const matched = per.filter((p) => p.best > 0).length;
      if (matched < need) continue;
      per.forEach((p, i) => { if (p.best > 0) tokenDocCount[i]++; });
      hits.push({ doc, per, matched });
    }
    if (hits.length === 0) continue;

    const N = Math.max(docs.length, 1);
    const idf = tokenDocCount.map((c) => 1 + Math.log(N / (1 + c)));

    let ranked = hits.map(({ doc, per, matched }) => {
      let score = per.reduce((sum, p, i) => sum + p.best * idf[i], 0);
      if (per.every((p) => p.bestField === 'name')) score *= 1.2;
      const phrasePos = tokens.length > 1 ? findPhrase(doc.nameWords, tokens) : -1;
      if (phrasePos >= 0) score *= 1.15 + 0.25 * Math.max(0, 1 - phrasePos / 8);
      else if (tokens.length > 1 && doc.nameNorm.includes(` ${queryNorm} `)) score *= 1.15;
      else if (doc.nameWords[0] && canon(doc.nameWords[0]) === tokens[0].stem) score *= 1.05;
      if (att.partial) score *= matched / tokens.length;
      if (doc.isFeatured) score *= 1.03;
      if (doc.rating >= 4) score *= 1.02;
      return { doc, score };
    });

    ranked.sort((a, b) => b.score - a.score);

    // Drop weak tail hits (e.g. a word only mentioned deep in a description)
    // when there are plenty of strong matches.
    const top = ranked[0].score;
    const strong = ranked.filter((r) => r.score >= top * 0.2);
    if (strong.length >= 6) ranked = strong;

    const corrections = expansions.map((e) => e.corrected);
    const correctedQuery = corrections.some(Boolean)
      ? tokens.map((t, i) => corrections[i] || t.raw).join(' ')
      : null;

    return { ranked, correctedQuery, relaxed: att.partial, tokens, expansions };
  }

  return { ranked: [], correctedQuery: null, relaxed: false, tokens };
}

/* ─────────────────────────── type-ahead ─────────────────────────── */

// Words that make poor auto-complete extensions ("baby lotion up", "lotion ph").
const WEAK_NEXT = new Set(['up', 'ph', 'one', 'all', 'new', 'size', 'pack', 'count', 'piece', 'pcs', 'pc', 'ml', 'kg', 'gm', 'suitable', 'free', 'premium', 'super', 'ultra']);

/**
 * Keyword completions built from the titles of the best-matching products.
 * A suggestion is a real phrase from titles: the typed words in order, followed by
 * a completion of the last (partial) word and optionally one more word.
 */
export function buildSuggestions(idx, result, rawQuery, limit = 6) {
  const { ranked, tokens, correctedQuery } = result;
  if (!tokens?.length) return [];

  // Work on the words as typed (keeping "for", "with"…), with typo corrections applied.
  const fix = new Map();
  if (correctedQuery) {
    const fixed = correctedQuery.split(' ');
    tokens.forEach((t, i) => { if (fixed[i] && fixed[i] !== t.raw) fix.set(t.raw, fixed[i]); });
  }
  const typed = normalizeText(rawQuery, { compounds: false }).split(' ').filter(Boolean).map((w) => fix.get(w) || w);
  if (!typed.length) return [];
  const leadDisplay = typed.slice(0, -1);
  const leadStems = leadDisplay.map(canon);
  const lastTyped = typed[typed.length - 1];
  const lastIsStop = STOPWORDS.has(lastTyped);
  const lastMatches = lastIsStop ? new Map() : (result.expansions?.[tokens.length - 1]?.matches || new Map());
  const completes = (w) => w.length >= 2 && (w.startsWith(lastTyped) || lastMatches.has(canon(w)));
  const typedKey = typed.map(canon).join(' ');

  // key (stems) -> { labels: Map(label -> weight), docs: Set, weight, words }
  const groups = new Map();
  const add = (words, docId, w) => {
    const key = words.map(canon).join(' ');
    if (key === typedKey && (lastIsStop || lastTyped.length < 2)) return;
    const label = words.join(' ');
    let g = groups.get(key);
    if (!g) { g = { labels: new Map(), docs: new Set(), weight: 0, words: words.length }; groups.set(key, g); }
    g.labels.set(label, (g.labels.get(label) || 0) + w);
    g.docs.add(docId);
    g.weight += w;
  };
  const goodNext = (next, cur) => next && next.length >= 3 && !STOPWORDS.has(next) && !WEAK_NEXT.has(next) &&
    !/\d/.test(next) && canon(next) !== canon(cur) && !leadStems.includes(canon(next));

  const loose = [];
  ranked.slice(0, 60).forEach(({ doc }, rank) => {
    const words = doc.displayWords;
    const stems = words.map(canon);
    const w = 1 / (1 + rank * 0.1);
    let found = false;
    for (let i = leadStems.length; i < words.length; i++) {
      if (!leadStems.every((st, k) => stems[i - leadStems.length + k] === st)) continue;
      if (!completes(words[i])) continue;
      const base = [...leadDisplay, words[i]];
      add(base, doc.id, w * 1.5);
      if (goodNext(words[i + 1], words[i])) add([...base, words[i + 1]], doc.id, lastIsStop ? w * 2 : w);
      found = true;
      break;
    }
    if (!found && leadStems.length && !lastIsStop) {
      const i = words.findIndex(completes);
      if (i >= 0) loose.push([[...leadDisplay, words[i]], doc.id, w * 0.4]);
    }
  });
  // Words not adjacent in titles: only offer these when there are few real phrases
  if (groups.size < 3) for (const args of loose) add(...args);

  // Brands matching what was typed
  const qn = normalizeText(rawQuery, { compounds: false });
  if (qn.length >= 2) {
    for (const [k, label] of idx.brandLabels) {
      const bn = normalizeText(k, { compounds: false });
      if (bn.startsWith(qn) && bn !== qn) add(bn.split(' '), `brand:${k}`, 4);
    }
  }

  return [...groups.values()]
    // longer phrases must be backed by at least two products
    .filter((g) => g.words <= typed.length || g.docs.size >= 2)
    .sort((a, b) => b.weight - a.weight || a.words - b.words)
    .slice(0, limit)
    .map((g) => [...g.labels.entries()].sort((a, b) => b[1] - a[1])[0][0]);
}
