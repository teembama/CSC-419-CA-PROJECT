import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CreateLineItemDto } from './dto/create-line-item.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { CreateInsuranceClaimDto } from './dto/create-insurance-claim.dto';
import { UpdateInsuranceClaimDto } from './dto/update-insurance-claim.dto';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // --- INVOICE LOGIC ---

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

  async findAllInvoices(query: InvoiceQueryDto) {
    const { patientId, status } = query;
    return this.prisma.billing_invoices.findMany({
      where: {
        patient_id: patientId,
        status: status,
      },
      orderBy: { created_at: 'desc' } as any, 
    });
  }

  async findOneInvoice(id: string) {
    const invoice = await this.prisma.billing_invoices.findUnique({
      where: { id },
      include: {
        billing_line_items: true, // Includes the detailed charges
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async updateInvoiceStatus(id: string, dto: UpdateInvoiceDto) {
    return this.prisma.billing_invoices.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // --- LINE ITEM LOGIC (Financial Transaction) ---

  async addLineItem(invoiceId: string, dto: CreateLineItemDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the charge
      const item = await tx.billing_line_items.create({
        data: {
          invoice_id: invoiceId,
          description: dto.description,
          cost: dto.cost,
        },
      });

      // 2. Automatically update the Invoice total
      await tx.billing_invoices.update({
        where: { id: invoiceId },
        data: {
          total_amount: { increment: dto.cost },
        },
      });

      return item;
    });
  }

  // --- INSURANCE CLAIM LOGIC ---

  async createInsuranceClaim(dto: CreateInsuranceClaimDto) {
    return this.prisma.insurance_claims.create({
      data: {
        invoice_id: dto.invoiceId,
        provider_name: dto.providerName,
        policy_number: dto.policyNumber,
        group_number: dto.groupNumber,
        status: 'Submitted',
      },
    });
  }

  async updateInsuranceClaimStatus(id: string, dto: UpdateInsuranceClaimDto) {
    return this.prisma.insurance_claims.update({
      where: { id },
      data: {
        status: dto.status,
        remarks: dto.remarks,
      },
    });
  }

  async findInsuranceClaim(id: string) {
    const claim = await this.prisma.insurance_claims.findUnique({
      where: { id },
    });
    if (!claim) throw new NotFoundException(`Claim ${id} not found`);
    return claim;
  }
}