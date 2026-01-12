import { IsEnum, IsOptional } from 'class-validator';
import { EncounterStatus } from './create-encounter.dto';

export class UpdateEncounterDto {
  @IsOptional()
  @IsEnum(EncounterStatus)
  status?: EncounterStatus;
}