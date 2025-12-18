import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateProductoDto {
  @ApiProperty({ example: 'LUK-6001', required: false })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({ example: 'Kit de embrague LUK para VW Gol' })
  @IsString()
  nombre: string;

  @ApiProperty({
    example: 'https://upload.wikimedia.org/luk.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  imagen?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  hay_stock: boolean;

  @ApiProperty({ example: 1 })
  @IsInt()
  marca: number;

  @ApiProperty({ example: 12345.99 })
  @Type(() => Number)
  precio: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  categoria: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  fabricante: number;
}
