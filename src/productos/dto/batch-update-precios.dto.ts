import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdatePrecioBySkuItemDto {
  @ApiProperty({ example: 'LUK-6001' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  marca: number;

  @ApiProperty({ example: 125000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio: number;
}

export class BatchUpdatePreciosBySkuDto {
  @ApiProperty({
    type: [UpdatePrecioBySkuItemDto],
    example: [
      { sku: 'LUK-6001', marca: 1, precio: 125000 },
      { sku: '3DF7100', marca: 2, precio: 99000 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdatePrecioBySkuItemDto)
  items: UpdatePrecioBySkuItemDto[];
}
