import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalController } from './clinical.controller';
import { PatientChartService } from './services/patient-chart.service';
import { EncounterService } from './services/encounter.service';
import { PrescriptionService } from './services/prescription.service';

describe('ClinicalController', () => {
  let controller: ClinicalController;
  let chartService: PatientChartService;
  let encounterService: EncounterService;
  let prescriptionService: PrescriptionService;

  const mockPatientChartService = {
    createChart: jest.fn(),
    getChartByPatientId: jest.fn(),
    getChartById: jest.fn(),
    updateChart: jest.fn(),
    searchPatients: jest.fn(),
    addAllergy: jest.fn(),
    getAllergies: jest.fn(),
    removeAllergy: jest.fn(),
  };

  const mockEncounterService = {
    createEncounter: jest.fn(),
    getEncounter: jest.fn(),
    updateEncounter: jest.fn(),
    getPatientEncounters: jest.fn(),
    addSoapNotes: jest.fn(),
    getSoapNotes: jest.fn(),
  };

  const mockPrescriptionService = {
    createPrescription: jest.fn(),
    getPatientPrescriptions: jest.fn(),
    getPrescription: jest.fn(),
    getEncounterPrescriptions: jest.fn(),
    checkMedicationSafety: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalController],
      providers: [
        {
          provide: PatientChartService,
          useValue: mockPatientChartService,
        },
        {
          provide: EncounterService,
          useValue: mockEncounterService,
        },
        {
          provide: PrescriptionService,
          useValue: mockPrescriptionService,
        },
      ],
    }).compile();

    controller = module.get<ClinicalController>(ClinicalController);
    chartService = module.get<PatientChartService>(PatientChartService);
    encounterService = module.get<EncounterService>(EncounterService);
    prescriptionService = module.get<PrescriptionService>(PrescriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createChart', () => {
    it('should create a patient chart', async () => {
      const userId = 'user-uuid';
      const dto = { bloodType: 'O+', dob: '1990-01-01' };
      const mockResult = { id: 'chart-uuid', ...dto };

      mockPatientChartService.createChart.mockResolvedValue(mockResult);

      const result = await controller.createChart(userId, dto);

      expect(result).toEqual(mockResult);
      expect(chartService.createChart).toHaveBeenCalledWith(userId, dto);
    });
  });

  describe('getPatientChart', () => {
    it('should return a patient chart', async () => {
      const patientId = 'patient-uuid';
      const mockChart = {
        id: 'chart-uuid',
        patient_id: patientId,
        blood_type: 'O+',
      };

      mockPatientChartService.getChartByPatientId.mockResolvedValue(mockChart);

      const result = await controller.getPatientChart(patientId);

      expect(result).toEqual(mockChart);
      expect(chartService.getChartByPatientId).toHaveBeenCalledWith(patientId);
    });
  });

  describe('searchPatients', () => {
    it('should return empty array for empty query', async () => {
      const result = await controller.searchPatients('');
      expect(result).toEqual([]);
    });

    it('should search patients with valid query', async () => {
      const query = 'John';
      const mockResults = [{ id: 'patient-1', first_name: 'John' }];

      mockPatientChartService.searchPatients.mockResolvedValue(mockResults);

      const result = await controller.searchPatients(query);

      expect(result).toEqual(mockResults);
      expect(chartService.searchPatients).toHaveBeenCalledWith(query);
    });
  });

  describe('addAllergy', () => {
    it('should add an allergy to a chart', async () => {
      const chartId = 'chart-uuid';
      const dto = { allergenName: 'Penicillin', severity: 'Severe' };
      const mockAllergy = { id: 'allergy-uuid', ...dto };

      mockPatientChartService.addAllergy.mockResolvedValue(mockAllergy);

      const result = await controller.addAllergy(chartId, dto);

      expect(result).toEqual(mockAllergy);
      expect(chartService.addAllergy).toHaveBeenCalledWith(chartId, dto);
    });
  });

  describe('createEncounter', () => {
    it('should create an encounter', async () => {
      const dto = { chartId: 'chart-uuid' };
      const mockEncounter = {
        id: 'encounter-uuid',
        chart_id: dto.chartId,
        status: 'Open',
      };

      mockEncounterService.createEncounter.mockResolvedValue(mockEncounter);

      const result = await controller.createEncounter(dto);

      expect(result).toEqual(mockEncounter);
      expect(encounterService.createEncounter).toHaveBeenCalled();
    });
  });

  describe('createPrescription', () => {
    it('should create a prescription', async () => {
      const encounterId = 'encounter-uuid';
      const dto = {
        medicationName: 'Ibuprofen',
        dosage: '400mg',
        frequency: 'Every 6 hours',
        duration: '7 days',
      };
      const mockPrescription = { id: 'prescription-uuid', ...dto };

      mockPrescriptionService.createPrescription.mockResolvedValue(
        mockPrescription,
      );

      const result = await controller.createPrescription(encounterId, dto);

      expect(result).toEqual(mockPrescription);
      expect(prescriptionService.createPrescription).toHaveBeenCalledWith(
        encounterId,
        dto,
      );
    });
  });

  describe('checkMedicationSafety', () => {
    it('should check medication safety', async () => {
      const chartId = 'chart-uuid';
      const body = { medicationName: 'Ibuprofen' };
      const mockResult = { hasWarnings: false, warnings: [] };

      mockPrescriptionService.checkMedicationSafety.mockResolvedValue(
        mockResult,
      );

      const result = await controller.checkMedicationSafety(chartId, body);

      expect(result).toEqual(mockResult);
      expect(prescriptionService.checkMedicationSafety).toHaveBeenCalledWith(
        chartId,
        body.medicationName,
      );
    });
  });
});