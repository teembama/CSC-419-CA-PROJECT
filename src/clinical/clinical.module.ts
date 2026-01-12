import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClinicalController } from './clinical.controller';
import { ClinicalService } from './clinical.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [ClinicalController],
  providers: [ClinicalService, PrismaService],
  exports: [ClinicalService, PrismaService],
})
export class ClinicalModule {}