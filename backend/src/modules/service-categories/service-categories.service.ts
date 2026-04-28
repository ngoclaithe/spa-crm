import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceCategoryDto, UpdateServiceCategoryDto } from './dto/service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  listForPos() {
    return this.prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: { where: { active: true }, orderBy: { name: 'asc' } },
      },
    });
  }

  listAll() {
    return this.prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { services: true },
    });
  }

  async get(id: string) {
    const c = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: { services: { orderBy: { name: 'asc' } } },
    });
    if (!c) {
      throw new NotFoundException();
    }
    return c;
  }

  create(dto: CreateServiceCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: { name: dto.name, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  async update(id: string, dto: UpdateServiceCategoryDto) {
    await this.get(id);
    return this.prisma.serviceCategory.update({ where: { id }, data: dto });
  }
}
