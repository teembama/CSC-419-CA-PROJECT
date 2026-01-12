import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalService } from './clinical.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

// Mock PrismaClient
const mockPrismaClient = {
  patient_charts: {
    findUnique: jest.fn(),
  },
  patient_encounters: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  patient_notes_soap: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  patient_prescriptions: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  users: {
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn(),
};

describe('ClinicalService', () => {
  let service: ClinicalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicalService],
    }).compile();

    service = module.get<ClinicalService>(ClinicalService);
    
    // Replace the prisma instance with our mock
    (service as any).prisma = mockPrismaClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // PATIENT CHART TESTS
  // ============================================

  describe('getPatientChart', () => {
    it('should return patient chart when found', async () => {
      const mockChart = {
        id: 'chart-123',
        patient_id: 'patient-123',
        blood_type: 'O+',
        dob: new Date('1990-01-01'),
        users: {
          id: 'patient-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '1234567890',
        },
        patient_allergies: [],
        patient_encounters: [],
      };

      mockPrismaClient.patient_charts.findUnique.mockResolvedValue(mockChart);

      const result = await service.getPatientChart('patient-123');

      expect(result).toEqual(mockChart);
      expect(mockPrismaClient.patient_charts.findUnique).toHaveBeenCalledWith({
        where: { patient_id: 'patient-123' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when chart not found', async () => {
      mockPrismaClient.patient_charts.findUnique.mockResolvedValue(null);

      await expect(service.getPatientChart('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // ENCOUNTER TESTS
  // ============================================

  describe('createEncounter', () => {
    const createEncounterDto = {
      chartId: 'chart-123',
      clinicianId: 'clinician-123',
      status: 'Open' as const,
    };

    it('should create encounter successfully', async () => {
      const mockChart = { id: 'chart-123' };
      const mockClinician = {
        id: 'clinician-123',
        roles: { name: 'Clinician' },
      };
      const mockEncounter = {
        id: 'encounter-123',
        chart_id: 'chart-123',
        clinician_id: 'clinician-123',
        status: 'Open',
      };

      mockPrismaClient.patient_charts.findUnique.mockResolvedValue(mockChart);
      mockPrismaClient.users.findUnique.mockResolvedValue(mockClinician);
      mockPrismaClient.patient_encounters.create.mockResolvedValue(mockEncounter);

      const result = await service.createEncounter(createEncounterDto);

      expect(result).toEqual(mockEncounter);
      expect(mockPrismaClient.patient_encounters.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when chart not found', async () => {
      mockPrismaClient.patient_charts.findUnique.mockResolvedValue(null);

      await expect(service.createEncounter(createEncounterDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a clinician', async () => {
      const mockChart = { id: 'chart-123' };
      const mockUser = {
        id: 'user-123',
        roles: { name: 'Patient' },
      };

      mockPrismaClient.patient_charts.findUnique.mockResolvedValue(mockChart);
      mockPrismaClient.users.findUnique.mockResolvedValue(mockUser);

      await expect(service.createEncounter(createEncounterDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getEncounter', () => {
    it('should return encounter when found', async () => {
      const mockEncounter = {
        id: 'encounter-123',
        chart_id: 'chart-123',
        clinician_id: 'clinician-123',
        status: 'Open',
      };

      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(mockEncounter);

      const result = await service.getEncounter('encounter-123');

      expect(result).toEqual(mockEncounter);
    });

    it('should throw NotFoundException when encounter not found', async () => {
      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(null);

      await expect(service.getEncounter('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateEncounter', () => {
    it('should update encounter status', async () => {
      const mockEncounter = {
        id: 'encounter-123',
        status: 'Open',
      };
      const updatedEncounter = {
        ...mockEncounter,
        status: 'Completed',
      };

      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(mockEncounter);
      mockPrismaClient.patient_encounters.update.mockResolvedValue(updatedEncounter);

      const result = await service.updateEncounter('encounter-123', { status: 'Completed' });

      expect(result.status).toBe('Completed');
      expect(mockPrismaClient.patient_encounters.update).toHaveBeenCalled();
    });
  });

  // ============================================
  // SOAP NOTES TESTS
  // ============================================

  describe('createSoapNote', () => {
    const createSoapNoteDto = {
      subjective: 'Patient reports headache',
      objective: 'BP 120/80',
      assessment: 'Tension headache',
      plan: 'Rest and pain relief',
      vitals: {
        bloodPressure: '120/80',
        heartRate: 72,
      },
    };

    it('should create new SOAP note', async () => {
      const mockEncounter = {
        id: 'encounter-123',
        status: 'Open',
      };
      const mockNote = {
        id: 'note-123',
        encounter_id: 'encounter-123',
        ...createSoapNoteDto,
      };

      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(mockEncounter);
      mockPrismaClient.patient_notes_soap.findFirst.mockResolvedValue(null);
      mockPrismaClient.patient_notes_soap.create.mockResolvedValue(mockNote);

      const result = await service.createSoapNote('encounter-123', createSoapNoteDto);

      expect(result).toEqual(mockNote);
      expect(mockPrismaClient.patient_notes_soap.create).toHaveBeenCalled();
    });

    it('should update existing SOAP note', async () => {
      const mockEncounter = {
        id: 'encounter-123',
        status: 'Open',
      };
      const existingNote = {
        id: 'note-123',
        encounter_id: 'encounter-123',
      };
      const updatedNote = {
        ...existingNote,
        ...createSoapNoteDto,
      };

      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(mockEncounter);
      mockPrismaClient.patient_notes_soap.findFirst.mockResolvedValue(existingNote);
      mockPrismaClient.patient_notes_soap.update.mockResolvedValue(updatedNote);

      const result = await service.createSoapNote('encounter-123', createSoapNoteDto);

      expect(mockPrismaClient.patient_notes_soap.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException for cancelled encounter', async () => {
      const mockEncounter = {
        id: 'encounter-123',
        status: 'Cancelled',
      };

      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(mockEncounter);

      await expect(
        service.createSoapNote('encounter-123', createSoapNoteDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // PRESCRIPTION TESTS
  // ============================================

  describe('createPrescription', () => {
    const createPrescriptionDto = {
      medicationName: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'Every 6 hours',
      duration: '7 days',
    };

    it('should create prescription successfully', async () => {
      const mockEncounter = {
        id: 'encounter-123',
        status: 'Open',
        patient_charts: {
          patient_allergies: [],
        },
      };
      const mockPrescription = {
        id: 'prescription-123',
        encounter_id: 'encounter-123',
        ...createPrescriptionDto,
      };

      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(mockEncounter);
      mockPrismaClient.patient_prescriptions.create.mockResolvedValue(mockPrescription);

      const result = await service.createPrescription('encounter-123', createPrescriptionDto);

      expect(result).toEqual(mockPrescription);
      expect(mockPrismaClient.patient_prescriptions.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when patient is allergic to medication', async () => {
      const mockEncounter = {
        id: 'encounter-123',
        status: 'Open',
        patient_charts: {
          patient_allergies: [
            {
              allergen_name: 'Ibuprofen',
              severity: 'Severe',
            },
          ],
        },
      };

      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(mockEncounter);

      await expect(
        service.createPrescription('encounter-123', createPrescriptionDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaClient.patient_prescriptions.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for cancelled encounter', async () => {
      const mockEncounter = {
        id: 'encounter-123',
        status: 'Cancelled',
        patient_charts: {
          patient_allergies: [],
        },
      };

      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(mockEncounter);

      await expect(
        service.createPrescription('encounter-123', createPrescriptionDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEncounterPrescriptions', () => {
    it('should return all prescriptions for an encounter', async () => {
      const mockEncounter = { id: 'encounter-123' };
      const mockPrescriptions = [
        {
          id: 'prescription-1',
          medication_name: 'Ibuprofen',
        },
        {
          id: 'prescription-2',
          medication_name: 'Acetaminophen',
        },
      ];

      mockPrismaClient.patient_encounters.findUnique.mockResolvedValue(mockEncounter);
      mockPrismaClient.patient_prescriptions.findMany.mockResolvedValue(mockPrescriptions);

      const result = await service.getEncounterPrescriptions('encounter-123');

      expect(result).toEqual(mockPrescriptions);
      expect(result).toHaveLength(2);
    });
  });
});
