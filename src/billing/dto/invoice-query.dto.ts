import { IsOptional, IsUUID, IsIn, IsDateString } from 'class-validator';

export class InvoiceQueryDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsIn(['Draft', 'Unpaid', 'Paid', 'Overdue'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}