import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum AllergySeverity {
  Mild = 'Mild',
  Moderate = 'Moderate',
  Severe = 'Severe',
}

export class CreateAllergyDto {
  @IsString()
  allergenName!: string;

  @IsEnum(AllergySeverity)
  @IsOptional()
  severity?: AllergySeverity;
}