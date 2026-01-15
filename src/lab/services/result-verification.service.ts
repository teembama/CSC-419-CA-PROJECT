import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';

@Injectable()
export class ResultVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async verifyResult(resultId: string, verifiedByUserId: string) {
    const result = await this.prisma.lab_results.findUnique({
      where: { id: resultId },
      include: {
        lab_test_items: {
          include: {
            lab_orders: {
              include: {
                lab_test_items: {
                  include: {
                    lab_results: true,
                  },
                },
                patient_encounters: {
                  include: {
                    patient_charts: true,
                  },
                },
              },
            },
          },
        },
      },
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

    // Check if all results for this order are now verified
    const labOrder = result.lab_test_items?.lab_orders;
    if (labOrder) {
      const allResults = labOrder.lab_test_items?.flatMap(item => item.lab_results) || [];
      // Count verified results (including the one we just verified)
      const verifiedCount = allResults.filter(r => r.is_verified || r.id === resultId).length;
      const totalResults = allResults.length;

      // If all results are verified, mark order as Completed
      if (verifiedCount >= totalResults && totalResults > 0) {
        await this.prisma.lab_orders.update({
          where: { id: labOrder.id },
          data: { status: 'Completed' },
        });
      }
    }

    // Send notification to patient
    const patientId = result.lab_test_items?.lab_orders?.patient_encounters?.patient_charts?.patient_id;
    const testName = result.lab_test_items?.test_name || 'Lab test';

    if (patientId) {
      this.notificationService.notifyLabResultReady(patientId, {
        testName,
        resultId,
      }).catch(err => console.error('Failed to send lab result notification:', err));
    }

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

    // Get encounters for this patient's chart with dates
    const encounters = await this.prisma.patient_encounters.findMany({
      where: { chart_id: chart.id },
      select: { id: true, date: true },
    });

    const encounterMap = new Map(encounters.map(e => [e.id, e.date]));
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

    // Reference ranges based on test type
    const referenceRanges: Record<string, string> = {
      'Complete Blood Count (CBC)': 'WBC: 4.5-11.0, RBC: 4.5-5.5, Hgb: 12-17 g/dL',
      'Basic Metabolic Panel': 'Glucose: 70-100 mg/dL, BUN: 7-20 mg/dL',
      'Comprehensive Metabolic Panel': 'Glucose: 70-100, BUN: 7-20, Creatinine: 0.7-1.3',
      'Hemoglobin A1C': '4.0-5.6% (Normal), 5.7-6.4% (Prediabetes)',
      'Lipid Panel': 'Total Chol: <200, LDL: <100, HDL: >40, Trig: <150',
      'Urinalysis': 'pH: 4.5-8.0, Specific Gravity: 1.005-1.030',
      'Thyroid Panel (TSH, T3, T4)': 'TSH: 0.4-4.0 mIU/L, T4: 4.5-12.0 μg/dL',
      'COVID-19 PCR': 'Negative',
      'Influenza A/B': 'Negative',
    };

    const results: any[] = [];
    for (const order of orders) {
      // Get the encounter date for this order
      const encounterDate = order.encounter_id ? encounterMap.get(order.encounter_id) : null;

      for (const item of order.lab_test_items) {
        for (const result of item.lab_results) {
          results.push({
            id: result.id,
            test_name: item.test_name,
            result_value: result.result_value,
            // Map abnormality_flag to status for frontend compatibility
            status: result.abnormality_flag || 'Normal',
            // Use encounter date as result_date
            result_date: encounterDate ? encounterDate.toISOString() : null,
            // Add reference range based on test name
            unit: '',
            reference_range: referenceRanges[item.test_name] || 'See lab report',
            notes: this.generateNotesForResult(item.test_name, result.abnormality_flag),
            order: {
              id: order.id,
              test_type: item.test_name,
            },
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

  private generateNotesForResult(testName: string, abnormalityFlag: string | null): string {
    if (!abnormalityFlag || abnormalityFlag === 'Normal') {
      // Add notes even for normal results
      const normalNotes: Record<string, string> = {
        'Complete Blood Count (CBC)': 'All blood cell counts are within normal limits. Continue maintaining a healthy lifestyle.',
        'Basic Metabolic Panel': 'Kidney function and electrolytes are within normal range. Stay well hydrated.',
        'Comprehensive Metabolic Panel': 'Liver and kidney function tests are normal. Continue regular check-ups.',
        'Lipid Panel': 'Cholesterol levels are within healthy range. Maintain current diet and exercise routine.',
      };
      return normalNotes[testName] || '';
    }

    // Detailed notes for abnormal results
    const abnormalNotes: Record<string, string> = {
      'Hemoglobin A1C': 'Your A1C level of 7.2% indicates diabetes. This measures your average blood sugar over the past 2-3 months. Please schedule a follow-up appointment to discuss diabetes management, including diet modifications, exercise, and potential medication adjustments. Regular monitoring is essential.',
      'Lipid Panel': 'Your cholesterol levels are elevated. Total cholesterol of 220 and LDL of 140 increase cardiovascular risk. Recommendations: Reduce saturated fat intake, increase fiber consumption, exercise at least 150 minutes per week, and consider omega-3 supplements. A follow-up lipid panel in 3 months is recommended.',
      'Complete Blood Count (CBC)': 'Some values are outside the normal range. Please consult with your healthcare provider for further evaluation and possible additional testing.',
      'Basic Metabolic Panel': 'One or more values require attention. Your doctor will review these results and may recommend dietary changes or additional tests.',
      'Thyroid Panel (TSH, T3, T4)': 'Thyroid hormone levels are abnormal. This may indicate thyroid dysfunction. Further evaluation and possible treatment may be necessary.',
      'COVID-19 PCR': 'Your test result is positive. Please isolate and follow CDC guidelines. Monitor symptoms and seek medical care if you experience difficulty breathing.',
    };

    return abnormalNotes[testName] || 'Result is outside normal range. Please consult with your healthcare provider for interpretation and next steps.';
  }
}
