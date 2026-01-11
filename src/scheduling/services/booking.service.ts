import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from '../dto/create-booking.dto'; // Ensure this file exists

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new booking.
   * Logic: Checks slot availability, locks the slot, and creates the booking.
   */
  async createBooking(dto: CreateBookingDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Check if the slot exists and is available
      const slot = await tx.appt_slots.findUnique({
        where: { id: dto.slotId }, // Assuming DTO has slotId. If DTO has clinicianId/time, logic changes.
      });

      if (!slot) {
        throw new NotFoundException('Time slot not found');
      }

      if (slot.status !== 'Available') {
        throw new BadRequestException('Time slot is not available');
      }

      // 2. Lock the slot (mark as Booked)
      await tx.appt_slots.update({
        where: { id: dto.slotId },
        data: { status: 'Booked' },
      });

      // 3. Create the booking
      // Note: mapping camelCase DTO to snake_case DB fields
      return tx.appt_bookings.create({
        data: {
          patient_id: dto.patientId,
          slot_id: dto.slotId,
          status: 'Confirmed',
          reason_for_visit: dto.reasonForVisit,
          is_walk_in: false,
        },
      });
    });
  }

  /**
   * Get all appointments for a specific patient.
   */
  async getPatientAppointments(patientId: string) {
    const bookings = await this.prisma.appt_bookings.findMany({
      where: { patient_id: patientId },
      include: {
        appt_slots: {
          include: {
            users: {
              select: { first_name: true, last_name: true, email: true },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      reasonForVisit: booking.reason_for_visit,
      isWalkIn: booking.is_walk_in,
      slot: booking.appt_slots ? {
        id: booking.appt_slots.id,
        status: booking.appt_slots.status,
        clinicianName: booking.appt_slots.users
          ? `${booking.appt_slots.users.first_name} ${booking.appt_slots.users.last_name}`
          : 'Unknown Clinician',
      } : null,
    }));
  }

  async getBookingById(id: string) {
    const booking = await this.prisma.appt_bookings.findUnique({
      where: { id },
      include: {
        appt_slots: {
          include: {
            users: { select: { first_name: true, last_name: true } },
          },
        },
        users: {
          select: { first_name: true, last_name: true, email: true, phone_number: true },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancelBooking(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.appt_bookings.findUnique({ where: { id } });
      if (!booking) throw new NotFoundException('Booking not found');

      const updatedBooking = await tx.appt_bookings.update({
        where: { id },
        data: { status: 'Cancelled' },
      });

      if (booking.slot_id) {
        await tx.appt_slots.update({
          where: { id: booking.slot_id },
          data: { status: 'Available' },
        });
      }
      return updatedBooking;
    });
  }

  async rescheduleBooking(bookingId: string, newSlotId: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldBooking = await tx.appt_bookings.findUnique({ where: { id: bookingId } });
      if (!oldBooking) throw new NotFoundException('Original booking not found');

      await tx.appt_bookings.update({
        where: { id: bookingId },
        data: { status: 'Cancelled' },
      });

      if (oldBooking.slot_id) {
        await tx.appt_slots.update({
          where: { id: oldBooking.slot_id },
          data: { status: 'Available' },
        });
      }

      const newSlot = await tx.appt_slots.findUnique({ where: { id: newSlotId } });
      if (!newSlot || newSlot.status !== 'Available') {
        throw new BadRequestException('New slot is not available');
      }

      await tx.appt_slots.update({
        where: { id: newSlotId },
        data: { status: 'Booked' },
      });

      return tx.appt_bookings.create({
        data: {
          patient_id: oldBooking.patient_id,
          slot_id: newSlotId,
          status: 'Confirmed',
          reason_for_visit: oldBooking.reason_for_visit,
          is_walk_in: false,
        },
      });
    });
  }
}