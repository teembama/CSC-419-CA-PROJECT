import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SchedulingController } from './app.controller';
import { BookingService } from './services/booking.service';
import { SlotService } from './services/slot.service';
import { SlotAvailabilityService } from './services/slot-availability.service';
import { WalkInManagerService } from './services/walkin-manager.service';

/**
 * SchedulingModule
 * 
 * DOMAIN: Supporting Domain in DDD architecture
 * 
 * RESPONSIBILITIES:
 * 1. Clinician availability management (slots)
 * 2. Patient appointment booking
 * 3. Walk-in patient registration
 * 4. Schedule viewing and filtering
 * 
 * DOMAIN SERVICES:
 * - BookingService: Complete booking lifecycle management
 * - SlotService: Clinician availability CRUD operations
 * - SlotAvailabilityService: Available slot queries with business rules
 * - WalkInManagerService: Emergency walk-in patient handling
 * 
 * BOUNDED CONTEXT RULES:
 * 1. Scheduling owns: appt_slots, appt_bookings tables
 * 2. Emits events: AppointmentBooked, AppointmentCancelled (future)
 * 3. Depends on: IAM module for user validation
 * 4. Does NOT access: Clinical, Lab, or Billing tables directly
 * 
 * DATABASE FEATURES:
 * - PostgreSQL tstzrange for time slots
 * - Exclusion constraint prevents overlapping slots
 * - Optimistic locking via version field
 * - Transaction support for booking operations
 */
@Module({
  imports: [PrismaModule],
  controllers: [SchedulingController],
  providers: [
    BookingService,
    SlotService,
    SlotAvailabilityService,
    WalkInManagerService,
  ],
  exports: [
    BookingService,
    SlotService,
    SlotAvailabilityService,
    WalkInManagerService,
  ],
})
export class SchedulingModule {}
