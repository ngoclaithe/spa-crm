import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateSalesChannelDto, UpdateSalesChannelDto } from './dto/sales-channel.dto';
import { SalesChannelsService } from './sales-channels.service';

@ApiTags('Sales channels')
@Controller('sales-channels')
export class SalesChannelsController {
  constructor(private readonly service: SalesChannelsService) {}

  @Get()
  list(@Query('all') all?: string) {
    return all === '1' || all === 'true' ? this.service.listAll() : this.service.listActive();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() dto: CreateSalesChannelDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSalesChannelDto) {
    return this.service.update(id, dto);
  }
}
