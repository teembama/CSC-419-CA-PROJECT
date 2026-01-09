import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingController } from './scheduling.controller';

describe('SchedulingController', () => {
  let controller: SchedulingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulingController],
    }).compile();

    controller = module.get<SchedulingController>(SchedulingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
