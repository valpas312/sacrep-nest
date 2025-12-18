import { Module } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ProductosController],
  providers: [ProductosService, PrismaService],
})
export class ProductosModule {}
