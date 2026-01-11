import { IsIn, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateInsuranceClaimDto {
  @IsNotEmpty()
  @IsIn(['Submitted', 'Pending', 'Approved', 'Denied', 'Paid'])
  status!: string;

  @IsOptional()
  @IsString()
  remarks?: string; // e.g., "Denied: Policy expired" or "Approved: 80% coverage"
}