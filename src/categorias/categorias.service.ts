import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateCategoriaDto) {
    return this.prisma.categorias.create({ data });
  }

  findAll() {
    return this.prisma.categorias.findMany();
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categorias.findUnique({
      where: { id },
    });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');
    return categoria;
  }

  async update(id: number, data: UpdateCategoriaDto) {
    await this.findOne(id);
    return this.prisma.categorias.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.categorias.delete({
      where: { id },
    });
  }
}
