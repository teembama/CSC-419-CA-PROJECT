import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import { BookingService } from './services/booking.service';
import { SlotService } from './services/slot.service';
import { SlotAvailabilityService } from './services/slot-availability.service';
import { WalkInManagerService } from './services/walkin-manager.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CreateSlotDto, UpdateSlotDto, BlockSlotDto } from './dto/create-slot.dto';
import { CreateWalkInDto } from './dto/create-walkin.dto';
import { ScheduleQueryDto, AvailableSlotQueryDto } from './dto/schedule-query.dto';

/**
 * SchedulingController
 * 
 * Handles all scheduling-related endpoints:
 * 1. Booking Management (Patient, Clinician, Admin)
 * 2. Slot Management (Clinician, Admin)
 * 3. Walk-In Registration (Staff, Admin)
 * 4. Schedule Viewing (All roles with appropriate filters)
 * 
 * AUTHENTICATION:
 * All endpoints require JWT authentication via @UseGuards(JwtAuthGuard)
 * 
 * AUTHORIZATION:
 * Role-based access control via @Roles() decorator and RolesGuard
 */
@Controller('scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly slotService: SlotService,
    private readonly slotAvailabilityService: SlotAvailabilityService,
    private readonly walkInManagerService: WalkInManagerService,
  ) {}

  // ==================== BOOKING ENDPOINTS ====================

  /**
   * Create a new appointment booking
   * Accessible by: Patient, Staff, Admin
   */
  @Post('bookings')
  @Roles('Patient', 'Staff', 'Admin')
  async createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(dto);
  }

  /**
   * Get patient's appointments
   * Accessible by: Patient (own), Clinician (assigned), Admin (all)
   */
  @Get('bookings/patient/:patientId')
  @Roles('Patient', 'Clinician', 'Staff', 'Admin')
  async getPatientAppointments(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ) {
    return this.bookingService.getPatientAppointments(patientId);
  }

  /**
   * Get a specific booking by ID
   * Accessible by: Patient (own), Clinician (assigned), Staff, Admin
   */
  @Get('bookings/:bookingId')
  @Roles('Patient', 'Clinician', 'Staff', 'Admin')
  async getBookingById(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ) {
    return this.bookingService.getBookingById(bookingId);
  }

  /**
   * Update a booking (partial update)
   * Accessible by: Patient (own), Clinician (assigned), Staff, Admin
   */
  @Patch('bookings/:bookingId')
  @Roles('Patient', 'Clinician', 'Staff', 'Admin')
  async updateBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingService.updateBooking(bookingId, dto);
  }

  /**
   * Cancel a booking
   * Accessible by: Patient (own), Clinician (assigned), Staff, Admin
   */
  @Post('bookings/:bookingId/cancel')
  @Roles('Patient', 'Clinician', 'Staff', 'Admin')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ) {
    return this.bookingService.cancelBooking(bookingId);
  }

  /**
   * Reschedule a booking to a new slot
   * Accessible by: Patient (own), Staff, Admin
   */
  @Post('bookings/:bookingId/reschedule')
  @Roles('Patient', 'Staff', 'Admin')
  @HttpCode(HttpStatus.OK)
  async rescheduleBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body('newSlotId', ParseUUIDPipe) newSlotId: string,
  ) {
    return this.bookingService.rescheduleBooking(bookingId, newSlotId);
  }

  // ==================== CLINICIAN ENDPOINTS ====================

  /**
   * Get list of all clinicians
   * Accessible by: All authenticated users
   */
  @Get('clinicians')
  @Roles('Patient', 'Clinician', 'Staff', 'Admin')
  async getClinicians() {
    return this.slotService.getClinicians();
  }

  // ==================== SLOT MANAGEMENT ENDPOINTS ====================

  /**
   * Create a new availability slot
   * Accessible by: Clinician (own), Admin (all)
   */
  @Post('slots')
  @Roles('Clinician', 'Admin')
  async createSlot(@Body() dto: CreateSlotDto) {
    return this.slotService.createSlot(dto);
  }

  /**
   * Get available slots for booking
   * Accessible by: All authenticated users
   */
  @Get('slots/available')
  @Roles('Patient', 'Clinician', 'Staff', 'Admin')
  async getAvailableSlots(@Query() query: AvailableSlotQueryDto) {
    return this.slotAvailabilityService.getAvailableSlots(
      query.clinicianId,
      new Date(query.date),
    );
  }

  /**
   * Get a clinician's full schedule for a date range
   * Accessible by: Clinician (own), Staff, Admin (all)
   */
  @Get('clinicians/:clinicianId/schedule')
  @Roles('Clinician', 'Staff', 'Admin')
  async getClinicianSchedule(
    @Param('clinicianId', ParseUUIDPipe) clinicianId: string,
    @Query() query: ScheduleQueryDto,
  ) {
    return this.slotService.getClinicianSchedule(
      clinicianId,
      new Date(query.startDate),
      new Date(query.endDate),
      query.status,
    );
  }

  /**
   * Get a specific slot by ID
   * Accessible by: All authenticated users
   */
  @Get('slots/:slotId')
  @Roles('Patient', 'Clinician', 'Staff', 'Admin')
  async getSlotById(@Param('slotId', ParseUUIDPipe) slotId: string) {
    return this.slotService.getSlotById(slotId);
  }

  /**
   * Update a slot
   * Accessible by: Clinician (own), Admin (all)
   */
  @Patch('slots/:slotId')
  @Roles('Clinician', 'Admin')
  async updateSlot(
    @Param('slotId', ParseUUIDPipe) slotId: string,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.slotService.updateSlot(slotId, dto);
  }

  /**
   * Delete a slot
   * Accessible by: Clinician (own), Admin (all)
   */
  @Delete('slots/:slotId')
  @Roles('Clinician', 'Admin')
  @HttpCode(HttpStatus.OK)
  async deleteSlot(@Param('slotId', ParseUUIDPipe) slotId: string) {
    return this.slotService.deleteSlot(slotId);
  }

  /**
   * Block a slot (mark as unavailable)
   * Accessible by: Clinician (own), Admin (all)
   */
  @Post('slots/:slotId/block')
  @Roles('Clinician', 'Admin')
  @HttpCode(HttpStatus.OK)
  async blockSlot(
    @Param('slotId', ParseUUIDPipe) slotId: string,
    @Body() dto: BlockSlotDto,
  ) {
    return this.slotService.blockSlot(slotId, dto);
  }

  // ==================== WALK-IN ENDPOINTS ====================

  /**
   * Register a walk-in patient
   * Accessible by: Staff, Admin
   */
  @Post('walk-ins')
  @Roles('Staff', 'Admin')
  async registerWalkIn(@Body() dto: CreateWalkInDto) {
    return this.walkInManagerService.registerWalkIn(dto);
  }

  /**
   * Get all walk-ins for a specific date
   * Accessible by: Staff, Admin
   */
  @Get('walk-ins')
  @Roles('Staff', 'Admin')
  async getWalkInsForDate(@Query('date') date?: string) {
    const queryDate = date ? new Date(date) : new Date();
    return this.walkInManagerService.getWalkInsForDate(queryDate);
  }
}
