import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for registering walk-in patients
 * Walk-ins bypass the normal slot availability check
 * Used by Staff/Receptionist roles
 * Used for POST /scheduling/walk-ins endpoint
 */
export class CreateWalkInDto {
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;

  @IsUUID()
  @IsNotEmpty()
  clinicianId!: string;

  @IsString()
  @IsNotEmpty()
  reasonForVisit!: string;
}
