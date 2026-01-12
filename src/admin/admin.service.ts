import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserQueryDto } from './dto/user.query.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // USER MANAGEMENT
  // ============================================

  async getUsers(query: UserQueryDto) {
    const { search, roleId, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone_number: { contains: search } },
      ];
    }

    if (roleId !== undefined) {
      where.role_id = roleId;
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone_number: true,
          is_active: true,
          created_at: true,
          roles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        is_active: true,
        created_at: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.users.update({
      where: { id: userId },
      data: { is_active: dto.isActive },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        is_active: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async assignRole(userId: string, dto: AssignRoleDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.prisma.roles.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new BadRequestException('Invalid role ID');
    }

    return this.prisma.users.update({
      where: { id: userId },
      data: { role_id: dto.roleId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // ============================================
  // ROLE MANAGEMENT
  // ============================================

  async getRoles() {
    return this.prisma.roles.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { users: true },
        },
      },
    });
  }

  // ============================================
  // AUDIT LOGS
  // ============================================

  async getAuditLogs(query: AuditLogQueryDto) {
    const { tableName, action, userId, startDate, endDate, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (tableName) {
      where.table_name = tableName;
    }

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.changed_by = userId;
    }

    if (startDate || endDate) {
      where.changed_at = {};
      if (startDate) {
        where.changed_at.gte = startDate;
      }
      if (endDate) {
        where.changed_at.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.system_audit_logs.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          table_name: true,
          record_id: true,
          action: true,
          old_data: true,
          new_data: true,
          changed_at: true,
          users: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { changed_at: 'desc' },
      }),
      this.prisma.system_audit_logs.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // DASHBOARD STATS
  // ============================================

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalPatients,
      totalClinicians,
      totalAppointments,
      pendingAppointments,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.count({ where: { is_active: true } }),
      this.prisma.users.count({ where: { roles: { name: 'Patient' } } }),
      this.prisma.users.count({ where: { roles: { name: 'Clinician' } } }),
      this.prisma.appt_bookings.count(),
      this.prisma.appt_bookings.count({ where: { status: 'Scheduled' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      roles: {
        patients: totalPatients,
        clinicians: totalClinicians,
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
      },
    };
  }
}
