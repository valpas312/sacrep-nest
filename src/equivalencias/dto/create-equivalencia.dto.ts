import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class CreateEquivalenciaDto {
  @ApiProperty({ example: ['LUK-6001', 'VALEO-123', 'SACHS-998'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  codigos: string[];
}
