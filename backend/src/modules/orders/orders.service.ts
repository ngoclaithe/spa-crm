import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmTransactionType, DiscountType, Prisma } from '@prisma/client';
import { computeAmountDue } from '../../common/utils/money';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { normalizePhone } from '../../common/utils/phone';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async buildOrderCodeInTx(
    tx: Prisma.TransactionClient,
    orderDate: Date,
  ): Promise<string> {
    const y = orderDate.getUTCFullYear();
    const m = String(orderDate.getUTCMonth() + 1).padStart(2, '0');
    const d = String(orderDate.getUTCDate()).padStart(2, '0');
    const dayPrefix = `POS-${y}${m}${d}-`;
    for (let k = 0; k < 8; k++) {
      const suffix = String(1000 + Math.floor(Math.random() * 9000));
      const code = `${dayPrefix}${suffix}`;
      const ex = await tx.order.findUnique({ where: { orderCode: code } });
      if (!ex) {
        return code;
      }
    }
    return `${dayPrefix}${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * Ngày tạo đơn: chỉ lấy phần ngày, tránh lệch múi giờ theo chuỗi YYYY-MM-DD.
   */
  private toOrderDate(input?: string): Date {
    if (input) {
      const m = /^\d{4}-\d{2}-\d{2}$/.exec(input.trim());
      if (m) {
        return new Date(`${input}T00:00:00.000Z`);
      }
    }
    return new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
  }

  async createPos(dto: CreatePosOrderDto) {
    const orderDate = this.toOrderDate(dto.orderDate);
    if (dto.salesChannelId) {
      const ch = await this.prisma.salesChannel.findFirst({
        where: { id: dto.salesChannelId, active: true },
      });
      if (!ch) {
        throw new BadRequestException('Kênh bán không hợp lệ');
      }
    }

    const itemsInput = dto.items;
    return this.prisma.$transaction(
      async (tx) => {
        const orderCode = await this.buildOrderCodeInTx(tx, orderDate);
        const phone = normalizePhone(dto.customer.phone);
        if (!phone) {
          throw new BadRequestException('Số điện thoại không hợp lệ');
        }
        const customer = await tx.customer.upsert({
          where: { phone },
          create: { phone, name: dto.customer.name },
          update: { name: dto.customer.name },
        });
        const debtBefore = customer.totalDebt;

        const lineRows: {
          serviceId: string;
          sessions: number;
          unitPrice: number;
          lineTotal: number;
        }[] = [];

        for (const row of itemsInput) {
          const service = await tx.service.findFirst({
            where: { id: row.serviceId, active: true },
          });
          if (!service) {
            throw new BadRequestException(`Dịch vụ ${row.serviceId} không tồn tại hoặc đã tắt`);
          }
          const unit = row.unitPrice != null ? row.unitPrice : service.defaultPrice;
          if (unit < 0) {
            throw new BadRequestException('Đơn giá không hợp lệ');
          }
          const lineTotal = unit * row.sessions;
          lineRows.push({ serviceId: service.id, sessions: row.sessions, unitPrice: unit, lineTotal });
        }

        const subtotal = lineRows.reduce((a, b) => a + b.lineTotal, 0);
        const discType: DiscountType = dto.discountType;
        const amountDue = computeAmountDue(subtotal, discType, dto.discountValue);
        const amountReceived = Math.max(0, Math.floor(dto.amountReceived));
        const orderBalance = Math.max(0, amountDue - amountReceived);

        const newDebt = debtBefore + orderBalance;
        if (orderBalance > 0) {
          await tx.customer.update({
            where: { id: customer.id },
            data: { totalDebt: { increment: orderBalance } },
          });
        }

        const order = await tx.order.create({
          data: {
            orderCode,
            orderDate,
            type: 'POS',
            status: 'COMPLETED',
            customerId: customer.id,
            salesChannelId: dto.salesChannelId ?? null,
            subtotal,
            discountValue: Math.floor(dto.discountValue),
            discountType: discType,
            amountDue,
            amountReceived,
            orderBalance,
            notes: dto.notes ?? null,
            items: {
              create: lineRows.map((r) => ({
                serviceId: r.serviceId,
                sessions: r.sessions,
                unitPrice: r.unitPrice,
                lineTotal: r.lineTotal,
              })),
            },
          },
          include: { items: true, customer: true, salesChannel: true },
        });

        await tx.crmTransaction.create({
          data: {
            type: CrmTransactionType.POS_SALE,
            amount: amountReceived,
            customerId: customer.id,
            orderId: order.id,
            customerDebtAfter: newDebt,
            description: `Bán hàng ${orderCode}. Còn nợ +${orderBalance}đ`,
          },
        });

        return order;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async get(id: string) {
    const o = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { service: { include: { category: true } } } }, customer: true, salesChannel: true },
    });
    if (!o) {
      throw new NotFoundException();
    }
    return o;
  }

  list(params: { from?: string; to?: string; customerId?: string; orderCodeQ?: string; skip: number; take: number }) {
    const { from, to, customerId, orderCodeQ, skip, take } = params;
    const parts: Prisma.OrderWhereInput[] = [];
    if (customerId) {
      parts.push({ customerId });
    }
    if (orderCodeQ) {
      parts.push({
        OR: [
          { orderCode: { contains: orderCodeQ, mode: 'insensitive' } },
          { customer: { name: { contains: orderCodeQ, mode: 'insensitive' } } },
          { customer: { phone: { contains: orderCodeQ } } },
        ],
      });
    }
    if (from && to) {
      parts.push({
        orderDate: {
          gte: this.toOrderDate(from),
          lte: this.toOrderDate(to),
        },
      });
    } else if (from) {
      parts.push({ orderDate: { gte: this.toOrderDate(from) } });
    } else if (to) {
      parts.push({ orderDate: { lte: this.toOrderDate(to) } });
    }
    const where: Prisma.OrderWhereInput = parts.length > 0 ? { AND: parts } : {};
    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { customer: true, salesChannel: true, items: true },
    });
  }
}
