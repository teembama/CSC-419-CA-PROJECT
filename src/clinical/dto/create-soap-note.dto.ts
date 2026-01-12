import { IsString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VitalsDto {
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @IsOptional()
  heartRate?: number;

  @IsOptional()
  temperature?: number;

  @IsOptional()
  weight?: number;

  @IsOptional()
  height?: number;

  @IsOptional()
  respiratoryRate?: number;

  @IsOptional()
  oxygenSaturation?: number;
}

export class CreateSoapNoteDto {
  @IsString()
  @IsOptional()
  subjective?: string;

  @IsString()
  @IsOptional()
  objective?: string;

  @IsString()
  @IsOptional()
  assessment?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @ValidateNested()
  @Type(() => VitalsDto)
  @IsOptional()
  vitals?: VitalsDto;
}