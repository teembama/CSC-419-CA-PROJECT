import {
  Controller,
  Get,
  Patch,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import { UserQueryDto } from './dto/user.query.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================
  // DASHBOARD
  // ============================================

  /**
   * GET /admin/dashboard
   * Get admin dashboard statistics
   */
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * GET /admin/users
   * Get all users with pagination and filtering
   */
  @Get('users')
  async getUsers(@Query() query: UserQueryDto) {
    return this.adminService.getUsers(query);
  }

  /**
   * GET /admin/users/:id
   * Get a specific user by ID
   */
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  /**
   * PATCH /admin/users/:id/status
   * Activate or deactivate a user
   */
  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  /**
   * PATCH /admin/users/:id/role
   * Assign a role to a user
   */
  @Patch('users/:id/role')
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.adminService.assignRole(id, dto);
  }

  // ============================================
  // ROLE MANAGEMENT
  // ============================================

  /**
   * GET /admin/roles
   * Get all roles with user count
   */
  @Get('roles')
  async getRoles() {
    return this.adminService.getRoles();
  }

  // ============================================
  // PERMISSIONS MANAGEMENT
  // ============================================

  /**
   * GET /admin/permissions
   * Get all available permissions
   */
  @Get('permissions')
  async getAllPermissions() {
    return this.adminService.getAllPermissions();
  }

  /**
   * GET /admin/roles/:roleId/permissions
   * Get permissions for a specific role
   */
  @Get('roles/:roleId/permissions')
  async getRolePermissions(@Param('roleId', ParseIntPipe) roleId: number) {
    return this.adminService.getRolePermissions(roleId);
  }

  /**
   * PUT /admin/roles/:roleId/permissions
   * Update permissions for a specific role
   */
  @Put('roles/:roleId/permissions')
  async updateRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Body() body: { permissionIds: string[] },
  ) {
    return this.adminService.updateRolePermissions(roleId, body.permissionIds);
  }

  // ============================================
  // AUDIT LOGS
  // ============================================

  /**
   * GET /admin/audit-logs
   * Get audit logs with pagination and filtering
   */
  @Get('audit-logs')
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(query);
  }
}
