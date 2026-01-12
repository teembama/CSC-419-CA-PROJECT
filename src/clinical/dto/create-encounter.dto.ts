import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';

export enum EncounterStatus {
  Open = 'Open',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export class CreateEncounterDto {
  @IsUUID()
  chartId!: string;

  @IsUUID()
  clinicianId!: string;

  @IsEnum(EncounterStatus)
  @IsOptional()
  status?: EncounterStatus;
}