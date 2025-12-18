import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchDeleteProductosDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'IDs de los productos a eliminar',
    type: [Number],
  })
  @IsArray()
  @Type(() => Number)
  ids: number[];
}
