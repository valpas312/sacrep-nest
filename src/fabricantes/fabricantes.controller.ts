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

import { FabricantesService } from './fabricantes.service';
import { CreateFabricanteDto } from './dto/create-fabricante.dto';
import { UpdateFabricanteDto } from './dto/update-fabricante.dto';

@ApiTags('fabricantes')
@Controller('fabricantes')
export class FabricantesController {
  constructor(private readonly fabricantesService: FabricantesService) {}

  @Post()
  create(@Body() dto: CreateFabricanteDto) {
    return this.fabricantesService.create(dto);
  }

  @Get()
  findAll() {
    return this.fabricantesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fabricantesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFabricanteDto,
  ) {
    return this.fabricantesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fabricantesService.remove(id);
  }
}
