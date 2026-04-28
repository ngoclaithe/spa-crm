import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePhone } from '../../common/utils/phone';
import { CreateCustomerDto, UpdateCustomerDto, UpsertCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  async findByPhoneRaw(phone: string) {
    const key = normalizePhone(phone);
    if (!key) {
      return null;
    }
    return this.prisma.customer.findUnique({
      where: { phone: key },
    });
  }

  listWithDebt() {
    return this.prisma.customer.findMany({
      where: { totalDebt: { gt: 0 } },
      orderBy: { totalDebt: 'desc' },
    });
  }

  /** Lịch sử đơn + thu nợ theo SĐT (màn tra cứu). */
  async getActivityByPhone(phone: string) {
    const c = await this.findByPhoneRaw(phone);
    if (!c) {
      return { customer: null, orders: [], debtPayments: [] };
    }
    const [orders, debtPayments] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { customerId: c.id, type: 'POS' },
        orderBy: { orderDate: 'desc' },
        take: 200,
        include: {
          items: { include: { service: { include: { category: true } } } },
          salesChannel: true,
        },
      }),
      this.prisma.debtPayment.findMany({
        where: { customerId: c.id },
        orderBy: { performedAt: 'desc' },
        take: 200,
      }),
    ]);
    return { customer: c, orders, debtPayments };
  }

  list(params?: { skip?: number; take?: number; q?: string }) {
    const { skip, take, q } = params ?? {};
    return this.prisma.customer.findMany({
      where: q
        ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] }
        : undefined,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async create(dto: CreateCustomerDto) {
    const phone = normalizePhone(dto.phone);
    if (!phone) {
      throw new ConflictException('Số điện thoại không hợp lệ');
    }
    return this.prisma.customer.create({ data: { phone, name: dto.name } });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.ensure(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  /**
   * Dùng cho POS: tìm theo SĐT hoặc tạo mới.
   */
  async upsertByPhone(dto: UpsertCustomerDto) {
    const phone = normalizePhone(dto.phone);
    if (!phone) {
      throw new ConflictException('Số điện thoại không hợp lệ');
    }
    try {
      return await this.prisma.customer.upsert({
        where: { phone },
        create: { phone, name: dto.name },
        update: { name: dto.name },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Số điện thoại trùng');
      }
      throw e;
    }
  }

  private async ensure(id: string) {
    const c = await this.prisma.customer.findUnique({ where: { id } });
    if (!c) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }
  }
}
