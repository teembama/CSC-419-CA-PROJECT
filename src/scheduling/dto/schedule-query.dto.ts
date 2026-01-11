import { IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum SlotStatus {
  AVAILABLE = 'Available',
  BOOKED = 'Booked',
  BLOCKED = 'Blocked',
}

/**
 * DTO for querying clinician schedules with date range and status filters
 * Used for GET /scheduling/clinicians/:id/schedule endpoint
 */
export class ScheduleQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;
}

/**
 * DTO for querying available slots
 * Used for GET /scheduling/slots/available endpoint
 */
export class AvailableSlotQueryDto {
  @IsUUID()
  clinicianId: string;

  @IsDateString()
  date: string;
}
