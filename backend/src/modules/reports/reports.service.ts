import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** YYYY-MM-DD → ngày UTC 00:00. */
  private d(ymd: string): Date {
    return new Date(ymd.trim() + 'T00:00:00.000Z');
  }

  private rangeIncl(ymdFrom: string, ymdTo: string) {
    return { gte: this.d(ymdFrom), lte: this.d(ymdTo) } as const;
  }

  /** Từ–đến theo múi giờ VN. */
  getTodayVnYmd() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  }

  /** Mặc định: cả tháng hiện tại (VN). */
  getDefaultFilterRangeVn() {
    const ymd = this.getTodayVnYmd();
    const { mStart, mEnd } = this.firstAndLastOfMonth(ymd);
    return { from: mStart, to: mEnd };
  }

  private firstAndLastOfMonth(ymdToday: string) {
    const [Y, M] = ymdToday.split('-').map(Number) as [number, number, number?];
    const mStart = `${Y}-${String(M).padStart(2, '0')}-01`;
    const last = new Date(Y, M, 0).getDate();
    const mEnd = `${Y}-${String(M).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
    return { mStart, mEnd, Y, M };
  }

  private async posAgg(ymdFrom: string, ymdTo: string) {
    const { gte, lte } = this.rangeIncl(ymdFrom, ymdTo);
    return this.prisma.order.aggregate({
      where: {
        type: 'POS',
        status: 'COMPLETED',
        orderDate: { gte, lte },
      },
      _sum: {
        amountDue: true,
        amountReceived: true,
        orderBalance: true,
      },
      _count: { _all: true },
    });
  }

  private async countDistinctTodayOrders() {
    const t = this.getTodayVnYmd();
    const day = this.d(t);
    return this.prisma.order
      .groupBy({
        by: ['customerId'],
        where: { type: 'POS', status: 'COMPLETED', orderDate: day },
      })
      .then((r) => r.length);
  }

  private async countDistinctInMonth(ymdFrom: string, ymdTo: string) {
    const { gte, lte } = this.rangeIncl(ymdFrom, ymdTo);
    return this.prisma.order
      .groupBy({
        by: ['customerId'],
        where: { type: 'POS', status: 'COMPLETED', orderDate: { gte, lte } },
      })
      .then((r) => r.length);
  }

  private async newVsReturning(ymdFrom: string, ymdTo: string) {
    const f = this.d(ymdFrom);
    const t = this.d(ymdTo);
    const inRange = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        type: 'POS',
        status: 'COMPLETED',
        orderDate: { gte: f, lte: t },
      },
    });
    if (inRange.length === 0) {
      return { total: 0, new: 0, returning: 0 };
    }
    const ids = inRange.map((r) => r.customerId);
    const firstQ = await this.prisma.$queryRaw<{ id: string; m: Date }[]>(Prisma.sql`
      SELECT o."customerId" AS "id", MIN(o."orderDate") AS m
      FROM "Order" o
      WHERE o."type" = 'POS' AND o."status" = 'COMPLETED'
        AND o."customerId" IN (${Prisma.join(ids)})
      GROUP BY o."customerId"
    `);
    const fromStr = ymdFrom;
    const toStr = ymdTo;
    let newC = 0;
    let ret = 0;
    for (const row of firstQ) {
      const mYmd = new Date(row.m).toISOString().slice(0, 10);
      if (mYmd >= fromStr && mYmd <= toStr) {
        newC += 1;
      } else if (mYmd < fromStr) {
        ret += 1;
      }
    }
    return { total: inRange.length, new: newC, returning: ret };
  }

  async getDashboard(p: { from: string; to: string }) {
    const ymdToday = this.getTodayVnYmd();
    const { mStart, mEnd, Y, M } = this.firstAndLastOfMonth(ymdToday);
    const monthKey = `${Y}-${String(M).padStart(2, '0')}`;

    const { gte: fG, lte: fL } = this.rangeIncl(p.from, p.to);
    const aggF = await this.posAgg(p.from, p.to);
    const aggM = await this.posAgg(mStart, mEnd);

    const chRows = await this.prisma.order.groupBy({
      by: ['salesChannelId'],
      where: {
        type: 'POS',
        status: 'COMPLETED',
        orderDate: { gte: fG, lte: fL },
      },
      _sum: { amountDue: true },
      _count: { _all: true },
    });
    const chIds = chRows.map((r) => r.salesChannelId).filter((x): x is string => x != null);
    const chNames = await this.prisma.salesChannel.findMany({
      where: { id: { in: chIds } },
      select: { id: true, name: true },
    });
    const chMap = new Map(chNames.map((c) => [c.id, c.name] as const));
    const byChannel = chRows.map((r) => ({
      salesChannelId: r.salesChannelId,
      name: r.salesChannelId
        ? (chMap.get(r.salesChannelId) ?? 'Kênh')
        : 'Không gắn kênh',
      revenue: r._sum.amountDue ?? 0,
      orderCount: r._count._all,
    }));

    const topRaw = await this.prisma.$queryRaw<{ name: string; phone: string; t: bigint }[]>(
      Prisma.sql`
        SELECT c."name" AS "name", c."phone" AS "phone", COALESCE(SUM(o."amountDue"),0)::bigint AS t
        FROM "Customer" c
        JOIN "Order" o ON o."customerId" = c.id
        WHERE o."type" = 'POS' AND o."status" = 'COMPLETED'
          AND o."orderDate" >= ${fG}::date AND o."orderDate" <= ${fL}::date
        GROUP BY c.id
        ORDER BY t DESC
        LIMIT 5`,
    );
    const topVip = topRaw.map((r) => ({
      name: r.name,
      phone: r.phone,
      totalSpent: Number(r.t),
    }));

    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          type: 'POS',
          status: 'COMPLETED',
          orderDate: { gte: fG, lte: fL },
        },
      },
      include: { service: { include: { category: true } } },
    });
    const catMap = new Map<string, { name: string; revenue: number }>();
    for (const it of items) {
      const cat = it.service.category;
      const prev = catMap.get(cat.id)?.revenue ?? 0;
      catMap.set(cat.id, { name: cat.name, revenue: prev + it.lineTotal });
    }
    const byServiceCategory = Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue);

    const ordersInMonth = await this.prisma.order.findMany({
      where: {
        type: 'POS',
        status: 'COMPLETED',
        orderDate: { gte: this.d(mStart), lte: this.d(mEnd) },
      },
      select: { orderDate: true, amountDue: true },
    });
    const daysInMonth = new Date(Y, M, 0).getDate();
    const byDay: { day: string; ymd: string; amountDue: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = `${Y}-${String(M).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      byDay.push({ day: `${d}/${M}`, ymd, amountDue: 0 });
    }
    for (const o of ordersInMonth) {
      const ymd = o.orderDate.toISOString().slice(0, 10);
      const b = byDay.find((x) => x.ymd === ymd);
      if (b) {
        b.amountDue += o.amountDue;
      }
    }

    const cToday = await this.countDistinctTodayOrders();
    const cMon = await this.countDistinctInMonth(mStart, mEnd);
    const cFilter = await this.newVsReturning(p.from, p.to);

    return {
      filter: { from: p.from, to: p.to },
      thisMonth: { from: mStart, to: mEnd, key: monthKey },
      cards: {
        doanhThuThangNay: aggM._sum.amountDue ?? 0,
        thucThuTrenDonThang: aggM._sum.amountReceived ?? 0,
        congNoDonThang: aggM._sum.orderBalance ?? 0,
        doanhThuLoc: aggF._sum.amountDue ?? 0,
        thucThuTrenDonLoc: aggF._sum.amountReceived ?? 0,
        congNoTrenDonLoc: aggF._sum.orderBalance ?? 0,
      },
      customers: {
        today: cToday,
        thisMonth: cMon,
        inFilter: cFilter,
      },
      chart: {
        dailyInCurrentMonth: byDay.map(({ day, amountDue, ymd }) => ({ day, ymd, amountDue })),
      },
      byChannel: byChannel.sort((a, b) => b.revenue - a.revenue),
      customerVisitsByChannel: byChannel.map((r) => ({
        name: r.name,
        visits: r.orderCount,
      })),
      byServiceCategory,
      topVip,
    };
  }

  /**
   * Nhật ký giao dịch: đơn POS + thu nợ (dòng “THU NỢ KHÁCH HÀNG”). Tổng cuối chỉ cộng đơn bán hàng.
   */
  async getTransactionLedger(p: { from: string; to: string }) {
    const { gte, lte } = this.rangeIncl(p.from, p.to);
    const ltExcl = new Date(this.d(p.to));
    ltExcl.setUTCDate(ltExcl.getUTCDate() + 1);
    const gteP = this.d(p.from);

    const orders = await this.prisma.order.findMany({
      where: { type: 'POS', status: 'COMPLETED', orderDate: { gte, lte } },
      include: {
        customer: true,
        items: { include: { service: { include: { category: true } } } },
      },
      orderBy: { orderDate: 'desc' },
    });

    const debtPayments = await this.prisma.debtPayment.findMany({
      where: { performedAt: { gte: gteP, lt: ltExcl } },
      include: { customer: true },
      orderBy: { performedAt: 'desc' },
    });

    const posRows = orders.map((o) => {
      const cats = new Set<string>();
      for (const it of o.items) {
        cats.add(it.service.category.name);
      }
      return {
        kind: 'POS' as const,
        id: o.id,
        date: o.orderDate.toISOString().slice(0, 10),
        orderCode: o.orderCode,
        customerName: o.customer.name,
        customerPhone: o.customer.phone,
        phanLoai: Array.from(cats).join(', '),
        doanhThu: o.amountDue,
        thucThu: o.amountReceived,
        conNo: o.orderBalance,
      };
    });
    const debtRows = debtPayments.map((d) => ({
      kind: 'DEBT' as const,
      id: d.id,
      date: d.performedAt.toISOString().slice(0, 10),
      orderCode: null as string | null,
      customerName: d.customer.name,
      customerPhone: d.customer.phone,
      phanLoai: 'THU NỢ KHÁCH HÀNG',
      doanhThu: 0,
      thucThu: d.amount,
      conNo: null as number | null,
    }));
    const rows = [...posRows, ...debtRows].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      if (a.kind !== b.kind) {
        return a.kind === 'POS' ? -1 : 1;
      }
      return 0;
    });
    const summary = posRows.reduce(
      (s, r) => {
        s.doanhThu += r.doanhThu;
        s.thucThu += r.thucThu;
        s.conNo += r.conNo;
        return s;
      },
      { doanhThu: 0, thucThu: 0, conNo: 0 },
    );
    return { from: p.from, to: p.to, rows, summary };
  }

  /**
   * Bảng công nợ: tổng trên đơn đến ngày lọc.
   */
  async getDebtLedger(asOf: string) {
    const dEnd = this.d(asOf);
    const customers = await this.prisma.customer.findMany({
      where: { totalDebt: { gt: 0 } },
      orderBy: { totalDebt: 'desc' },
    });
    const rows: {
      phone: string;
      name: string;
      tongPhaiTra: number;
      tongDaTra: number;
      noHienTai: number;
    }[] = [];
    for (const c of customers) {
      const agg = await this.prisma.order.aggregate({
        where: { customerId: c.id, type: 'POS', status: 'COMPLETED', orderDate: { lte: dEnd } },
        _sum: { amountDue: true, amountReceived: true, orderBalance: true },
      });
      const phai = agg._sum.amountDue ?? 0;
      const da = agg._sum.amountReceived ?? 0;
      rows.push({
        phone: c.phone,
        name: c.name,
        tongPhaiTra: phai,
        tongDaTra: da,
        noHienTai: c.totalDebt,
      });
    }
    const summary = rows.reduce(
      (s, r) => {
        s.phai += r.tongPhaiTra;
        s.da += r.tongDaTra;
        s.no += r.noHienTai;
        return s;
      },
      { phai: 0, da: 0, no: 0 },
    );
    return { asOf, rows, summary };
  }

  /**
   * Tổng hợp cũ (dựa log CRM) — giữ tương thích.
   */
  async revenueSummary(params: { from?: string; to?: string }) {
    const { from, to } = params;
    const gte = from ? new Date(from + 'T00:00:00.000Z') : new Date(0);
    const toD = to ? new Date(to + 'T00:00:00.000Z') : new Date();
    const lt = new Date(toD);
    lt.setUTCDate(lt.getUTCDate() + 1);
    const posRows = await this.prisma.crmTransaction.findMany({
      where: { type: 'POS_SALE', createdAt: { gte, lt } },
    });
    const posReceived = posRows.reduce((a, b) => a + b.amount, 0);
    const debtRows = await this.prisma.crmTransaction.findMany({
      where: { type: 'DEBT_COLLECTION', createdAt: { gte, lt } },
    });
    const debtCollected = debtRows.reduce((a, b) => a + b.amount, 0);
    const newCustomers = await this.prisma.customer.count({
      where: { createdAt: { gte, lt } },
    });
    return {
      from: from ?? null,
      to: to ?? null,
      posThucThu: posReceived,
      thuCongNo: debtCollected,
      tongTienVao: posReceived + debtCollected,
      newCustomers,
    };
  }
}
