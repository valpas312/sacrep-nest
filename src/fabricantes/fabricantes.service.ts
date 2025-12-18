import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFabricanteDto } from './dto/create-fabricante.dto';
import { UpdateFabricanteDto } from './dto/update-fabricante.dto';

@Injectable()
export class FabricantesService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateFabricanteDto) {
    return this.prisma.fabricantes.create({ data });
  }

  findAll() {
    return this.prisma.fabricantes.findMany();
  }

  async findOne(id: number) {
    const fabricante = await this.prisma.fabricantes.findUnique({
      where: { id },
    });
    if (!fabricante) throw new NotFoundException('Fabricante no encontrado');
    return fabricante;
  }

  async update(id: number, data: UpdateFabricanteDto) {
    await this.findOne(id);

    return this.prisma.fabricantes.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.fabricantes.delete({
      where: { id },
    });
  }
}
