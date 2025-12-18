import { Module } from '@nestjs/common';
import { ProductoVehiculosService } from './producto-vehiculos.service';
import { ProductoVehiculosController } from './producto-vehiculos.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProductoVehiculosController],
  providers: [ProductoVehiculosService, PrismaService],
})
export class ProductoVehiculosModule {}
