import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { BookingService } from './services/booking.service';
import { SlotAvailabilityService } from './services/slot-availability.service';

@Module({
  controllers: [SchedulingController],
  providers: [
    BookingService,
    SlotAvailabilityService,
  ],
})
export class SchedulingModule {}
