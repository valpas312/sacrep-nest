import { Test, TestingModule } from '@nestjs/testing';
import { EquivalenciasService } from './equivalencias.service';

describe('EquivalenciasService', () => {
  let service: EquivalenciasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquivalenciasService],
    }).compile();

    service = module.get<EquivalenciasService>(EquivalenciasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
