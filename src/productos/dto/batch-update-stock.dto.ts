import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class StockUpdateItemDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  hay_stock: boolean;
}

export class BatchUpdateStockDto {
  @ApiProperty({
    example: [
      { id: 10, hay_stock: false },
      { id: 11, hay_stock: true },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StockUpdateItemDto)
  items: StockUpdateItemDto[];
}
