import { Controller, Get } from '@nestjs/common';
import { UtilService } from './util.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('filtros')
@Controller('filtros')
export class UtilController {
  constructor(private readonly utilService: UtilService) {}

  @Get()
  obtenerFiltros() {
    return this.utilService.obtenerFiltros();
  }
}
