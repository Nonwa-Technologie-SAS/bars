import { prisma } from '@/infrastructure/database/PrismaClient';
import { NextRequest, NextResponse } from 'next/server';

type Period = 'day' | 'week' | 'month' | 'year' | 'custom';

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isPeriod(value: string): value is Period {
  return (
    value === 'day' ||
    value === 'week' ||
    value === 'month' ||
    value === 'year' ||
    value === 'custom'
  );
}

function getDateRange(
  period: Period,
  from?: string | null,
  to?: string | null,
) {
  const now = new Date();
  if (period === 'day') {
    return { from: startOfDay(now), to: endOfDay(now) };
  }
  if (period === 'week') {
    const weekday = now.getDay(); // 0=Sun ... 6=Sat
    const diffToMonday = (weekday + 6) % 7; // convert to Monday-based
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: startOfDay(monday), to: endOfDay(sunday) };
  }
  if (period === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: startOfDay(first), to: endOfDay(last) };
  }
  if (period === 'year') {
    const first = new Date(now.getFullYear(), 0, 1);
    const last = new Date(now.getFullYear(), 11, 31);
    return { from: startOfDay(first), to: endOfDay(last) };
  }
  if (period === 'custom') {
    const f = parseDate(from) ?? now;
    const t = parseDate(to) ?? now;
    const fromDate = startOfDay(f);
    const toDate = endOfDay(t);
    if (fromDate.getTime() <= toDate.getTime()) {
      return { from: fromDate, to: toDate };
    }
    return { from: startOfDay(t), to: endOfDay(f) };
  }
  return { from: startOfDay(now), to: endOfDay(now) };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  try {
    const { tenantId } = await params;
    const reports = await prisma.report.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        period: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        // We include data here to allow frontend to show summary in list/grid without extra fetch
        // If data is huge, we might optimize, but for now it's fine.
        data: true,
      },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantId: string } },
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();
    const { period: rawPeriod, from: fromParam, to: toParam, userId } = body;

    const period: Period = isPeriod(rawPeriod) ? rawPeriod : 'day';
    const { from, to } = getDateRange(period, fromParam, toParam);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          tenantId,
          status: { in: ['PAID', 'PREPARING', 'READY', 'DELIVERED'] },
          createdAt: {
            gte: from,
            lte: to,
          },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            stockQuantity: true,
            price: true,
          },
        },
      },
    });

    const map = new Map<
      string,
      {
        productId: string;
        name: string;
        category?: string | null;
        unitPrice?: number | null;
        soldQty: number;
        revenue: number;
        stockRemaining: number;
      }
    >();

    let totalRevenue = 0;
    let totalItemsSold = 0;

    for (const item of orderItems) {
      const existing = map.get(item.productId);
      const qty = 1; // Assuming 1 per OrderItem row, or check if OrderItem has quantity field?
      // Checking Schema: OrderItem doesn't have quantity field!
      // It seems OrderItem is one row per item instance?
      // Or I missed it. Let's check Schema again.
      // Schema: OrderItem { id, orderId, productId, unitPrice, createdAt }
      // It does NOT have quantity. So each row is 1 item.

      const revenue = item.unitPrice;

      totalRevenue += revenue;
      totalItemsSold += qty;

      if (existing) {
        existing.soldQty += qty;
        existing.revenue += revenue;
      } else {
        map.set(item.productId, {
          productId: item.productId,
          name: item.product.name,
          category: item.product.category,
          unitPrice: item.product.price,
          soldQty: qty,
          revenue: revenue,
          stockRemaining: item.product.stockQuantity,
        });
      }
    }

    const items = Array.from(map.values());

    const reportData = {
      items,
      totals: {
        totalRevenue,
        totalItemsSold,
        productCount: items.length,
        from,
        to,
        period,
      },
    };

    // Save to DB
    const title = `Rapport ${period} (${from.toLocaleDateString()} - ${to.toLocaleDateString()})`;

    const savedReport = await prisma.report.create({
      data: {
        title,
        period,
        startDate: from,
        endDate: to,
        data: reportData, // Json type
        tenantId,
        creatorId: userId || undefined, // Optional
      },
    });

    return NextResponse.json(savedReport);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
