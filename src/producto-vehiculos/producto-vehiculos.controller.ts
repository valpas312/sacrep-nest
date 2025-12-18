import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ProductoVehiculosService } from './producto-vehiculos.service';
import { CreateProductoVehiculoDto } from './dto/create-producto-vehiculo.dto';
import { UpdateProductoVehiculoDto } from './dto/update-producto-vehiculo.dto';

@ApiTags('producto-vehiculos')
@Controller('producto-vehiculos')
export class ProductoVehiculosController {
  constructor(private readonly pvService: ProductoVehiculosService) {}

  @Post()
  create(@Body() dto: CreateProductoVehiculoDto) {
    return this.pvService.create(dto);
  }

  @Get()
  findAll() {
    return this.pvService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pvService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoVehiculoDto,
  ) {
    return this.pvService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pvService.remove(id);
  }

  // ⭐ DELETE /producto-vehiculos/producto/:id → borrar todas las compatibilidades
  @Delete('producto/:producto_id')
  removeAllFromProduct(
    @Param('producto_id', ParseIntPipe) producto_id: number,
  ) {
    return this.pvService.removeAllFromProduct(producto_id);
  }

  // ⭐ GET /producto-vehiculos/producto/:id → obtener compatibilidades del producto
  @Get('producto/:producto_id')
  findByProduct(@Param('producto_id', ParseIntPipe) producto_id: number) {
    return this.pvService.findByProduct(producto_id);
  }
}
