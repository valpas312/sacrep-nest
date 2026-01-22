import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EquivalenciasService } from './equivalencias.service';
import { CreateEquivalenciaDto } from './dto/create-equivalencia.dto';
import { MoverCodigoDto } from './dto/mover-codigo.dto';
import { UpdateGrupoCodigosDto } from './dto/update-grupo-codigos.dto';

@ApiTags('equivalencias')
@Controller('equivalencias')
export class EquivalenciasController {
  constructor(private readonly equivalenciasService: EquivalenciasService) {}

  // POST /equivalencias
  @Post()
  @ApiOperation({ summary: 'Crear grupo de equivalencias (códigos)' })
  create(@Body() dto: CreateEquivalenciaDto) {
    return this.equivalenciasService.create(dto);
  }

  // GET /equivalencias/por-codigo?codigo=...
  @Get('por-codigo')
  @ApiOperation({ summary: 'Obtener equivalencias (códigos) por código' })
  findByCodigo(@Query('codigo') codigo: string) {
    return this.equivalenciasService.findByCodigo(codigo);
  }

  // PATCH /equivalencias/:id/codigos  (agregar/quitar)
  @Patch(':id/codigos')
  @ApiOperation({ summary: 'Editar códigos de un grupo (add/remove)' })
  updateCodigos(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGrupoCodigosDto,
  ) {
    return this.equivalenciasService.updateCodigos(id, dto);
  }

  // PATCH /equivalencias/mover-codigo  (mover entre grupos)
  @Patch('mover-codigo')
  @ApiOperation({
    summary: 'Mover un código a otro grupo (o crearlo en destino si no existe)',
  })
  moverCodigo(@Body() dto: MoverCodigoDto) {
    return this.equivalenciasService.moverCodigo(dto);
  }

  // CRUD generado por resource (opcional)
  @Get()
  findAll() {
    return this.equivalenciasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equivalenciasService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equivalenciasService.remove(id);
  }
}
