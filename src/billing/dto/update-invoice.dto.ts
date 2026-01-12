import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateInvoiceDto {
  @IsNotEmpty()
  @IsIn(['Draft', 'Unpaid', 'Paid', 'Overdue']) // Enforces the PRD rules
  status!: string;
}