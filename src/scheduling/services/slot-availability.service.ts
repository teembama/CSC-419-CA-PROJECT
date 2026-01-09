import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SlotAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableSlots(clinicianId: string) {
    return this.prisma.$queryRaw<
      {
        id: string;
        clinician_id: string;
        time_range: unknown;
        status: string;
      }[]
    >`
      SELECT id, clinician_id, time_range, status
      FROM appt_slots
      WHERE clinician_id = ${clinicianId}
        AND status = 'Available'
      ORDER BY lower(time_range)
    `;
  }
}

