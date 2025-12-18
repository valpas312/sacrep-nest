import { Module } from '@nestjs/common';
import { UtilController } from './util.controller';
import { UtilService } from './util.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [UtilController],
  providers: [UtilService, PrismaService],
})
export class UtilModule {}
