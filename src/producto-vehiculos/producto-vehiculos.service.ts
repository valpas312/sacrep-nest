import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoVehiculoDto } from './dto/create-producto-vehiculo.dto';
import { UpdateProductoVehiculoDto } from './dto/update-producto-vehiculo.dto';

@Injectable()
export class ProductoVehiculosService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateProductoVehiculoDto) {
    return this.prisma.producto_vehiculos.create({
      data,
      include: { productos: true, vehiculos: true },
    });
  }

  findAll() {
    return this.prisma.producto_vehiculos.findMany({
      include: { productos: true, vehiculos: true },
    });
  }

  findOne(id: number) {
    return this.prisma.producto_vehiculos.findUnique({
      where: { id },
      include: { productos: true, vehiculos: true },
    });
  }

  update(id: number, data: UpdateProductoVehiculoDto) {
    return this.prisma.producto_vehiculos.update({
      where: { id },
      data,
      include: { productos: true, vehiculos: true },
    });
  }

  remove(id: number) {
    return this.prisma.producto_vehiculos.delete({
      where: { id },
    });
  }

  // ⭐ BORRAR TODAS LAS RELACIONES DE UN PRODUCTO
  removeAllFromProduct(producto_id: number) {
    return this.prisma.producto_vehiculos.deleteMany({
      where: { producto_id },
    });
  }

  // ⭐ OBTENER LOS VEHÍCULOS DE UN PRODUCTO
  findByProduct(producto_id: number) {
    return this.prisma.producto_vehiculos.findMany({
      where: { producto_id },
      include: { vehiculos: true },
    });
  }
}
