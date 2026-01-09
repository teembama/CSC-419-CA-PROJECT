import { Injectable } from '@nestjs/common';

@Injectable()
export class BillingService {
  async getInvoice(invoiceId: string) {
    return { invoiceId, total: 0 };
  }
}
