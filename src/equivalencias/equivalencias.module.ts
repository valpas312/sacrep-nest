import { Module } from '@nestjs/common';
import { EquivalenciasService } from './equivalencias.service';
import { EquivalenciasController } from './equivalencias.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [EquivalenciasController],
  providers: [EquivalenciasService, PrismaService],
})
export class EquivalenciasModule {}
