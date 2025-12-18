import { Test, TestingModule } from '@nestjs/testing';
import { FabricantesController } from './fabricantes.controller';
import { FabricantesService } from './fabricantes.service';

describe('FabricantesController', () => {
  let controller: FabricantesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FabricantesController],
      providers: [FabricantesService],
    }).compile();

    controller = module.get<FabricantesController>(FabricantesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
