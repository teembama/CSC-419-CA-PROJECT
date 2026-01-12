import { Module } from '@nestjs/common';
import { LabController } from './lab.controller';
import { LabService } from './lab.service';
import { LabOrderService } from './services/lab-order.service';
import { LabTestItemService } from './services/lab-test-item.service';
import { LabResultService } from './services/lab-result.service';
import { ResultVerificationService } from './services/result-verification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LabController],
  providers: [
    LabService,
    LabOrderService,
    LabTestItemService,
    LabResultService,
    ResultVerificationService,
  ],
  exports: [
    LabOrderService,
    LabTestItemService,
    LabResultService,
    ResultVerificationService,
  ],
})
export class LabModule {}
