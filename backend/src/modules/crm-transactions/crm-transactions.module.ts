import { Module } from '@nestjs/common';
import { CrmTransactionsService } from './crm-transactions.service';
import { CrmTransactionsController } from './crm-transactions.controller';

@Module({
  controllers: [CrmTransactionsController],
  providers: [CrmTransactionsService],
  exports: [CrmTransactionsService],
})
export class CrmTransactionsModule {}
