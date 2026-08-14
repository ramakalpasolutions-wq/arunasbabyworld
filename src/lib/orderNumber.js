import prisma from '@/lib/prisma';

export async function getNextOrderNumber() {
  const counter = await prisma.counter.upsert({
    where:  { name: 'orderNumber' },
    update: { value: { increment: 1 } },
    create: { name: 'orderNumber', value: 40001 },
  });
  return counter.value;
}

export function formatOrderNumber(num) {
  if (!num) return null;
  return `ABW-${num}`;
}