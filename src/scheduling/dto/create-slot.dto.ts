import { IsUUID, IsDateString, IsEnum, IsOptional, IsInt, Min, IsString } from 'class-validator';

export enum SlotStatus {
  AVAILABLE = 'Available',
  BOOKED = 'Booked',
  BLOCKED = 'Blocked',
}

/**
 * DTO for creating new availability slots
 * Used by clinicians to define their available time windows
 * Used for POST /scheduling/slots endpoint
 */
export class CreateSlotDto {
  @IsUUID()
  clinicianId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

/**
 * DTO for updating existing slots
 * Used for PATCH /scheduling/slots/:id endpoint
 */
export class UpdateSlotDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsEnum(SlotStatus)
  status?: SlotStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}

/**
 * DTO for blocking a slot
 * Used for POST /scheduling/slots/:id/block endpoint
 */
export class BlockSlotDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
