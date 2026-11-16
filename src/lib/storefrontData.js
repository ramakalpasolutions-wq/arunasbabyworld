/**
 * Read-mostly storefront data (banners, brands, home section settings) shared by
 * server pages and the public API routes, with a short in-memory cache so every
 * page view does not hit the database. Admin writes call `invalidateStorefront()`.
 */
import prisma from '@/lib/prisma';

const TTL_MS = 30 * 1000;
const cache = new Map(); // key -> { at, promise }

function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;
  const promise = loader();
  cache.set(key, { at: Date.now(), promise });
  promise.catch(() => cache.delete(key));
  return promise;
}

export function invalidateStorefront() {
  cache.clear();
}

function isFestivalLive(b, now) {
  const start = b.startDate ? new Date(b.startDate) : null;
  const end = b.endDate ? new Date(b.endDate) : null;
  if (start && start > now) return false;
  if (end && end < now) return false;
  return true;
}

/** Active banners grouped by placement, plus active brands. */
export function getActiveBanners() {
  return cached('banners', async () => {
    const [banners, brands] = await Promise.all([
      prisma.banner.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      prisma.brand.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
    ]);
    const now = new Date();
    const ofType = (t) => banners.filter((b) => b.type === t);
    return {
      banners,
      brands,
      heroBanners: banners.filter((b) => b.type === 'hero' || !b.type),
      categoryBanners: ofType('category'),
      festivalBanners: ofType('festival').filter((b) => isFestivalLive(b, now)),
      budgetBanners: ofType('budget'),
      sunnyBanners: ofType('sunny'),
      promoBanners: ofType('promo'),
      genderBanners: ofType('gender'),
      personalCareBanners: ofType('personal-care'),
      healthCareBanners: ofType('health-care'),
      evBanners: ofType('electric-vehicle'),
      babyFoodBanners: ofType('baby-food'),
      toysBanners: ofType('toys'),
      maternityBanners: ofType('maternity'),
    };
  });
}

/** Home-page section settings keyed by section key. */
export function getSectionSettings() {
  return cached('sections', async () => {
    const settings = await prisma.sectionSetting.findMany({ orderBy: { order: 'asc' } });
    const result = {};
    for (const s of settings) {
      result[s.key] = {
        id: s.id,
        key: s.key,
        title: s.title,
        emoji: s.emoji,
        description: s.description,
        buttonText: s.buttonText,
        isVisible: s.isVisible !== false,
        order: s.order || 0,
      };
    }
    return result;
  });
}
