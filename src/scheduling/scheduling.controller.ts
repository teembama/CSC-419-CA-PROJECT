import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { SlotAvailabilityService } from './services/slot-availability.service';
import { BookingService } from './services/booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('scheduling')
export class SchedulingController {
  constructor(
    private readonly slotAvailability: SlotAvailabilityService,
    private readonly bookingService: BookingService,
  ) {}

  @Get('clinicians/:id/slots')
  getSlots(@Param('id') clinicianId: string) {
    return this.slotAvailability.getAvailableSlots(clinicianId);
  }

  @Post('bookings')
  createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingService.createBooking(dto);
  }
}

