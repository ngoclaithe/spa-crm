import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  listByCategory(categoryId: string) {
    return this.prisma.service.findMany({
      where: { categoryId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  listAll() {
    return this.prisma.service.findMany({ include: { category: true } });
  }

  async get(id: string) {
    const s = await this.prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!s) {
      throw new NotFoundException();
    }
    return s;
  }

  async create(dto: CreateServiceDto) {
    await this.ensureCategory(dto.categoryId);
    return this.prisma.service.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        defaultPrice: dto.defaultPrice,
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.get(id);
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  private async ensureCategory(id: string) {
    const c = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!c) {
      throw new BadRequestException('Loại dịch vụ không tồn tại');
    }
  }
}
