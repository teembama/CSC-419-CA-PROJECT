import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Query, 
  ParseUUIDPipe 
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateLineItemDto } from './dto/create-line-item.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

@Controller('billing') // This makes all routes start with /billing
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * POST /billing/invoices
   * Purpose: Manually generate a new invoice
   */
  @Post('invoices')
  createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.billingService.createInvoice(createInvoiceDto);
  }

  /**
   * GET /billing/invoices
   * Purpose: Get a list of invoices (filtered by status or patientId if provided)
   */
  @Get('invoices')
  findAll(@Query() query: InvoiceQueryDto) {
    return this.billingService.findAllInvoices(query);
  }

  /**
   * GET /billing/invoices/:id
   * Purpose: Get details of a specific invoice including its line items
   */
  @Get('invoices/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.findOneInvoice(id);
  }

  /**
   * PATCH /billing/invoices/:id
   * Purpose: Update invoice status (e.g., mark as Paid or Overdue)
   */
  @Patch('invoices/:id')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.billingService.updateInvoiceStatus(id, updateInvoiceDto);
  }

  /**
   * POST /billing/invoices/:id/line-items
   * Purpose: Add a new billable item (consultation fee, lab fee, etc.) to an invoice
   */
  @Post('invoices/:id/line-items')
  addLineItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createLineItemDto: CreateLineItemDto,
  ) {
    return this.billingService.addLineItem(id, createLineItemDto);
  }

  // File a new insurance claim
  @Post('claims')
  createClaim(@Body() dto: CreateInsuranceClaimDto) {
    return this.billingService.createInsuranceClaim(dto);
  }

  // Update the status of a claim
  @Patch('claims/:id')
  updateClaimStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInsuranceClaimDto
  ) {
    return this.billingService.updateInsuranceClaimStatus(id, dto);
  }
}