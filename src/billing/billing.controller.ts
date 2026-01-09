import { Controller, Get, Param } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices/:id')
  getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoice(id);
  }
}

