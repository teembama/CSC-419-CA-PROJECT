import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalController } from './clinical.controller';

describe('ClinicalController', () => {
  let controller: ClinicalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalController],
    }).compile();

    controller = module.get<ClinicalController>(ClinicalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
