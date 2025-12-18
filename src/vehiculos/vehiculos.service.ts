import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Injectable()
export class VehiculosService {
  constructor(private prisma: PrismaService) {}

  async findByFabricante(fabricante_id: number) {
    return this.prisma.vehiculos.findMany({
      where: { fabricante_id },
      orderBy: { nombre: 'asc' },
    });
  }

  create(data: CreateVehiculoDto) {
    return this.prisma.vehiculos.create({ data });
  }

  findAll() {
    return this.prisma.vehiculos.findMany({
      include: { fabricantes: true },
    });
  }

  async findOne(id: number) {
    const vehiculo = await this.prisma.vehiculos.findUnique({
      where: { id },
      include: { fabricantes: true },
    });

    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return vehiculo;
  }

  async update(id: number, data: UpdateVehiculoDto) {
    await this.findOne(id);

    return this.prisma.vehiculos.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.vehiculos.delete({
      where: { id },
    });
  }
}
