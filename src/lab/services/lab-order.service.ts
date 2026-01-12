import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabOrderDto, LabOrderPriority } from '../dto/create-lab-order.dto';
import { UpdateOrderStatusDto, LabOrderStatus } from '../dto/update-order-status.dto';

@Injectable()
export class LabOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateLabOrderDto) {
    const order = await this.prisma.lab_orders.create({
      data: {
        encounter_id: dto.encounterId,
        status: 'Ordered',
        priority: dto.priority || 'Routine',
      },
    });

    return {
      id: order.id,
      encounterId: order.encounter_id,
      status: order.status,
      priority: order.priority,
    };
  }

  async getOrders(filters: { status?: LabOrderStatus; encounterId?: string; priority?: LabOrderPriority }) {
    const orders = await this.prisma.lab_orders.findMany({
      where: {
        status: filters.status,
        encounter_id: filters.encounterId,
        priority: filters.priority,
      },
      include: {
        lab_test_items: true,
      },
      orderBy: { id: 'desc' },
    });

    return orders.map(order => ({
      id: order.id,
      encounterId: order.encounter_id,
      status: order.status,
      priority: order.priority,
      testItems: order.lab_test_items,
    }));
  }

  async getOrderById(id: string) {
    const order = await this.prisma.lab_orders.findUnique({
      where: { id },
      include: {
        lab_test_items: {
          include: {
            lab_results: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Lab order ${id} not found`);
    }

    return {
      id: order.id,
      encounterId: order.encounter_id,
      status: order.status,
      priority: order.priority,
      testItems: order.lab_test_items.map(item => ({
        id: item.id,
        testName: item.test_name,
        results: item.lab_results,
      })),
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.lab_orders.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Lab order ${id} not found`);
    }

    const updated = await this.prisma.lab_orders.update({
      where: { id },
      data: { status: dto.status },
    });

    return {
      id: updated.id,
      status: updated.status,
      message: `Order status updated to ${dto.status}`,
    };
  }

  async getOrdersByChartId(chartId: string) {
    // Get encounters for this chart first, then find lab orders
    const encounters = await this.prisma.patient_encounters.findMany({
      where: { chart_id: chartId },
      select: { id: true },
    });

    const encounterIds = encounters.map(e => e.id);

    const orders = await this.prisma.lab_orders.findMany({
      where: {
        encounter_id: { in: encounterIds },
      },
      include: {
        lab_test_items: {
          include: {
            lab_results: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return orders.map(order => ({
      id: order.id,
      encounterId: order.encounter_id,
      status: order.status,
      priority: order.priority,
      testItems: order.lab_test_items.map(item => ({
        id: item.id,
        testName: item.test_name,
        results: item.lab_results,
      })),
    }));
  }
}
