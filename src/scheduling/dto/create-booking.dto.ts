import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  patientId!: string;

  @IsUUID()
  clinicianId!: string;

  @IsString()
  startTime!: string; // ISO string

  @IsString()
  endTime!: string; // ISO string

  @IsOptional()
  @IsString()
  reasonForVisit?: string;

  @IsUUID()
  slotId!: string;

}
