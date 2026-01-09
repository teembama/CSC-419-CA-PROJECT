import { Controller, Post, Body } from '@nestjs/common';
import { IamService } from './iam.service';

@Controller('auth')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Post('login')
  login(@Body() body: any) {
    return this.iamService.login(body);
  }
}


