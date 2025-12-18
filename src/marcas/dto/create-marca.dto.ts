import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateMarcaDto {
  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imagen?: string;
}
