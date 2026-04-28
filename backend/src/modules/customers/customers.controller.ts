import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateCustomerDto, UpdateCustomerDto, UpsertCustomerDto } from './dto/create-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get('with-debt')
  withDebt() {
    return this.service.listWithDebt();
  }

  @Get()
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @Query('q') q?: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    const take = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = Math.max(0, parseInt(offset, 10) || 0);
    return this.service.list({ q, take, skip });
  }

  @Get('search')
  @ApiQuery({ name: 'phone', required: true })
  search(@Query('phone') phone: string) {
    return this.service.findByPhoneRaw(phone);
  }

  @Get('activity')
  @ApiQuery({ name: 'phone', required: true })
  activity(@Query('phone') phone: string) {
    return this.service.getActivityByPhone(phone);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const c = await this.service.findById(id);
    if (!c) {
      throw new NotFoundException();
    }
    return c;
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  @Post('upsert')
  upsert(@Body() dto: UpsertCustomerDto) {
    return this.service.upsertByPhone(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }
}
