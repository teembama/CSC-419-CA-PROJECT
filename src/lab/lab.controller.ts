import { Controller, Get, Param } from '@nestjs/common';
import { LabService } from './lab.service';

@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Get('orders/:id')
  getLabOrder(@Param('id') id: string) {
    return this.labService.getOrder(id);
  }
}

