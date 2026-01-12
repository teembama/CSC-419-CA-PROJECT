import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { LabOrderService } from './services/lab-order.service';
import { LabTestItemService } from './services/lab-test-item.service';
import { LabResultService } from './services/lab-result.service';
import { ResultVerificationService } from './services/result-verification.service';
import { CreateLabOrderDto, LabOrderPriority } from './dto/create-lab-order.dto';
import { CreateTestItemDto } from './dto/create-test-item.dto';
import { UpdateOrderStatusDto, LabOrderStatus } from './dto/update-order-status.dto';
import { UploadResultDto } from './dto/upload-result.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import { CurrentUser } from '../iam/decorators/current-user.decorator';

@Controller('lab')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabController {
  constructor(
    private readonly labOrderService: LabOrderService,
    private readonly labTestItemService: LabTestItemService,
    private readonly labResultService: LabResultService,
    private readonly resultVerificationService: ResultVerificationService,
  ) {}

  // ==================== LAB ORDERS ====================

  /**
   * POST /lab/orders
   * Create a new lab order for an encounter
   * Roles: Clinician
   */
  @Post('orders')
  @Roles('Clinician')
  createOrder(@Body() dto: CreateLabOrderDto) {
    return this.labOrderService.createOrder(dto);
  }

  /**
   * GET /lab/orders
   * Get all lab orders with optional filters
   * Roles: Clinician, Lab Technician
   */
  @Get('orders')
  @Roles('Clinician', 'LabTechnician')
  getOrders(
    @Query('status') status?: LabOrderStatus,
    @Query('encounterId') encounterId?: string,
    @Query('priority') priority?: LabOrderPriority,
  ) {
    return this.labOrderService.getOrders({ status, encounterId, priority });
  }

  /**
   * GET /lab/orders/:id
   * Get a single lab order with test items and results
   * Roles: Clinician, Lab Technician
   */
  @Get('orders/:id')
  @Roles('Clinician', 'LabTechnician')
  getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.labOrderService.getOrderById(id);
  }

  /**
   * PATCH /lab/orders/:id/status
   * Update lab order status
   * Roles: Lab Technician
   */
  @Patch('orders/:id/status')
  @Roles('LabTechnician')
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.labOrderService.updateStatus(id, dto);
  }

  /**
   * GET /lab/charts/:chartId/orders
   * Get all lab orders for a patient chart
   * Roles: Clinician, Lab Technician
   */
  @Get('charts/:chartId/orders')
  @Roles('Clinician', 'LabTechnician')
  getOrdersByChart(@Param('chartId', ParseUUIDPipe) chartId: string) {
    return this.labOrderService.getOrdersByChartId(chartId);
  }

  // ==================== TEST ITEMS ====================

  /**
   * POST /lab/orders/:orderId/test-items
   * Add a test item to a lab order
   * Roles: Clinician
   */
  @Post('orders/:orderId/test-items')
  @Roles('Clinician')
  addTestItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateTestItemDto,
  ) {
    // Ensure orderId in DTO matches param
    dto.orderId = orderId;
    return this.labTestItemService.addTestItem(dto);
  }

  /**
   * GET /lab/orders/:orderId/test-items
   * Get all test items for a lab order
   * Roles: Clinician, Lab Technician
   */
  @Get('orders/:orderId/test-items')
  @Roles('Clinician', 'LabTechnician')
  getTestItems(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.labTestItemService.getTestItemsByOrderId(orderId);
  }

  /**
   * GET /lab/test-items/:id
   * Get a single test item by ID
   * Roles: Clinician, Lab Technician
   */
  @Get('test-items/:id')
  @Roles('Clinician', 'LabTechnician')
  getTestItemById(@Param('id', ParseUUIDPipe) id: string) {
    return this.labTestItemService.getTestItemById(id);
  }

  /**
   * DELETE /lab/test-items/:id
   * Remove a test item from an order
   * Roles: Clinician
   */
  @Delete('test-items/:id')
  @Roles('Clinician')
  removeTestItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.labTestItemService.removeTestItem(id);
  }

  // ==================== LAB RESULTS ====================

  /**
   * POST /lab/test-items/:testItemId/results
   * Upload a result for a test item
   * Roles: Lab Technician
   */
  @Post('test-items/:testItemId/results')
  @Roles('LabTechnician')
  uploadResult(
    @Param('testItemId', ParseUUIDPipe) testItemId: string,
    @Body() dto: UploadResultDto,
  ) {
    // Ensure testItemId in DTO matches param
    dto.testItemId = testItemId;
    return this.labResultService.uploadResult(dto);
  }

  /**
   * GET /lab/results/:id
   * Get a specific lab result by ID
   * Roles: Clinician, Lab Technician
   */
  @Get('results/:id')
  @Roles('Clinician', 'LabTechnician')
  getResultById(@Param('id', ParseUUIDPipe) id: string) {
    return this.labResultService.getResultById(id);
  }

  /**
   * GET /lab/orders/:orderId/results
   * Get all results for a specific order
   * Roles: Clinician, Lab Technician
   */
  @Get('orders/:orderId/results')
  @Roles('Clinician', 'LabTechnician')
  getResultsByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.labResultService.getResultsByOrderId(orderId);
  }

  /**
   * GET /lab/charts/:chartId/results
   * Get all lab results for a patient chart
   * For patients: only returns verified results
   * For clinicians: returns all results
   * Roles: Patient, Clinician
   */
  @Get('charts/:chartId/results')
  @Roles('Patient', 'Clinician')
  getResultsByChart(
    @Param('chartId', ParseUUIDPipe) chartId: string,
    @CurrentUser() user: any,
  ) {
    // Clinicians can see all results, patients only see verified
    const includeUnverified = user?.roles?.name === 'Clinician';
    return this.labResultService.getResultsByChartId(chartId, includeUnverified);
  }

  // ==================== RESULT VERIFICATION ====================

  /**
   * PATCH /lab/results/:id/verify
   * Verify a lab result (marks it as reviewed by clinician)
   * Roles: Clinician
   */
  @Patch('results/:id/verify')
  @Roles('Clinician')
  verifyResult(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.resultVerificationService.verifyResult(id, user.id);
  }

  /**
   * GET /lab/results/unverified
   * Get all unverified results (for clinician review queue)
   * Roles: Clinician
   */
  @Get('results/unverified')
  @Roles('Clinician')
  getUnverifiedResults(@CurrentUser() user: any) {
    return this.resultVerificationService.getUnverifiedResults(user.id);
  }

  /**
   * GET /lab/patients/:patientId/results
   * Get verified results for a specific patient (patient-facing endpoint)
   * Roles: Patient
   */
  @Get('patients/:patientId/results')
  @Roles('Patient')
  getPatientResults(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.resultVerificationService.getVerifiedResultsForPatient(patientId);
  }

  /**
   * GET /lab/stats
   * Get verification statistics (admin dashboard)
   * Roles: Admin, Clinician
   */
  @Get('stats')
  @Roles('Admin', 'Clinician')
  getStats() {
    return this.resultVerificationService.getVerificationStats();
  }
}
