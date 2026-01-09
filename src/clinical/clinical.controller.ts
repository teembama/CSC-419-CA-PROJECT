import { Controller, Get, Param } from '@nestjs/common';
import { ClinicalService } from './clinical.service';

@Controller('clinical')
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  @Get('patients/:id/chart')
  getPatientChart(@Param('id') id: string) {
    return this.clinicalService.getPatientChart(id);
  }
}

