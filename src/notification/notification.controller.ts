import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(@Request() req: any, @Query('limit') limit?: string) {
    const userId = req.user.userId;
    console.log('[NotificationController] findAll - req.user:', JSON.stringify(req.user));
    console.log('[NotificationController] findAll - userId:', userId);
    const notifications = await this.notificationService.findAllForUser(
      userId,
      limit ? parseInt(limit, 10) : 20,
    );
    const unreadCount = await this.notificationService.getUnreadCount(userId);

    return {
      notifications,
      unreadCount,
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.userId;
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.notificationService.markAsRead(id, userId);
    return { success: true };
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.userId;
    await this.notificationService.markAllAsRead(userId);
    return { success: true };
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    await this.notificationService.delete(id, userId);
    return { success: true };
  }

  @Post('request-records')
  async requestRecords(@Request() req: any, @Body() body: { email?: string }) {
    const userId = req.user.userId;

    // Get user details
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { email: true, first_name: true, last_name: true },
    });

    const targetEmail = body.email || user?.email;

    if (!targetEmail) {
      return { success: false, message: 'No email address provided' };
    }

    // Log the request (in production, this would send an actual email)
    console.log(`[Records Request] User ${user?.first_name} ${user?.last_name} (${userId}) requested medical records to be sent to: ${targetEmail}`);

    // Create a notification confirming the request
    await this.notificationService.create({
      userId,
      type: 'system',
      title: 'Medical Records Requested',
      message: `Your medical records request has been received. A copy will be sent to ${targetEmail} within 2-3 business days.`,
    });

    return {
      success: true,
      message: `Medical records request submitted. You will receive them at ${targetEmail} within 2-3 business days.`,
      email: targetEmail,
    };
  }
}
