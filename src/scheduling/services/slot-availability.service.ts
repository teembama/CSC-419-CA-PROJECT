import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SlotAvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get available slots for a clinician on a specific date
   *
   * @param clinicianId - UUID of the clinician
   * @param date - Optional date to filter slots (defaults to all future slots)
   * @returns Array of available slots
   */
  async getAvailableSlots(clinicianId: string, date?: Date) {
    console.log(`[SlotAvailabilityService] getAvailableSlots called for clinician: ${clinicianId}, date: ${date?.toISOString()}`);

    if (date) {
      // Get slots for a specific date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`[SlotAvailabilityService] Querying slots between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

      const slots = await this.prisma.$queryRaw<
        {
          id: string;
          clinician_id: string;
          start_time: Date;
          end_time: Date;
          status: string;
          version: number;
        }[]
      >`
        SELECT DISTINCT
          id,
          clinician_id,
          lower(time_range) as start_time,
          upper(time_range) as end_time,
          status,
          version
        FROM appt_slots
        WHERE clinician_id = ${clinicianId}::uuid
          AND status = 'Available'
          AND time_range && tstzrange(${startOfDay.toISOString()}::timestamptz, ${endOfDay.toISOString()}::timestamptz)
        ORDER BY start_time ASC
      `;

      console.log(`[SlotAvailabilityService] Found ${slots.length} available slots:`, slots.map(s => ({ id: s.id, status: s.status, start: s.start_time })));

      return slots.map(slot => ({
        id: slot.id,
        clinicianId: slot.clinician_id,
        startTime: new Date(slot.start_time).toISOString(),
        endTime: new Date(slot.end_time).toISOString(),
        status: slot.status,
        version: slot.version,
      }));
    }

    // Get all future available slots
    const now = new Date();
    const slots = await this.prisma.$queryRaw<
      {
        id: string;
        clinician_id: string;
        start_time: Date;
        end_time: Date;
        status: string;
        version: number;
      }[]
    >`
      SELECT
        id,
        clinician_id,
        lower(time_range) as start_time,
        upper(time_range) as end_time,
        status,
        version
      FROM appt_slots
      WHERE clinician_id = ${clinicianId}::uuid
        AND status = 'Available'
        AND lower(time_range) >= ${now.toISOString()}::timestamptz
      ORDER BY lower(time_range)
    `;

    return slots.map(slot => ({
      id: slot.id,
      clinicianId: slot.clinician_id,
      startTime: new Date(slot.start_time).toISOString(),
      endTime: new Date(slot.end_time).toISOString(),
      status: slot.status,
      version: slot.version,
    }));
  }
}
