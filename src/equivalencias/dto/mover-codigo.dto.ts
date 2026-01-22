import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class MoverCodigoDto {
  @ApiProperty({ example: 'LUK-6001' })
  @IsString()
  codigo: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  grupoDestinoId: number;
}
