import { IsString, IsOptional } from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  medicationName!: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  duration?: string;
}