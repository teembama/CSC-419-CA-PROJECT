import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateLineItemDto } from './dto/create-line-item.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async createInvoice(dto: CreateInvoiceDto) {
    return this.prisma.billing_invoices.create({
      data: {
        patient_id: dto.patientId,
        encounter_id: dto.encounterId || null,
        total_amount: 0,
        status: 'Draft',
      },
    });
  }

  async findPatientInvoices(patientId: string) {
    return this.prisma.billing_invoices.findMany({
      where: { patient_id: patientId },
      include: { billing_line_items: true },
    });
  }

  async findAllInvoices(query: InvoiceQueryDto) {
    return this.prisma.billing_invoices.findMany({
      where: {
        patient_id: query.patientId,
        status: query.status,
      },
      include: { billing_line_items: true },
    });
  }

  async findOneInvoice(id: string) {
    const inv = await this.prisma.billing_invoices.findUnique({
      where: { id },
      include: { billing_line_items: true },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async updateInvoiceStatus(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.billing_invoices.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.prisma.billing_invoices.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async addLineItem(invoiceId: string, dto: CreateLineItemDto) {
    const invoice = await this.prisma.billing_invoices.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.billing_line_items.create({
        data: {
          invoice_id: invoiceId,
          description: dto.description,
          cost: dto.cost
        },
      });
      await tx.billing_invoices.update({
        where: { id: invoiceId },
        data: { total_amount: { increment: dto.cost } },
      });
      return item;
    });
  }

  async deleteLineItem(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.billing_line_items.findUnique({ where: { id } });
      if (!item || !item.invoice_id) throw new NotFoundException('Line item not found');

      await tx.billing_invoices.update({
        where: { id: item.invoice_id },
        data: { total_amount: { decrement: item.cost } },
      });

      return tx.billing_line_items.delete({ where: { id } });
    });
  }

  // Legacy method for backwards compatibility
  async getInvoice(invoiceId: string) {
    return this.findOneInvoice(invoiceId);
  }
}
