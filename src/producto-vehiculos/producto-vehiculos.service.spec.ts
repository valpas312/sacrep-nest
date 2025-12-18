import { Test, TestingModule } from '@nestjs/testing';
import { ProductoVehiculosService } from './producto-vehiculos.service';

describe('ProductoVehiculosService', () => {
  let service: ProductoVehiculosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductoVehiculosService],
    }).compile();

    service = module.get<ProductoVehiculosService>(ProductoVehiculosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
