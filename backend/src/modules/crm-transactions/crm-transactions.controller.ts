import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { CrmTransactionType } from '@prisma/client';
import { CrmTransactionsService } from './crm-transactions.service';

@ApiTags('Nhật ký giao dịch')
@Controller('transaction-log')
export class CrmTransactionsController {
  constructor(private readonly service: CrmTransactionsService) {}

  @Get()
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: CrmTransactionType })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  list(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customerId') customerId?: string,
    @Query('type') type?: CrmTransactionType,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    const take = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
    const skip = Math.max(0, parseInt(offset, 10) || 0);
    return this.service.list({ from, to, type, customerId, take, skip });
  }
}
