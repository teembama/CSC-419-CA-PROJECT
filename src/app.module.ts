import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { IamModule } from './iam/iam.module';
import { ClinicalModule } from './clinical/clinical.module';
import { LabModule } from './lab/lab.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    PrismaModule,
    SchedulingModule,
    IamModule,
    ClinicalModule,
    LabModule,
    BillingModule,
  ],
})
export class AppModule {}


