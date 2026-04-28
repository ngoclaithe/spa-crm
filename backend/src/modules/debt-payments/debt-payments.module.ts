import { Module } from '@nestjs/common';
import { DebtPaymentsService } from './debt-payments.service';
import { DebtPaymentsController } from './debt-payments.controller';

@Module({
  controllers: [DebtPaymentsController],
  providers: [DebtPaymentsService],
  exports: [DebtPaymentsService],
})
export class DebtPaymentsModule {}
