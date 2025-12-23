import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { BuscarProductosDto } from './dto/buscar-productos.dto';
import { BatchDeleteProductosDto } from './dto/batch-delete-productos.dto';
import { BatchCreateProductosDto } from './dto/batch-create-productos.dto';
// import { BatchUpdateProductosDto } from './dto/batch-update-productos.dto';

@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  @Post('batch')
  batchCreate(@Body() dto: BatchCreateProductosDto) {
    return this.productosService.batchCreate(dto);
  }

  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  @Get('destacados')
  destacados() {
    return this.productosService.destacados();
  }

  @Get('buscar')
  buscar(@Query() query: BuscarProductosDto) {
    return this.productosService.buscar(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(+id);
  }

  @Delete('batch')
  batchDelete(@Body() dto: BatchDeleteProductosDto) {
    return this.productosService.batchDelete(dto);
  }

  // @Patch('batch')
  // batchUpdate(@Body() dto: BatchUpdateProductosDto) {
  //   return this.productosService.batchUpdate(dto);
  // }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(+id, updateProductoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productosService.remove(+id);
  }
}
