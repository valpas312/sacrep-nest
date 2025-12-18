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

import { MarcasService } from './marcas.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';

@ApiTags('marcas')
@Controller('marcas')
export class MarcasController {
  constructor(private readonly marcasService: MarcasService) {}

  @Post()
  create(@Body() dto: CreateMarcaDto) {
    return this.marcasService.create(dto);
  }

  @Get()
  findAll() {
    return this.marcasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.marcasService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMarcaDto) {
    return this.marcasService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.marcasService.remove(id);
  }
}
