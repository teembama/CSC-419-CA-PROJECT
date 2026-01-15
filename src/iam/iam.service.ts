import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PatientRegisteredEvent } from './events/patient-registered.event';

@Injectable()
export class IamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Look up role_id based on role name (default to 'Patient')
    const roleName = data.role || 'Patient';
    const role = await this.prisma.roles.findUnique({
      where: { name: roleName },
    });

    try {
      const user = await this.prisma.users.create({
        data: {
          email: data.email,
          password_hash: hashedPassword,
          first_name: data.firstName,
          last_name: data.lastName,
          role_id: role?.id,
        },
        include: {
          roles: true,
        },
      });

      // Emit event for patient registration (creates patient chart)
      if (roleName === 'Patient') {
        this.eventEmitter.emit(
          'patient.registered',
          new PatientRegisteredEvent(user.id),
        );
      }

      return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        role: user.roles?.name,
        role_id: user.role_id,
      };
    } catch {
      throw new ConflictException('Email already exists');
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user) throw new UnauthorizedException();

    // Check if user is active
    if (user.is_active === false) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException();

    const accessToken = jwt.sign(
      { sub: user.id, role: user.roles?.name },
      process.env.JWT_SECRET!,
      { expiresIn: '3h' },
    );

    const refreshToken = jwt.sign(
      { sub: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    );

    // Log the login event to audit logs
    await this.prisma.system_audit_logs.create({
      data: {
        table_name: 'auth',
        record_id: user.id,
        action: 'LOGIN',
        old_data: Prisma.JsonNull,
        new_data: {
          email: user.email,
          role: user.roles?.name,
          login_time: new Date().toISOString(),
        },
        changed_by: user.id,
        changed_at: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        address: user.address,
        city: user.city,
        state: user.state,
        zip_code: user.zip_code,
        role: user.roles?.name,
        role_id: user.role_id,
      },
    };
  }

  async refreshToken(token: string) {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const accessToken = jwt.sign(
      { sub: payload.sub },
      process.env.JWT_SECRET!,
      { expiresIn: '3h' },
    );

    return { accessToken };
  }

  async getMe(userId: string) {
    return this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role_id: true,
        phone_number: true,
        address: true,
        city: true,
        state: true,
        zip_code: true,
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
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    },
  ) {
    const updateData: any = {};

    if (data.firstName) updateData.first_name = data.firstName;
    if (data.lastName) updateData.last_name = data.lastName;
    if (data.phoneNumber) updateData.phone_number = data.phoneNumber;
    if (data.email) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zip_code = data.zipCode;

    const user = await this.prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        address: true,
        city: true,
        state: true,
        zip_code: true,
        role_id: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password_hash: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });

    // Always return success message to prevent email enumeration
    if (!user) {
      return {
        message:
          'If an account exists with that email, you will receive password reset instructions.',
      };
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token for storage (we store hash, send plain token)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save the hashed token and expiry to the user record
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password_reset_token: hashedToken,
        password_reset_expires: expiresAt,
      },
    });

    // In production, you would send an email here with the reset link
    // For demo purposes, we log the token and include reset URL in response
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    console.log('===========================================');
    console.log('PASSWORD RESET REQUEST');
    console.log('Email:', email);
    console.log('Reset Token:', resetToken);
    console.log('Reset URL:', resetUrl);
    console.log('Expires:', expiresAt.toISOString());
    console.log('===========================================');

    // Log to audit
    await this.prisma.system_audit_logs.create({
      data: {
        table_name: 'auth',
        record_id: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        old_data: Prisma.JsonNull,
        new_data: {
          email: user.email,
          requested_at: new Date().toISOString(),
        },
        changed_by: user.id,
        changed_at: new Date(),
      },
    });

    return {
      message:
        'If an account exists with that email, you will receive password reset instructions.',
      // Include token in response for demo/testing purposes only
      // Remove this in production!
      _demo_token: resetToken,
      _demo_reset_url: resetUrl,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // Hash the provided token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token that hasn't expired
    const user = await this.prisma.users.findFirst({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired password reset token. Please request a new one.',
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
      },
    });

    // Log to audit
    await this.prisma.system_audit_logs.create({
      data: {
        table_name: 'auth',
        record_id: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        old_data: Prisma.JsonNull,
        new_data: {
          email: user.email,
          reset_at: new Date().toISOString(),
        },
        changed_by: user.id,
        changed_at: new Date(),
      },
    });

    return { message: 'Password has been reset successfully. You can now log in with your new password.' };
  }
}
