import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoriaDto {
  @ApiProperty()
  @IsString()
  nombre: string;
}
