import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResultVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async verifyResult(resultId: string, verifiedByUserId: string) {
    const result = await this.prisma.lab_results.findUnique({
      where: { id: resultId },
    });

    if (!result) {
      throw new NotFoundException(`Lab result ${resultId} not found`);
    }

    const updated = await this.prisma.lab_results.update({
      where: { id: resultId },
      data: {
        is_verified: true,
        verified_by: verifiedByUserId,
      },
    });

    return {
      id: updated.id,
      isVerified: updated.is_verified,
      verifiedBy: updated.verified_by,
      message: 'Result verified successfully. Patient can now view this result.',
    };
  }

  async getUnverifiedResults(clinicianId: string) {
    const results = await this.prisma.lab_results.findMany({
      where: {
        is_verified: false,
      },
      include: {
        lab_test_items: {
          include: {
            lab_orders: {
              include: {
                patient_encounters: {
                  include: {
                    patient_charts: {
                      include: {
                        users: {
                          select: { id: true, first_name: true, last_name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return results.map(result => ({
      id: result.id,
      testName: result.lab_test_items?.test_name,
      resultValue: result.result_value,
      abnormalityFlag: result.abnormality_flag,
      patient: result.lab_test_items?.lab_orders?.patient_encounters?.patient_charts?.users,
      orderId: result.lab_test_items?.order_id,
    }));
  }

  async getVerifiedResultsForPatient(patientId: string) {
    // Get chart for this patient
    const chart = await this.prisma.patient_charts.findFirst({
      where: { patient_id: patientId },
    });

    if (!chart) {
      return [];
    }

    // Get encounters for this patient's chart
    const encounters = await this.prisma.patient_encounters.findMany({
      where: { chart_id: chart.id },
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
              where: { is_verified: true },
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
            testName: item.test_name,
            resultValue: result.result_value,
            abnormalityFlag: result.abnormality_flag,
            isVerified: true,
          });
        }
      }
    }

    return results;
  }

  async getVerificationStats() {
    const [total, verified, unverified] = await Promise.all([
      this.prisma.lab_results.count(),
      this.prisma.lab_results.count({ where: { is_verified: true } }),
      this.prisma.lab_results.count({ where: { is_verified: false } }),
    ]);

    return {
      totalResults: total,
      verifiedResults: verified,
      unverifiedResults: unverified,
      verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
    };
  }
}
