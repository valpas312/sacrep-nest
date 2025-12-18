import { PartialType } from '@nestjs/swagger';
import { CreateProductoVehiculoDto } from './create-producto-vehiculo.dto';

export class UpdateProductoVehiculoDto extends PartialType(CreateProductoVehiculoDto) {}
