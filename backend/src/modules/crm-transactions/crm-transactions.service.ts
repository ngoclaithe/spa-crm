import { Injectable } from '@nestjs/common';
import { CrmTransactionType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrmTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: {
    from?: string;
    to?: string;
    type?: CrmTransactionType;
    customerId?: string;
    skip: number;
    take: number;
  }) {
    const { from, to, type, customerId, skip, take } = params;
    const where: Prisma.CrmTransactionWhereInput = {};
    if (customerId) {
      where.customerId = customerId;
    }
    if (type) {
      where.type = type;
    }
    if (from || to) {
      const fromT = from ? new Date(from + 'T00:00:00.000Z') : undefined;
      const toT = to
        ? new Date(
            (() => {
              const d = new Date(to + 'T00:00:00.000Z');
              d.setUTCDate(d.getUTCDate() + 1);
              return d.toISOString();
            })(),
          )
        : undefined;
      where.createdAt = {};
      if (fromT) {
        where.createdAt = { gte: fromT };
      }
      if (toT) {
        where.createdAt = { ...where.createdAt, lt: toT };
      }
    }
    return this.prisma.crmTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, order: true, debtPayment: true },
      skip,
      take,
    });
  }
}
