import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductosModule } from './productos/productos.module';
import { UtilModule } from './util/util.module';
import { MarcasModule } from './marcas/marcas.module';
import { CategoriasModule } from './categorias/categorias.module';
import { FabricantesModule } from './fabricantes/fabricantes.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ProductoVehiculosModule } from './producto-vehiculos/producto-vehiculos.module';
import { CargarListaModule } from './cargar-lista/cargar-lista.module';

@Module({
  imports: [PrismaModule, ProductosModule, UtilModule, MarcasModule, CategoriasModule, FabricantesModule, VehiculosModule, ProductoVehiculosModule, CargarListaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
