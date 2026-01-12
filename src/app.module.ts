import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { IamModule } from './iam/iam.module';
import { ClinicalModule } from './clinical/clinical.module';
import { LabModule } from './lab/lab.module';
import { BillingModule } from './billing/billing.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    SchedulingModule,
    IamModule,
    ClinicalModule,
    LabModule,
    BillingModule,
    AdminModule,
  ],
})
export class AppModule {}


