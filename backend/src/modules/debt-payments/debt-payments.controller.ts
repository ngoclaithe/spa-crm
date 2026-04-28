import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateDebtPaymentDto } from './dto/create-debt-payment.dto';
import { DebtPaymentsService } from './debt-payments.service';

@ApiTags('Thu tiền công nợ')
@Controller('debt-payments')
export class DebtPaymentsController {
  constructor(private readonly service: DebtPaymentsService) {}

  @Post()
  create(@Body() dto: CreateDebtPaymentDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @Query('customerId') customerId: string | undefined,
    @Query('limit') limit = '30',
    @Query('offset') offset = '0',
  ) {
    const take = Math.min(200, Math.max(1, parseInt(limit, 10) || 30));
    const skip = Math.max(0, parseInt(offset, 10) || 0);
    return this.service.list({ customerId, take, skip });
  }
}
