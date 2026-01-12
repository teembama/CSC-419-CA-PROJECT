import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ClinicalService } from './clinical.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { CreateSoapNoteDto } from './dto/create-soap-note.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CreateChartDto } from './dto/create-chart.dto';
import { UpdateChartDto } from './dto/update-chart.dto';
import { CreateAllergyDto } from './dto/create-allergy.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';

@Controller('clinical')
@UseGuards(JwtAuthGuard)
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

  // ============================================
  // PATIENT CHART ENDPOINTS
  // ============================================

  /**
   * GET /clinical/patients/:id/chart
   * Get patient chart with all related data
   */
  @Get('patients/:id/chart')
  async getPatientChart(@Param('id') id: string) {
    return this.clinicalService.getPatientChart(id);
  }

  /**
 * GET /clinical/patients
 * Search for patients by name, email, or phone
 */
@Get('patients')
async searchPatients(@Query('query') query: string) {
  return this.clinicalService.searchPatients(query);
}

/**
 * POST /clinical/patients/:id/chart
 * Create a patient chart
 */
@Post('patients/:id/chart')
@HttpCode(HttpStatus.CREATED)
async createChart(@Param('id') patientId: string, @Body() createChartDto: CreateChartDto) {
  return this.clinicalService.createChart(patientId, createChartDto);
}

/**
 * PATCH /clinical/patients/:id/chart
 * Update patient chart
 */
@Patch('patients/:id/chart')
async updateChart(@Param('id') id: string, @Body() updateChartDto: UpdateChartDto) {
  return this.clinicalService.updateChart(id, updateChartDto);
}

/**
 * GET /clinical/charts/:chartId/allergies
 * Get all allergies for a chart
 */
@Get('charts/:chartId/allergies')
async getAllergies(@Param('chartId') chartId: string) {
  return this.clinicalService.getAllergies(chartId);
}

/**
 * POST /clinical/charts/:chartId/allergies
 * Add an allergy to a chart
 */
@Post('charts/:chartId/allergies')
@HttpCode(HttpStatus.CREATED)
async addAllergy(@Param('chartId') chartId: string, @Body() createAllergyDto: CreateAllergyDto) {
  return this.clinicalService.addAllergy(chartId, createAllergyDto);
}

/**
 * DELETE /clinical/allergies/:allergyId
 * Remove an allergy
 */
@Delete('allergies/:allergyId')
async removeAllergy(@Param('allergyId') allergyId: string) {
  return this.clinicalService.removeAllergy(allergyId);
}

/**
 * GET /clinical/charts/:chartId/encounters
 * Get all encounters for a chart
 */
@Get('charts/:chartId/encounters')
async getChartEncounters(@Param('chartId') chartId: string) {
  return this.clinicalService.getChartEncounters(chartId);
}

/**
 * GET /clinical/charts/:chartId/prescriptions
 * Get all prescriptions for a chart
 */
@Get('charts/:chartId/prescriptions')
async getChartPrescriptions(@Param('chartId') chartId: string) {
  return this.clinicalService.getChartPrescriptions(chartId);
}

  // ============================================
  // ENCOUNTER ENDPOINTS
  // ============================================

  /**
   * POST /clinical/encounters
   * Create a new patient encounter
   */
  @Post('encounters')
  @HttpCode(HttpStatus.CREATED)
  async createEncounter(@Body() createEncounterDto: CreateEncounterDto) {
    return this.clinicalService.createEncounter(createEncounterDto);
  }

  /**
   * GET /clinical/encounters/:id
   * Get a specific encounter by ID
   */
  @Get('encounters/:id')
  async getEncounter(@Param('id') id: string) {
    return this.clinicalService.getEncounter(id);
  }

  /**
   * PUT /clinical/encounters/:id
   * Update encounter status
   */
  @Put('encounters/:id')
  async updateEncounter(
    @Param('id') id: string,
    @Body() updateEncounterDto: UpdateEncounterDto,
  ) {
    return this.clinicalService.updateEncounter(id, updateEncounterDto);
  }

  // ============================================
  // SOAP NOTES ENDPOINTS
  // ============================================

  /**
   * POST /clinical/encounters/:id/notes
   * Add or update SOAP notes for an encounter
   */
  @Post('encounters/:id/notes')
  /**
 * PATCH /clinical/encounters/:id/notes
 * Update SOAP notes for an encounter (same as POST, updates existing)
 */
@Patch('encounters/:id/notes')
async updateSoapNote(
  @Param('id') id: string,
  @Body() createSoapNoteDto: CreateSoapNoteDto,
) {
  return this.clinicalService.createSoapNote(id, createSoapNoteDto);
}
  @HttpCode(HttpStatus.CREATED)
  async createSoapNote(
    @Param('id') id: string,
    @Body() createSoapNoteDto: CreateSoapNoteDto,
  ) {
    return this.clinicalService.createSoapNote(id, createSoapNoteDto);
  }

  // ============================================
  // PRESCRIPTION ENDPOINTS
  // ============================================

  /**
   * POST /clinical/encounters/:id/prescriptions
   * Create a prescription for an encounter
   */
  @Post('encounters/:id/prescriptions')
  @HttpCode(HttpStatus.CREATED)
  async createPrescription(
    @Param('id') id: string,
    @Body() createPrescriptionDto: CreatePrescriptionDto,
  ) {
    return this.clinicalService.createPrescription(id, createPrescriptionDto);
  }

  /**
   * GET /clinical/encounters/:id/prescriptions
   * Get all prescriptions for an encounter
   */
  @Get('encounters/:id/prescriptions')
  async getEncounterPrescriptions(@Param('id') id: string) {
    return this.clinicalService.getEncounterPrescriptions(id);
  }
}