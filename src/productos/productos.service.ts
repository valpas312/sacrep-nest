import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { BuscarProductosDto } from './dto/buscar-productos.dto';
import { BatchDeleteProductosDto } from './dto/batch-delete-productos.dto';
import { BatchCreateProductosDto } from './dto/batch-create-productos.dto';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // CREATE
  // =========================
  async create(data: CreateProductoDto) {
    return this.prisma.productos.create({
      data,
      include: {
        fabricantes: true,
        categorias: true,
        marcas: true,
      },
    });
  }

  // =========================
  // BATCH CREATE (TRANSACCIONAL)
  // =========================
  async batchCreate(dto: BatchCreateProductosDto) {
    const { productos } = dto;

    if (!productos.length) {
      throw new Error('No se enviaron productos para crear');
    }

    const created = await this.prisma.$transaction(
      productos.map((data) =>
        this.prisma.productos.create({
          data,
          include: {
            fabricantes: true,
            categorias: true,
            marcas: true,
          },
        }),
      ),
    );

    return {
      count: created.length,
      data: created,
    };
  }

  // =========================
  // FIND ALL
  // =========================
  async findAll() {
    return this.prisma.productos.findMany({
      include: {
        fabricantes: true,
        categorias: true,
        marcas: true,
      },
    });
  }

  // =========================
  // FIND ONE
  // =========================
  async findOne(id: number) {
    const producto = await this.prisma.productos.findUnique({
      where: { id },
      include: {
        fabricantes: true,
        categorias: true,
        marcas: true,
        producto_vehiculos: {
          include: { vehiculos: true },
        },
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return producto;
  }

  // =========================
  // DESTACADOS
  // =========================
  async destacados() {
    return this.prisma.productos.findMany({
      take: 8,
      orderBy: { id: 'desc' },
      include: {
        marcas: true,
        categorias: true,
        fabricantes: true,
      },
    });
  }

  // =========================
  // BUSCAR (MEJORADO)
  // =========================
  async buscar(params: BuscarProductosDto) {
    const {
      q,
      marca,
      categoria,
      fabricante,
      vehiculo,
      stock,
      page = 1,
      limit = 20,
    } = params;

    const where: Record<string, any> = {};

    // 🔍 TEXTO LIBRE CON PALABRAS PARCIALES
    // Ej: "past cronos" -> ["past", "cronos"]
    if (q) {
      const terms = q.trim().split(/\s+/).filter(Boolean);

      where.AND = terms.map((term) => ({
        OR: [
          { nombre: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
        ],
      }));
    }

    // 🔧 Marca
    if (marca) {
      where.marca = marca;
    }

    // 🔧 Categoría
    if (categoria) {
      where.categoria = categoria;
    }

    // 🔧 Fabricante
    if (fabricante) {
      where.fabricante = fabricante;
    }

    // 📦 Stock
    if (stock !== undefined) {
      where.hay_stock = stock;
    }

    // 🚗 Vehículo compatible (many-to-many)
    if (vehiculo) {
      where.producto_vehiculos = {
        some: {
          vehiculo_id: vehiculo,
        },
      };
    }

    // 📄 Paginación
    const skip = (page - 1) * limit;

    const productos = await this.prisma.productos.findMany({
      where,
      include: {
        marcas: true,
        categorias: true,
        fabricantes: true,
        producto_vehiculos: vehiculo ? { include: { vehiculos: true } } : false,
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.productos.count({ where });

    return {
      page,
      limit,
      total,
      data: productos,
    };
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: number, data: UpdateProductoDto) {
    await this.findOne(id);

    return this.prisma.productos.update({
      where: { id },
      data,
      include: {
        fabricantes: true,
        categorias: true,
        marcas: true,
      },
    });
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.productos.delete({
      where: { id },
    });
  }

  // =========================
  // BATCH DELETE
  // =========================
  async batchDelete(dto: BatchDeleteProductosDto) {
    return this.prisma.productos.deleteMany({
      where: {
        id: { in: dto.ids },
      },
    });
  }
}
