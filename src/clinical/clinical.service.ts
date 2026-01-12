import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { CreateSoapNoteDto } from './dto/create-soap-note.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { EncounterClosedEvent } from './events';
import { CreateChartDto } from './dto/create-chart.dto';
import { UpdateChartDto } from './dto/update-chart.dto';
import { CreateAllergyDto } from './dto/create-allergy.dto';

@Injectable()
export class ClinicalService {
  constructor(private readonly prisma: PrismaService,private readonly eventEmitter: EventEmitter2,) {}

  // ============================================
  // PATIENT CHART OPERATIONS
  // ============================================

  /**
   * Get patient chart with all related data
   */
  async getPatientChart(patientId: string) {
    const chart = await this.prisma.patient_charts.findUnique({
      where: { patient_id: patientId },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
          },
        },
        patient_allergies: true,
        patient_encounters: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
            patient_notes_soap: true,
            patient_prescriptions: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!chart) {
      throw new NotFoundException(`Patient chart not found for patient ID: ${patientId}`);
    }

    return chart;
  }

  /**
 * Search patients by name, email, or phone
 */
async searchPatients(query: string) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();

  const patients = await this.prisma.users.findMany({
    where: {
      AND: [
        {
          roles: {
            name: 'Patient',
          },
        },
        {
          OR: [
            {
              first_name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              last_name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              phone_number: {
                contains: searchTerm,
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone_number: true,
      patient_charts: {
        select: {
          id: true,
          blood_type: true,
          dob: true,
        },
      },
    },
    take: 20, // Limit results
  });

  return patients;
}

/**
 * Create a new patient chart
 */
async createChart(patientId: string, createChartDto: CreateChartDto) {
  const { bloodType, dob } = createChartDto;

  // Check if patient exists
  const patient = await this.prisma.users.findUnique({
    where: { id: patientId },
    include: { roles: true },
  });

  if (!patient) {
    throw new NotFoundException(`Patient not found with ID: ${patientId}`);
  }

  if (patient.roles?.name !== 'Patient') {
    throw new BadRequestException('User is not a patient');
  }

  // Check if chart already exists
  const existingChart = await this.prisma.patient_charts.findUnique({
    where: { patient_id: patientId },
  });

  if (existingChart) {
    throw new BadRequestException('Chart already exists for this patient');
  }

  // Create chart
  const chart = await this.prisma.patient_charts.create({
    data: {
      patient_id: patientId,
      blood_type: bloodType,
      dob: new Date(dob),
    },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });

  return chart;
}

/**
 * Update patient chart
 */
async updateChart(patientId: string, updateChartDto: UpdateChartDto) {
  const chart = await this.prisma.patient_charts.findUnique({
    where: { patient_id: patientId },
  });

  if (!chart) {
    throw new NotFoundException(`Chart not found for patient ID: ${patientId}`);
  }

  const updatedChart = await this.prisma.patient_charts.update({
    where: { patient_id: patientId },
    data: {
      blood_type: updateChartDto.bloodType,
      dob: updateChartDto.dob ? new Date(updateChartDto.dob) : undefined,
    },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      patient_allergies: true,
    },
  });

  return updatedChart;
}

/**
 * Get chart by chart ID
 */
async getChartById(chartId: string) {
  const chart = await this.prisma.patient_charts.findUnique({
    where: { id: chartId },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
        },
      },
      patient_allergies: true,
      patient_encounters: {
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          patient_notes_soap: true,
          patient_prescriptions: true,
        },
        orderBy: {
          date: 'desc',
        },
      },
    },
  });

  if (!chart) {
    throw new NotFoundException(`Chart not found with ID: ${chartId}`);
  }

  return chart;
}

/**
 * Get all allergies for a chart
 */
async getAllergies(chartId: string) {
  const chart = await this.prisma.patient_charts.findUnique({
    where: { id: chartId },
  });

  if (!chart) {
    throw new NotFoundException(`Chart not found with ID: ${chartId}`);
  }

  const allergies = await this.prisma.patient_allergies.findMany({
    where: { chart_id: chartId },
    orderBy: {
      allergen_name: 'asc',
    },
  });

  return allergies;
}

/**
 * Add an allergy to a patient chart
 */
async addAllergy(chartId: string, createAllergyDto: CreateAllergyDto) {
  const chart = await this.prisma.patient_charts.findUnique({
    where: { id: chartId },
  });

  if (!chart) {
    throw new NotFoundException(`Chart not found with ID: ${chartId}`);
  }

  // Check if allergy already exists
  const existingAllergy = await this.prisma.patient_allergies.findFirst({
    where: {
      chart_id: chartId,
      allergen_name: {
        equals: createAllergyDto.allergenName,
        mode: 'insensitive',
      },
    },
  });

  if (existingAllergy) {
    throw new BadRequestException(
      `Allergy to ${createAllergyDto.allergenName} already exists for this patient`,
    );
  }

  const allergy = await this.prisma.patient_allergies.create({
    data: {
      chart_id: chartId,
      allergen_name: createAllergyDto.allergenName,
      severity: createAllergyDto.severity || 'Moderate',
    },
  });

  return allergy;
}

/**
 * Remove an allergy from a patient chart
 */
async removeAllergy(allergyId: string) {
  const allergy = await this.prisma.patient_allergies.findUnique({
    where: { id: allergyId },
  });

  if (!allergy) {
    throw new NotFoundException(`Allergy not found with ID: ${allergyId}`);
  }

  await this.prisma.patient_allergies.delete({
    where: { id: allergyId },
  });

  return { message: 'Allergy removed successfully', id: allergyId };
}

/**
 * Get all encounters for a chart
 */
async getChartEncounters(chartId: string) {
  const chart = await this.prisma.patient_charts.findUnique({
    where: { id: chartId },
  });

  if (!chart) {
    throw new NotFoundException(`Chart not found with ID: ${chartId}`);
  }

  const encounters = await this.prisma.patient_encounters.findMany({
    where: { chart_id: chartId },
    include: {
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
      patient_notes_soap: true,
      patient_prescriptions: true,
    },
    orderBy: {
      date: 'desc',
    },
  });

  return encounters;
}

/**
 * Get all prescriptions for a chart
 */
async getChartPrescriptions(chartId: string) {
  const chart = await this.prisma.patient_charts.findUnique({
    where: { id: chartId },
  });

  if (!chart) {
    throw new NotFoundException(`Chart not found with ID: ${chartId}`);
  }

  const prescriptions = await this.prisma.patient_prescriptions.findMany({
    where: {
      patient_encounters: {
        chart_id: chartId,
      },
    },
    include: {
      patient_encounters: {
        select: {
          id: true,
          date: true,
          status: true,
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      patient_encounters: {
        date: 'desc',
      },
    },
  });

  return prescriptions;
}

  // ============================================
  // ENCOUNTER OPERATIONS
  // ============================================

  /**
   * Create a new patient encounter
   */
  async createEncounter(createEncounterDto: CreateEncounterDto) {
    const { chartId, clinicianId, status } = createEncounterDto;

    // Verify chart exists
    const chartExists = await this.prisma.patient_charts.findUnique({
      where: { id: chartId },
    });

    if (!chartExists) {
      throw new NotFoundException(`Chart not found with ID: ${chartId}`);
    }

    // Verify clinician exists and has clinician role
    const clinician = await this.prisma.users.findUnique({
      where: { id: clinicianId },
      include: { roles: true },
    });

    if (!clinician) {
      throw new NotFoundException(`Clinician not found with ID: ${clinicianId}`);
    }

    if (clinician.roles?.name !== 'Clinician') {
      throw new ForbiddenException('User is not a clinician');
    }

    // Create encounter
    const encounter = await this.prisma.patient_encounters.create({
      data: {
        chart_id: chartId,
        clinician_id: clinicianId,
        status: status || 'Open',
      },
      include: {
        patient_charts: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    return encounter;
  }

  /**
   * Get a specific encounter by ID
   */
  async getEncounter(encounterId: string) {
    const encounter = await this.prisma.patient_encounters.findUnique({
      where: { id: encounterId },
      include: {
        patient_charts: {
          include: {
            users: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
            patient_allergies: true,
          },
        },
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        patient_notes_soap: true,
        patient_prescriptions: true,
        lab_orders: {
          include: {
            lab_test_items: {
              include: {
                lab_results: true,
              },
            },
          },
        },
      },
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter not found with ID: ${encounterId}`);
    }

    return encounter;
  }

  /**
   * Update encounter status
   */
  /**
 * Update encounter status
 * Emits EncounterClosedEvent when status changes to "Completed"
 */
async updateEncounter(encounterId: string, updateEncounterDto: UpdateEncounterDto) {
  const encounter = await this.prisma.patient_encounters.findUnique({
    where: { id: encounterId },
    include: {
      patient_charts: {
        select: {
          id: true,
          patient_id: true,
        },
      },
    },
  });

  if (!encounter) {
    throw new NotFoundException(`Encounter not found with ID: ${encounterId}`);
  }

  const updatedEncounter = await this.prisma.patient_encounters.update({
    where: { id: encounterId },
    data: {
      status: updateEncounterDto.status,
    },
    include: {
      patient_charts: {
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      },
      users: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });

  // Emit event when encounter is closed/completed
  if (updateEncounterDto.status === 'Completed' && encounter.status !== 'Completed') {
    const event = new EncounterClosedEvent(
      updatedEncounter.id,
      updatedEncounter.patient_charts?.patient_id || encounter.patient_charts?.patient_id || '',
      updatedEncounter.clinician_id || '',
      updatedEncounter.chart_id || '',
      new Date(),
    );

    this.eventEmitter.emit('encounter.closed', event);
    
    // Log for debugging
    console.log(`[ClinicalService] EncounterClosedEvent emitted for encounter ${updatedEncounter.id}`);
  }

  return updatedEncounter;
}

  // ============================================
  // SOAP NOTES OPERATIONS
  // ============================================

  /**
   * Add or update SOAP notes to an encounter
   */
  async createSoapNote(encounterId: string, createSoapNoteDto: CreateSoapNoteDto) {
    const encounter = await this.prisma.patient_encounters.findUnique({
      where: { id: encounterId },
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter not found with ID: ${encounterId}`);
    }

    if (encounter.status === 'Cancelled') {
      throw new BadRequestException('Cannot add notes to a cancelled encounter');
    }

    // Check if SOAP note already exists for this encounter
    const existingNote = await this.prisma.patient_notes_soap.findFirst({
      where: { encounter_id: encounterId },
    });

    if (existingNote) {
      // Update existing note
      const updatedNote = await this.prisma.patient_notes_soap.update({
        where: { id: existingNote.id },
        data: {
          subjective: createSoapNoteDto.subjective,
          objective: createSoapNoteDto.objective,
          assessment: createSoapNoteDto.assessment,
          plan: createSoapNoteDto.plan,
          vitals: createSoapNoteDto.vitals as any,
        },
      });
      return updatedNote;
    }

    // Create new note
    const soapNote = await this.prisma.patient_notes_soap.create({
      data: {
        encounter_id: encounterId,
        subjective: createSoapNoteDto.subjective,
        objective: createSoapNoteDto.objective,
        assessment: createSoapNoteDto.assessment,
        plan: createSoapNoteDto.plan,
        vitals: createSoapNoteDto.vitals as any,
      },
    });

    return soapNote;
  }

  // ============================================
  // PRESCRIPTION OPERATIONS
  // ============================================

  /**
   * Create a prescription for an encounter with allergy checking
   */
  async createPrescription(encounterId: string, createPrescriptionDto: CreatePrescriptionDto) {
    const encounter = await this.prisma.patient_encounters.findUnique({
      where: { id: encounterId },
      include: {
        patient_charts: {
          include: {
            patient_allergies: true,
          },
        },
      },
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter not found with ID: ${encounterId}`);
    }

    if (encounter.status === 'Cancelled') {
      throw new BadRequestException('Cannot add prescription to a cancelled encounter');
    }

    // Check for allergies
    const allergies = encounter.patient_charts?.patient_allergies || [];
    const medicationLower = createPrescriptionDto.medicationName.toLowerCase();

    for (const allergy of allergies) {
      if (
        allergy.allergen_name.toLowerCase().includes(medicationLower) ||
        medicationLower.includes(allergy.allergen_name.toLowerCase())
      ) {
        throw new BadRequestException(
          `ALLERGY ALERT: Patient is allergic to ${allergy.allergen_name} (${allergy.severity}). Cannot prescribe ${createPrescriptionDto.medicationName}.`,
        );
      }
    }

    // Create prescription
    const prescription = await this.prisma.patient_prescriptions.create({
      data: {
        encounter_id: encounterId,
        medication_name: createPrescriptionDto.medicationName,
        dosage: createPrescriptionDto.dosage,
        frequency: createPrescriptionDto.frequency,
        duration: createPrescriptionDto.duration,
      },
    });

    return prescription;
  }

  /**
   * Get all prescriptions for an encounter
   */
  async getEncounterPrescriptions(encounterId: string) {
    const encounter = await this.prisma.patient_encounters.findUnique({
      where: { id: encounterId },
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter not found with ID: ${encounterId}`);
    }

    const prescriptions = await this.prisma.patient_prescriptions.findMany({
      where: { encounter_id: encounterId },
    });

    return prescriptions;
  }
}