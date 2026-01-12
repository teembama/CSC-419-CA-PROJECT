import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateChartDto {
  @IsString()
  @IsOptional()
  bloodType?: string;

  @IsDateString()
  @IsOptional()
  dob?: string;
}