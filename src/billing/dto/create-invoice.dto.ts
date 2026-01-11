import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;

  @IsUUID()
  @IsOptional() // Optional because sometimes an invoice isn't tied to a specific encounter (e.g. general pharmacy)
  encounterId?: string;
}