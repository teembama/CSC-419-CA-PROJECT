import { IsUUID, IsEnum, IsOptional } from 'class-validator';

export enum LabOrderPriority {
  ROUTINE = 'Routine',
  URGENT = 'Urgent',
  STAT = 'STAT',
}

export class CreateLabOrderDto {
  @IsUUID()
  encounterId!: string;

  @IsOptional()
  @IsEnum(LabOrderPriority)
  priority?: LabOrderPriority;
}
