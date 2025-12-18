import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFabricanteDto {
  @ApiProperty()
  @IsString()
  nombre: string;
}
