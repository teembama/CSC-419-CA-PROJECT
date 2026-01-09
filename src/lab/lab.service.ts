import { Injectable } from '@nestjs/common';

@Injectable()
export class LabService {
  async getOrder(orderId: string) {
    return {
      orderId,
      status: 'Pending',
    };
  }
}
