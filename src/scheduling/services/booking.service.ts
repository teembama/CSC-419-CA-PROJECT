import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from '../dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async createBooking(dto: CreateBookingDto) {
    const { patientId, clinicianId, startTime, endTime, reasonForVisit } = dto;

    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.$queryRaw<
        { id: string }[]
      >`
        SELECT id
        FROM appt_slots
        WHERE clinician_id = ${clinicianId}
          AND status = 'Available'
          AND time_range @> tstzrange(${startTime}, ${endTime})
        LIMIT 1
        FOR UPDATE
      `;

      if (slot.length === 0) {
        throw new BadRequestException('No available slot for selected time');
      }

      await tx.appt_bookings.create({
        data: {
          patient_id: patientId,
          slot_id: slot[0].id,
          reason_for_visit: reasonForVisit,
          status: 'Confirmed',
        },
      });

      await tx.appt_slots.update({
        where: { id: slot[0].id },
        data: { status: 'Booked' },
      });

      return { success: true };
    });
  }
}
