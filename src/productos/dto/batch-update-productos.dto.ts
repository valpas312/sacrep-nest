import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';
import { IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchUpdateProductosDto extends PartialType(CreateProductoDto) {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    description: 'IDs de los productos a actualizar',
  })
  @IsArray()
  @Type(() => Number)
  ids: number[];
}
