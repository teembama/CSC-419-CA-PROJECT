import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InvoiceGenerationService } from '../services/invoice-generation.service';

@Injectable()
export class BillingEventsListener {
  private readonly logger = new Logger(BillingEventsListener.name);

  constructor(
    private readonly invoiceGenService: InvoiceGenerationService,
  ) {}

  /**
   * This listens for the 'encounter.closed' event emitted by the Clinical Module.
   * Payload expected: { encounterId: string, patientId: string }
   */
  @OnEvent('encounter.closed')
  async handleEncounterClosedEvent(payload: { encounterId: string; patientId: string }) {
    this.logger.log(`Event Received: Encounter ${payload.encounterId} closed. Generating auto-invoice...`);

  try {
      await this.invoiceGenService.generateFromEncounter(
        payload.encounterId, 
        payload.patientId
      );
      this.logger.log(`Successfully generated auto-invoice for Encounter ${payload.encounterId}`);
    } catch (error: unknown) { // Define as unknown
      // Check if the error is a standard Error object
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      this.logger.error(`Failed to generate auto-invoice: ${errorMessage}`);
    }
  }
}