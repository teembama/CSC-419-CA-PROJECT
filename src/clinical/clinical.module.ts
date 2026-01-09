import { Module } from '@nestjs/common';
import { ClinicalController } from './clinical.controller';
import { ClinicalService } from './clinical.service';

@Module({
  controllers: [ClinicalController],
  providers: [ClinicalService]
})
export class ClinicalModule {}
