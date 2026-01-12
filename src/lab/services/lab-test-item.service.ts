import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestItemDto } from '../dto/create-test-item.dto';

@Injectable()
export class LabTestItemService {
  constructor(private readonly prisma: PrismaService) {}

  async addTestItem(dto: CreateTestItemDto) {
    if (!dto.orderId) {
      throw new NotFoundException('Order ID is required');
    }

    // Verify order exists
    const order = await this.prisma.lab_orders.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Lab order ${dto.orderId} not found`);
    }

    const testItem = await this.prisma.lab_test_items.create({
      data: {
        order_id: dto.orderId,
        test_name: dto.testName,
      },
    });

    return {
      id: testItem.id,
      orderId: testItem.order_id,
      testName: testItem.test_name,
      message: 'Test item added successfully',
    };
  }

  async getTestItemsByOrderId(orderId: string) {
    const testItems = await this.prisma.lab_test_items.findMany({
      where: { order_id: orderId },
      include: {
        lab_results: true,
      },
    });

    return testItems.map(item => ({
      id: item.id,
      orderId: item.order_id,
      testName: item.test_name,
      results: item.lab_results,
    }));
  }

  async getTestItemById(id: string) {
    const testItem = await this.prisma.lab_test_items.findUnique({
      where: { id },
      include: {
        lab_results: true,
        lab_orders: true,
      },
    });

    if (!testItem) {
      throw new NotFoundException(`Test item ${id} not found`);
    }

    return {
      id: testItem.id,
      orderId: testItem.order_id,
      testName: testItem.test_name,
      results: testItem.lab_results,
      order: testItem.lab_orders,
    };
  }

  async removeTestItem(id: string) {
    const testItem = await this.prisma.lab_test_items.findUnique({
      where: { id },
    });

    if (!testItem) {
      throw new NotFoundException(`Test item ${id} not found`);
    }

    await this.prisma.lab_test_items.delete({ where: { id } });

    return {
      message: 'Test item removed successfully',
      id,
    };
  }
}
