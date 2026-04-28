import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Báo cáo (Doanh thu)')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('revenue')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  revenue(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.revenueSummary({ from, to });
  }

  @Get('dashboard')
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  dashboard(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!from || !to) {
      return this.service.getDashboard(this.service.getDefaultFilterRangeVn());
    }
    return this.service.getDashboard({ from, to });
  }

  @Get('transaction-ledger')
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  transactionLedger(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!from || !to) {
      return this.service.getTransactionLedger(this.service.getDefaultFilterRangeVn());
    }
    return this.service.getTransactionLedger({ from, to });
  }

  @Get('debt-ledger')
  @ApiQuery({ name: 'asOf', required: false, description: 'Tính nợ đến ngày (YYYY-MM-DD)' })
  debtLedger(@Query('asOf') asOf?: string) {
    return this.service.getDebtLedger(asOf ?? this.service.getTodayVnYmd());
  }
}
