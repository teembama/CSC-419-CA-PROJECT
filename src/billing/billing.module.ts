import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InvoiceGenerationService } from './services/invoice-generation.service';
import { BillingEventsListener } from './events/billing-events.listener';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [BillingController],
  providers: [
    BillingService,
    InvoiceGenerationService,
    BillingEventsListener,
  ],
  exports: [BillingService, InvoiceGenerationService],
})
export class BillingModule {}
