/**
 * Stock reservation for orders.
 *
 * Stock is taken when an order is placed (COD or online), returned when it is
 * cancelled or its payment fails, and taken again on payment retry. The order's
 * `stockDeducted` flag records whether its items currently hold stock, so stock
 * is never returned twice or returned for orders that never took any
 * (orders placed before this existed have no flag and are left alone).
 */
import prisma from '@/lib/prisma';

const qtyOf = (item) => Math.max(1, Number(item.quantity) || 1);

/**
 * Atomically take stock for each item; all-or-nothing.
 * Returns { ok: true } or { ok: false, outOfStock: [{ productId, name, available }] }.
 */
export async function reserveStock(items) {
  const taken = [];
  const outOfStock = [];

  for (const item of items) {
    if (!item.productId) continue;
    const qty = qtyOf(item);
    // Conditional update: only succeeds when enough stock is left (race-safe).
    const res = await prisma.product.updateMany({
      where: { id: item.productId, stock: { gte: qty } },
      data: { stock: { decrement: qty } },
    });
    if (res.count === 1) {
      taken.push({ productId: item.productId, qty });
    } else {
      const p = await prisma.product.findUnique({ where: { id: item.productId }, select: { stock: true, name: true } });
      outOfStock.push({ productId: item.productId, name: p?.name || item.name || 'Item', available: Math.max(0, p?.stock || 0) });
    }
  }

  if (outOfStock.length) {
    await releaseItems(taken.map((t) => ({ productId: t.productId, quantity: t.qty })));
    return { ok: false, outOfStock };
  }
  return { ok: true };
}

async function releaseItems(items) {
  await Promise.allSettled(
    items.filter((i) => i.productId).map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: qtyOf(item) } },
      }).catch((err) => console.error(`Stock restore failed for ${item.productId}:`, err)),
    ),
  );
}

/**
 * Return an order's stock if (and only if) it currently holds stock.
 * The flag is cleared first with a conditional update so concurrent calls
 * cannot both return the stock.
 */
export async function releaseOrderStock(order) {
  if (!order || order.stockDeducted !== true) return false;
  const res = await prisma.order.updateMany({
    where: { id: order.id, stockDeducted: true },
    data: { stockDeducted: false },
  });
  if (res.count !== 1) return false;
  await releaseItems(order.orderItems || []);
  return true;
}

/** Take stock again for an order that released it (e.g. payment retry). */
export async function reserveOrderStock(order) {
  if (!order || order.stockDeducted === true) return { ok: true };
  if (order.stockDeducted !== false) return { ok: true }; // legacy order: never tracked
  const result = await reserveStock(order.orderItems || []);
  if (result.ok) {
    await prisma.order.update({ where: { id: order.id }, data: { stockDeducted: true } });
  }
  return result;
}

export function outOfStockMessage(outOfStock) {
  const parts = outOfStock.map((o) =>
    o.available > 0 ? `${o.name} (only ${o.available} left)` : `${o.name} (out of stock)`,
  );
  return `Not enough stock for: ${parts.join(', ')}. Please update your cart.`;
}
