import { Injectable } from '@nestjs/common';

@Injectable()
export class ClinicalService {
  async getPatientChart(patientId: string) {
    return {
      patientId,
      chart: [],
    };
  }
}

