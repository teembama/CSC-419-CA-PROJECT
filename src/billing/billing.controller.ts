import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateLineItemDto } from './dto/create-line-item.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * POST /billing/invoices
   * Create a new invoice
   * Roles: Staff, Admin
   */
  @Post('invoices')
  @Roles('Staff', 'Admin')
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.billingService.createInvoice(dto);
  }

  /**
   * GET /billing/invoices
   * Get all invoices with optional filters
   * Roles: Staff, Admin
   */
  @Get('invoices')
  @Roles('Staff', 'Admin')
  findAll(@Query() query: InvoiceQueryDto) {
    return this.billingService.findAllInvoices(query);
  }

  /**
   * GET /billing/patients/:id/invoices
   * Get all invoices for a specific patient
   * Roles: Patient (own), Staff, Admin
   */
  @Get('patients/:id/invoices')
  @Roles('Patient', 'Staff', 'Admin')
  findPatientInvoices(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.findPatientInvoices(id);
  }

  /**
   * GET /billing/invoices/:id
   * Get a single invoice by ID
   * Roles: Patient (own), Staff, Admin
   */
  @Get('invoices/:id')
  @Roles('Patient', 'Staff', 'Admin')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.findOneInvoice(id);
  }

  /**
   * PATCH /billing/invoices/:id
   * Update invoice status (Draft -> Unpaid -> Paid/Overdue)
   * Roles: Staff, Admin
   */
  @Patch('invoices/:id')
  @Roles('Staff', 'Admin')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto
  ) {
    return this.billingService.updateInvoiceStatus(id, dto);
  }

  /**
   * POST /billing/invoices/:id/line-items
   * Add a line item to an invoice
   * Roles: Staff, Admin
   */
  @Post('invoices/:id/line-items')
  @Roles('Staff', 'Admin')
  addLineItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLineItemDto
  ) {
    return this.billingService.addLineItem(id, dto);
  }

  /**
   * DELETE /billing/line-items/:id
   * Delete a line item (automatically adjusts invoice total)
   * Roles: Staff, Admin
   */
  @Delete('line-items/:id')
  @Roles('Staff', 'Admin')
  deleteLineItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.deleteLineItem(id);
  }
}
