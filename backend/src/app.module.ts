import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesChannelsModule } from './modules/sales-channels/sales-channels.module';
import { ServiceCategoriesModule } from './modules/service-categories/service-categories.module';
import { ServicesModule } from './modules/services/services.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DebtPaymentsModule } from './modules/debt-payments/debt-payments.module';
import { CrmTransactionsModule } from './modules/crm-transactions/crm-transactions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AppSettingsModule } from './modules/app-settings/app-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CustomersModule,
    SalesChannelsModule,
    ServiceCategoriesModule,
    ServicesModule,
    OrdersModule,
    DebtPaymentsModule,
    CrmTransactionsModule,
    ReportsModule,
    AppSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
