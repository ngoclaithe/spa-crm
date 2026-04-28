import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders (Bán hàng / POS)')
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post('pos')
  createPos(@Body() dto: CreatePosOrderDto) {
    return this.service.createPos(dto);
  }

  @Get('history')
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Mã đơn, SĐT, tên khách' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  history(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customerId') customerId?: string,
    @Query('q') q?: string,
    @Query('limit') limit = '30',
    @Query('offset') offset = '0',
  ) {
    const take = Math.min(200, Math.max(1, parseInt(limit, 10) || 30));
    const skip = Math.max(0, parseInt(offset, 10) || 0);
    return this.service.list({ from, to, customerId, orderCodeQ: q, take, skip });
  }

  @Get()
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Mã đơn, SĐT, tên' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customerId') customerId?: string,
    @Query('q') q?: string,
    @Query('limit') limit = '30',
    @Query('offset') offset = '0',
  ) {
    const take = Math.min(200, Math.max(1, parseInt(limit, 10) || 30));
    const skip = Math.max(0, parseInt(offset, 10) || 0);
    return this.service.list({ from, to, customerId, orderCodeQ: q, take, skip });
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.get(id);
  }
}
