import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum BookingStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
  NO_SHOW = 'No-Show',
}

/**
 * DTO for updating existing bookings
 * Allows partial updates - all fields are optional
 * Used for PATCH /scheduling/bookings/:id endpoint
 */
export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  reasonForVisit?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
