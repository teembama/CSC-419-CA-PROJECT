import { IsEnum } from 'class-validator';

export enum LabOrderStatus {
  ORDERED = 'Ordered',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export class UpdateOrderStatusDto {
  @IsEnum(LabOrderStatus)
  status!: LabOrderStatus;
}
