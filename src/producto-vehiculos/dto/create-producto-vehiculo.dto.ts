import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductoVehiculoDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  producto_id: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  vehiculo_id: number;
}
