import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UtilService {
  constructor(private prisma: PrismaService) {}

  async obtenerFiltros() {
    const marcas = await this.prisma.marcas.findMany({
      orderBy: { nombre: 'asc' },
    });

    const categorias = await this.prisma.categorias.findMany({
      orderBy: { nombre: 'asc' },
    });

    const fabricantes = await this.prisma.fabricantes.findMany({
      orderBy: { nombre: 'asc' },
    });

    const vehiculos = await this.prisma.vehiculos.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        fabricantes: true,
      },
    });

    return {
      marcas,
      categorias,
      fabricantes,
      vehiculos,
    };
  }
}
