import { Test, TestingModule } from '@nestjs/testing';
import { EquivalenciasController } from './equivalencias.controller';
import { EquivalenciasService } from './equivalencias.service';

describe('EquivalenciasController', () => {
  let controller: EquivalenciasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquivalenciasController],
      providers: [EquivalenciasService],
    }).compile();

    controller = module.get<EquivalenciasController>(EquivalenciasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
