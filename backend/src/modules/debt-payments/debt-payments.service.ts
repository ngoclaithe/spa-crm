import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmTransactionType } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDebtPaymentDto } from './dto/create-debt-payment.dto';

@Injectable()
export class DebtPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private parsePerformedAt(ymd?: string): Date {
    if (ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd.trim())) {
      return new Date(`${ymd.trim()}T00:00:00.000Z`);
    }
    return new Date();
  }

  list(params: { customerId?: string; skip: number; take: number }) {
    const { customerId, skip, take } = params;
    return this.prisma.debtPayment.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, crmLog: true },
      skip,
      take,
    });
  }

  create(dto: CreateDebtPaymentDto) {
    const amount = Math.floor(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('Số tiền không hợp lệ');
    }
    return this.prisma.$transaction(
      async (tx) => {
        const customer = await tx.customer.findUnique({ where: { id: dto.customerId } });
        if (!customer) {
          throw new NotFoundException('Khách hàng không tồn tại');
        }
        if (customer.totalDebt <= 0) {
          throw new BadRequestException('Khách hàng hiện không còn công nợ');
        }
        if (amount > customer.totalDebt) {
          throw new BadRequestException('Số thu lớn hơn tổng công nợ hiện tại');
        }
        const newDebt = customer.totalDebt - amount;
        const performedAt = this.parsePerformedAt(dto.performedAt);
        const payment = await tx.debtPayment.create({
          data: { customerId: customer.id, amount, note: dto.note ?? null, performedAt },
        });
        await tx.customer.update({
          where: { id: customer.id },
          data: { totalDebt: { decrement: amount } },
        });
        await tx.crmTransaction.create({
          data: {
            type: CrmTransactionType.DEBT_COLLECTION,
            amount,
            customerId: customer.id,
            debtPaymentId: payment.id,
            customerDebtAfter: newDebt,
            description: dto.note ?? 'Thu công nợ',
            createdAt: performedAt,
          },
        });
        return { payment, newTotalDebt: newDebt };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
