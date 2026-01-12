import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateChartDto {
  // patientId comes from URL parameter, not body - passed separately to service

  @IsString()
  @IsOptional()
  bloodType?: string;

  @IsDateString()
  dob!: string;
}