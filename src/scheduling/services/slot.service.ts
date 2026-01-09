import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SlotService {
  constructor(private readonly prisma: PrismaService) {}

  async createSlot(
    clinicianId: string,
    start: string,
    end: string,
  ) {
    const conflicts = await this.prisma.$queryRaw<
      { id: string }[]
    >`
      SELECT id
      FROM appt_slots
      WHERE clinician_id = ${clinicianId}
        AND time_range && tstzrange(${start}, ${end})
    `;

    if (conflicts.length > 0) {
      throw new BadRequestException('Slot conflicts with existing availability');
    }

    return this.prisma.$executeRaw`
      INSERT INTO appt_slots (clinician_id, time_range, status)
      VALUES (
        ${clinicianId},
        tstzrange(${start}, ${end}),
        'Available'
      )
    `;
  }
}
