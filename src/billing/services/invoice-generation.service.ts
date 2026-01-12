import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoiceGenerationService {
  private readonly logger = new Logger(InvoiceGenerationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Automatically generates a Draft invoice when an encounter is closed.
   * This is called by the Event Listener.
   */
  async generateFromEncounter(encounterId: string, patientId: string) {
    this.logger.log(`Generating auto-invoice for Encounter: ${encounterId}`);

    // Check if an invoice already exists for this encounter to prevent double-billing
    const existingInvoice = await this.prisma.billing_invoices.findFirst({
      where: { encounter_id: encounterId },
    });

    if (existingInvoice) {
      this.logger.warn(`Invoice already exists for encounter ${encounterId}. Skipping.`);
      return existingInvoice;
    }

    // Create the automatic invoice
    return this.prisma.billing_invoices.create({
      data: {
        patient_id: patientId,
        encounter_id: encounterId,
        total_amount: 0,
        status: 'Draft',
      },
    });
  }
}