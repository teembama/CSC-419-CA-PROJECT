import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWalkInDto } from '../dto/create-walkin.dto';

/**
 * WalkInManagerService - Domain Service for Walk-In Patient Management
 * 
 * PURPOSE:
 * Handles emergency walk-in patients who arrive without appointments.
 * This service bypasses normal slot availability checks since walk-ins
 * are accepted regardless of scheduled availability.
 * 
 * BUSINESS RULES:
 * 1. Walk-ins do not require an available slot
 * 2. Walk-ins are force-booked by creating an "emergency" slot
 * 3. Only Staff/Receptionist roles can register walk-ins
 * 4. Walk-ins are marked with is_walk_in = true flag
 * 5. Patient and Clinician must exist in the system
 * 
 * USAGE:
 * Called by SchedulingController's POST /scheduling/walk-ins endpoint
 * when front desk staff register a patient who has arrived without booking.
 */
@Injectable()
export class WalkInManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a walk-in patient
   * Creates an emergency slot and booking in a single transaction
   * 
   * @param dto - Walk-in registration details
   * @returns The created booking with slot information
   * @throws NotFoundException if patient or clinician doesn't exist
   * @throws ConflictException if patient already has an active walk-in today
   */
  async registerWalkIn(dto: CreateWalkInDto) {
    // Verify patient exists
    const patient = await this.prisma.users.findUnique({
      where: { id: dto.patientId },
      select: { id: true, first_name: true, last_name: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${dto.patientId} not found`);
    }

    // Verify clinician exists
    const clinician = await this.prisma.users.findUnique({
      where: { id: dto.clinicianId },
      select: { id: true, first_name: true, last_name: true },
    });

    if (!clinician) {
      throw new NotFoundException(`Clinician with ID ${dto.clinicianId} not found`);
    }

    // Check if patient already has an active walk-in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingWalkIn = await this.prisma.appt_bookings.findFirst({
      where: {
        patient_id: dto.patientId,
        is_walk_in: true,
        status: {
          in: ['Pending', 'Confirmed'],
        },
      },
    });

    if (existingWalkIn) {
      throw new ConflictException(
        `Patient ${patient.first_name} ${patient.last_name} already has an active walk-in appointment today`,
      );
    }

    // Create emergency slot and booking in a transaction
    const now = new Date();
    const slotEnd = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour slot

    return this.prisma.$transaction(async (tx) => {
      // Create emergency slot using raw SQL for tstzrange
      const slotResult = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO appt_slots (clinician_id, time_range, status, version)
        VALUES (
          ${dto.clinicianId}::uuid,
          tstzrange(${now.toISOString()}, ${slotEnd.toISOString()}),
          'Booked',
          1
        )
        RETURNING id
      `;

      const slotId = slotResult[0].id;

      // Create walk-in booking
      const booking = await tx.appt_bookings.create({
        data: {
          patient_id: dto.patientId,
          slot_id: slotId,
          status: 'Confirmed', // Walk-ins are immediately confirmed
          is_walk_in: true,
          reason_for_visit: dto.reasonForVisit,
        },
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          appt_slots: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      return {
        id: booking.id,
        patientId: booking.patient_id,
        slotId: booking.slot_id,
        status: booking.status,
        isWalkIn: booking.is_walk_in,
        reasonForVisit: booking.reason_for_visit,
        patient: booking.users,
        clinician: {
          id: clinician.id,
          firstName: clinician.first_name,
          lastName: clinician.last_name,
        },
        message: `Walk-in registered successfully for ${patient.first_name} ${patient.last_name}`,
      };
    });
  }

  /**
   * Get all walk-in appointments for a specific date
   * Useful for front desk staff to see daily walk-in volume
   * 
   * @param date - Date to query (defaults to today)
   * @returns List of walk-in bookings for the date
   */
  async getWalkInsForDate(date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const walkIns = await this.prisma.appt_bookings.findMany({
      where: {
        is_walk_in: true,
        status: {
          not: 'Cancelled',
        },
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        appt_slots: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        appt_slots: {
          status: 'asc',
        },
      },
    });

    return walkIns.map((booking) => ({
      id: booking.id,
      patient: {
        id: booking.users?.id,
        name: `${booking.users?.first_name} ${booking.users?.last_name}`,
        email: booking.users?.email,
        phone: booking.users?.phone_number,
      },
      clinician: {
        id: booking.appt_slots?.users?.id,
        name: `${booking.appt_slots?.users?.first_name} ${booking.appt_slots?.users?.last_name}`,
      },
      status: booking.status,
      reasonForVisit: booking.reason_for_visit,
    }));
  }
}
