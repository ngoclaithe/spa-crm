import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { ServicesService } from './services.service';

@ApiTags('Services (Chi tiết dịch vụ)')
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  list(
    @Query('categoryId') categoryId: string | undefined,
    @Query('all') all?: string,
  ) {
    if (all === '1' || all === 'true') {
      return this.service.listAll();
    }
    if (!categoryId) {
      return this.service.listAll();
    }
    return this.service.listByCategory(categoryId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.service.update(id, dto);
  }
}
