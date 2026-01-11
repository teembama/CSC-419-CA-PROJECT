import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSlotDto, UpdateSlotDto, BlockSlotDto } from '../dto/create-slot.dto';

/**
 * SlotService - Domain Service for Availability Slot Management
 * 
 * PURPOSE:
 * Manages clinician availability slots - the time windows when clinicians
 * are available for patient appointments.
 * 
 * KEY FEATURES:
 * 1. CRUD operations for slots
 * 2. Optimistic locking with version field
 * 3. Overlap prevention via PostgreSQL exclusion constraint
 * 4. Block/unblock functionality for time off
 * 5. Schedule retrieval for calendar views
 * 
 * TECHNICAL NOTES:
 * - Uses PostgreSQL tstzrange type for time_range field
 * - Exclusion constraint prevents overlapping slots per clinician
 * - Raw SQL needed for range operations (Prisma limitation)
 */
@Injectable()
export class SlotService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new availability slot
   * 
   * @param dto - Slot creation details
   * @returns The created slot
   * @throws BadRequestException if start time is after end time
   * @throws ConflictException if slot overlaps with existing slot
   */
  async createSlot(dto: CreateSlotDto) {
    // Validate time range
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Verify clinician exists
    const clinician = await this.prisma.users.findUnique({
      where: { id: dto.clinicianId },
      select: { id: true, first_name: true, last_name: true },
    });

    if (!clinician) {
      throw new NotFoundException(`Clinician with ID ${dto.clinicianId} not found`);
    }

    try {
      // Create slot using raw SQL for tstzrange
      const result = await this.prisma.$queryRaw<Array<any>>`
        INSERT INTO appt_slots (clinician_id, time_range, status, version)
        VALUES (
          ${dto.clinicianId}::uuid,
          tstzrange(${startTime.toISOString()}, ${endTime.toISOString()}),
          ${dto.status || 'Available'},
          ${dto.version || 1}
        )
        RETURNING id, clinician_id, time_range, status, version
      `;

      const slot = result[0];

      return {
        id: slot.id,
        clinicianId: slot.clinician_id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: slot.status,
        version: slot.version,
        clinician: {
          id: clinician.id,
          name: `${clinician.first_name} ${clinician.last_name}`,
        },
      };
    } catch (error) {
      // PostgreSQL exclusion constraint violation
      if (error.code === '23P01') {
        throw new ConflictException(
          'This time slot overlaps with an existing slot for this clinician',
        );
      }
      throw error;
    }
  }

  /**
   * Get a clinician's full schedule for a date range
   * 
   * @param clinicianId - ID of the clinician
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @param status - Optional filter by slot status
   * @returns Array of slots within the date range
   */
  async getClinicianSchedule(
    clinicianId: string,
    startDate: Date,
    endDate: Date,
    status?: string,
  ) {
    // Verify clinician exists
    const clinician = await this.prisma.users.findUnique({
      where: { id: clinicianId },
      select: { id: true, first_name: true, last_name: true },
    });

    if (!clinician) {
      throw new NotFoundException(`Clinician with ID ${clinicianId} not found`);
    }

    // Build query with optional status filter
    let query = `
      SELECT 
        id,
        clinician_id,
        lower(time_range) as start_time,
        upper(time_range) as end_time,
        status,
        version
      FROM appt_slots
      WHERE clinician_id = $1::uuid
        AND time_range && tstzrange($2::timestamptz, $3::timestamptz)
    `;

    const params: any[] = [clinicianId, startDate.toISOString(), endDate.toISOString()];

    if (status) {
      query += ` AND status = $4`;
      params.push(status);
    }

    query += ` ORDER BY lower(time_range) ASC`;

    const slots = await this.prisma.$queryRawUnsafe<Array<any>>(query, ...params);

    return slots.map((slot) => ({
      id: slot.id,
      clinicianId: slot.clinician_id,
      startTime: new Date(slot.start_time).toISOString(),
      endTime: new Date(slot.end_time).toISOString(),
      status: slot.status,
      version: slot.version,
      clinician: {
        id: clinician.id,
        name: `${clinician.first_name} ${clinician.last_name}`,
      },
    }));
  }

  /**
   * Update an existing slot
   * Uses optimistic locking to prevent concurrent updates
   * 
   * @param id - Slot ID
   * @param dto - Update details
   * @returns Updated slot
   * @throws NotFoundException if slot doesn't exist
   * @throws ConflictException if version mismatch or overlap
   */
  async updateSlot(id: string, dto: UpdateSlotDto) {
    // Get current slot to check version
    const currentSlot = await this.prisma.$queryRaw<Array<any>>`
      SELECT 
        id,
        clinician_id,
        lower(time_range) as start_time,
        upper(time_range) as end_time,
        status,
        version
      FROM appt_slots
      WHERE id = ${id}::uuid
    `;

    if (currentSlot.length === 0) {
      throw new NotFoundException(`Slot with ID ${id} not found`);
    }

    const slot = currentSlot[0];

    // Check version for optimistic locking
    if (dto.version && dto.version !== slot.version) {
      throw new ConflictException(
        `Slot has been modified by another user. Current version: ${slot.version}`,
      );
    }

    // Prepare update values
    const startTime = dto.startTime ? new Date(dto.startTime) : new Date(slot.start_time);
    const endTime = dto.endTime ? new Date(dto.endTime) : new Date(slot.end_time);
    const status = dto.status || slot.status;
    const newVersion = slot.version + 1;

    // Validate time range
    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    try {
      const result = await this.prisma.$queryRaw<Array<any>>`
        UPDATE appt_slots
        SET 
          time_range = tstzrange(${startTime.toISOString()}, ${endTime.toISOString()}),
          status = ${status},
          version = ${newVersion}
        WHERE id = ${id}::uuid
        RETURNING id, clinician_id, time_range, status, version
      `;

      const updatedSlot = result[0];

      // Get clinician info
      const clinician = await this.prisma.users.findUnique({
        where: { id: updatedSlot.clinician_id },
        select: { id: true, first_name: true, last_name: true },
      });

      return {
        id: updatedSlot.id,
        clinicianId: updatedSlot.clinician_id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: updatedSlot.status,
        version: updatedSlot.version,
        clinician: {
          id: clinician.id,
          name: `${clinician.first_name} ${clinician.last_name}`,
        },
      };
    } catch (error) {
      if (error.code === '23P01') {
        throw new ConflictException(
          'Updated time slot overlaps with an existing slot for this clinician',
        );
      }
      throw error;
    }
  }

  /**
   * Delete a slot
   * Only allowed if slot has no bookings
   * 
   * @param id - Slot ID
   * @throws NotFoundException if slot doesn't exist
   * @throws ConflictException if slot has bookings
   */
  async deleteSlot(id: string) {
    // Check if slot exists
    const slot = await this.prisma.appt_slots.findUnique({
      where: { id },
      include: {
        appt_bookings: {
          where: {
            status: {
              not: 'Cancelled',
            },
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException(`Slot with ID ${id} not found`);
    }

    // Check for active bookings
    if (slot.appt_bookings && slot.appt_bookings.length > 0) {
      throw new ConflictException(
        'Cannot delete slot with active bookings. Cancel bookings first or block the slot instead.',
      );
    }

    await this.prisma.appt_slots.delete({
      where: { id },
    });

    return {
      message: 'Slot deleted successfully',
      id,
    };
  }

  /**
   * Block a slot (mark as unavailable)
   * Used when clinician is out of office or unavailable
   * 
   * @param id - Slot ID
   * @param dto - Optional reason for blocking
   * @returns Updated slot
   * @throws NotFoundException if slot doesn't exist
   * @throws ConflictException if slot has active bookings
   */
  async blockSlot(id: string, dto?: BlockSlotDto) {
    // Check if slot exists
    const slot = await this.prisma.appt_slots.findUnique({
      where: { id },
      include: {
        appt_bookings: {
          where: {
            status: {
              not: 'Cancelled',
            },
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException(`Slot with ID ${id} not found`);
    }

    // Check for active bookings
    if (slot.appt_bookings && slot.appt_bookings.length > 0) {
      throw new ConflictException(
        'Cannot block slot with active bookings. Cancel or reschedule bookings first.',
      );
    }

    // Update slot status to Blocked
    const result = await this.prisma.$queryRaw<Array<any>>`
      UPDATE appt_slots
      SET status = 'Blocked'
      WHERE id = ${id}::uuid
      RETURNING id, clinician_id, time_range, status, version
    `;

    const blockedSlot = result[0];

    // Get time range
    const timeRange = await this.prisma.$queryRaw<Array<any>>`
      SELECT 
        lower(time_range) as start_time,
        upper(time_range) as end_time
      FROM appt_slots
      WHERE id = ${id}::uuid
    `;

    return {
      id: blockedSlot.id,
      clinicianId: blockedSlot.clinician_id,
      startTime: new Date(timeRange[0].start_time).toISOString(),
      endTime: new Date(timeRange[0].end_time).toISOString(),
      status: blockedSlot.status,
      version: blockedSlot.version,
      reason: dto?.reason,
      message: 'Slot blocked successfully',
    };
  }

  /**
   * Get a single slot by ID
   * 
   * @param id - Slot ID
   * @returns Slot details
   * @throws NotFoundException if slot doesn't exist
   */
  async getSlotById(id: string) {
    const result = await this.prisma.$queryRaw<Array<any>>`
      SELECT 
        id,
        clinician_id,
        lower(time_range) as start_time,
        upper(time_range) as end_time,
        status,
        version
      FROM appt_slots
      WHERE id = ${id}::uuid
    `;

    if (result.length === 0) {
      throw new NotFoundException(`Slot with ID ${id} not found`);
    }

    const slot = result[0];

    // Get clinician info
    const clinician = await this.prisma.users.findUnique({
      where: { id: slot.clinician_id },
      select: { id: true, first_name: true, last_name: true },
    });

    return {
      id: slot.id,
      clinicianId: slot.clinician_id,
      startTime: new Date(slot.start_time).toISOString(),
      endTime: new Date(slot.end_time).toISOString(),
      status: slot.status,
      version: slot.version,
      clinician: {
        id: clinician.id,
        name: `${clinician.first_name} ${clinician.last_name}`,
      },
    };
  }
}
