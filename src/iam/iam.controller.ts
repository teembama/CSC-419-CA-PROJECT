import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IamService } from './iam.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.iamService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.iamService.login(body.email, body.password);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return this.iamService.refreshToken(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.iamService.getMe(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: UpdateProfileDto) {
    return this.iamService.updateProfile(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() body: ChangePasswordDto) {
    return this.iamService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.iamService.forgotPassword(body.email);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.iamService.resetPassword(body.token, body.newPassword);
  }
}
