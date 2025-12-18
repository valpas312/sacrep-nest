import { Test, TestingModule } from '@nestjs/testing';
import { ProductoVehiculosController } from './producto-vehiculos.controller';
import { ProductoVehiculosService } from './producto-vehiculos.service';

describe('ProductoVehiculosController', () => {
  let controller: ProductoVehiculosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductoVehiculosController],
      providers: [ProductoVehiculosService],
    }).compile();

    controller = module.get<ProductoVehiculosController>(ProductoVehiculosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
