import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateGrupoCodigosDto {
  @ApiProperty({ example: ['LUK-6001', 'VALEO-123'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  add: string[];

  @ApiProperty({ example: ['SACHS-998'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}
