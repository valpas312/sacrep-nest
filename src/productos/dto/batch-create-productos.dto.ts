import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateProductoDto } from './create-producto.dto';

export class BatchCreateProductosDto {
  @ApiProperty({
    type: [CreateProductoDto],
    description: 'Lista de productos a crear',
    example: [
      {
        nombre: 'Producto 1',
        descripcion: 'Descripción del producto 1',
        precio: 100.0,
        fabricante: 1,
        categoria: 2,
        marca: 3,
      },
      {
        nombre: 'Producto 2',
        descripcion: 'Descripción del producto 2',
        precio: 150.0,
        fabricante: 1,
        categoria: 2,
        marca: 4,
      },
    ],
  })
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductoDto)
  productos: CreateProductoDto[];
}
