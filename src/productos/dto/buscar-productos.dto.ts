import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class BuscarProductosDto {
  @ApiPropertyOptional({ example: 'embrague', description: 'Texto a buscar' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID de la marca' })
  @Type(() => Number)
  @IsOptional()
  marca?: number;

  @ApiPropertyOptional({ example: 2, description: 'ID de la categoría' })
  @Type(() => Number)
  @IsOptional()
  categoria?: number;

  @ApiPropertyOptional({ example: 4, description: 'ID del fabricante' })
  @Type(() => Number)
  @IsOptional()
  fabricante?: number;

  @ApiPropertyOptional({
    example: 15,
    description: 'ID de vehículo compatible',
  })
  @Type(() => Number)
  @IsOptional()
  vehiculo?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Filtrar por stock disponible',
  })
  @Type(() => Boolean)
  @IsOptional()
  stock?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}
