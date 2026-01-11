import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Import PrismaModule to use the database

@Module({
  imports: [PrismaModule], // This gives Billing access to the PrismaService
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService], // Exporting it so Tomisin or Paula can use it if needed
})
export class BillingModule {}