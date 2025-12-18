import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehiculoDto {
  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiProperty({ required: false, description: 'Año desde' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  desde?: number;

  @ApiProperty({ required: false, description: 'Año hasta' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  hasta?: number;

  @ApiProperty({ description: 'ID del fabricante perteneciente' })
  @Type(() => Number)
  @IsInt()
  fabricante_id: number;
}
