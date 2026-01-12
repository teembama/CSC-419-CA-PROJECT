import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadResultDto } from '../dto/upload-result.dto';

@Injectable()
export class LabResultService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadResult(dto: UploadResultDto) {
    if (!dto.testItemId) {
      throw new NotFoundException('Test item ID is required');
    }

    // Verify test item exists
    const testItem = await this.prisma.lab_test_items.findUnique({
      where: { id: dto.testItemId },
    });

    if (!testItem) {
      throw new NotFoundException(`Test item ${dto.testItemId} not found`);
    }

    const result = await this.prisma.lab_results.create({
      data: {
        test_item_id: dto.testItemId,
        result_value: dto.resultValue,
        abnormality_flag: dto.abnormalityFlag || 'Normal',
        file_url: dto.fileUrl || null,
        is_verified: false,
        verified_by: null,
      },
    });

    return {
      id: result.id,
      testItemId: result.test_item_id,
      resultValue: result.result_value,
      abnormalityFlag: result.abnormality_flag,
      fileUrl: result.file_url,
      isVerified: result.is_verified,
      message: 'Result uploaded successfully',
    };
  }

  async getResultById(id: string) {
    const result = await this.prisma.lab_results.findUnique({
      where: { id },
      include: {
        lab_test_items: {
          include: {
            lab_orders: true,
          },
        },
      },
    });

    if (!result) {
      throw new NotFoundException(`Lab result ${id} not found`);
    }

    return {
      id: result.id,
      testItemId: result.test_item_id,
      resultValue: result.result_value,
      abnormalityFlag: result.abnormality_flag,
      fileUrl: result.file_url,
      isVerified: result.is_verified,
      verifiedBy: result.verified_by,
      testItem: result.lab_test_items,
    };
  }

  async getResultsByOrderId(orderId: string) {
    const testItems = await this.prisma.lab_test_items.findMany({
      where: { order_id: orderId },
      include: {
        lab_results: true,
      },
    });

    return testItems.flatMap(item =>
      item.lab_results.map(result => ({
        id: result.id,
        testItemId: result.test_item_id,
        testName: item.test_name,
        resultValue: result.result_value,
        abnormalityFlag: result.abnormality_flag,
        isVerified: result.is_verified,
      })),
    );
  }

  async getResultsByChartId(chartId: string, includeUnverified: boolean = false) {
    // Get encounters for this chart first
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
            lab_results: {
              where: includeUnverified ? {} : { is_verified: true },
            },
          },
        },
      },
    });

    const results: any[] = [];
    for (const order of orders) {
      for (const item of order.lab_test_items) {
        for (const result of item.lab_results) {
          results.push({
            id: result.id,
            orderId: order.id,
            testName: item.test_name,
            resultValue: result.result_value,
            abnormalityFlag: result.abnormality_flag,
            isVerified: result.is_verified,
          });
        }
      }
    }

    return results;
  }
}
