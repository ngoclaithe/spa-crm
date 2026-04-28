import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSalesChannelDto, UpdateSalesChannelDto } from './dto/sales-channel.dto';

@Injectable()
export class SalesChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.salesChannel.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  }

  listAll() {
    return this.prisma.salesChannel.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async get(id: string) {
    const c = await this.prisma.salesChannel.findUnique({ where: { id } });
    if (!c) {
      throw new NotFoundException();
    }
    return c;
  }

  create(dto: CreateSalesChannelDto) {
    return this.prisma.salesChannel.create({
      data: { name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async update(id: string, dto: UpdateSalesChannelDto) {
    await this.get(id);
    return this.prisma.salesChannel.update({ where: { id }, data: dto });
  }
}
