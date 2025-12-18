import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';

@Injectable()
export class MarcasService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateMarcaDto) {
    return this.prisma.marcas.create({ data });
  }

  findAll() {
    return this.prisma.marcas.findMany();
  }

  async findOne(id: number) {
    const marca = await this.prisma.marcas.findUnique({ where: { id } });
    if (!marca) throw new NotFoundException('Marca no encontrada');
    return marca;
  }

  async update(id: number, data: UpdateMarcaDto) {
    await this.findOne(id);
    return this.prisma.marcas.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.marcas.delete({ where: { id } });
  }
}
