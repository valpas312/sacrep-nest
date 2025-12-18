import { Module } from '@nestjs/common';
import { FabricantesService } from './fabricantes.service';
import { FabricantesController } from './fabricantes.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FabricantesController],
  providers: [FabricantesService, PrismaService],
})
export class FabricantesModule {}
