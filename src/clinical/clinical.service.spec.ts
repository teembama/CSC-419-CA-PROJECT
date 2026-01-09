import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalService } from './clinical.service';

describe('ClinicalService', () => {
  let service: ClinicalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicalService],
    }).compile();

    service = module.get<ClinicalService>(ClinicalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
