import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { BuscarProductosDto } from './dto/buscar-productos.dto';
import { BatchDeleteProductosDto } from './dto/batch-delete-productos.dto';
import { BatchCreateProductosDto } from './dto/batch-create-productos.dto';
import { BatchUpdateStockDto } from './dto/batch-update-stock.dto';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  private normalizeEquivalencias(values?: string[]) {
    if (!values) return undefined; // importante: no tocar si no viene en el patch

    const cleaned = values
      .map((v) => (v ?? '').trim().toUpperCase())
      .filter(Boolean);

    return Array.from(new Set(cleaned));
  }

  // =========================
  // CREATE
  // =========================
  async create(data: CreateProductoDto) {
    return this.prisma.productos.create({
      data: {
        ...data,
        equivalencias: this.normalizeEquivalencias(data.equivalencias) ?? [],
      },
      include: { fabricantes: true, categorias: true, marcas: true },
    });
  }

  // =========================
  // BATCH UPDATE stock BY SKU
  // =========================
  async batchUpdateStock(dto: BatchUpdateStockDto) {
    const { items } = dto;

    if (!items?.length) {
      throw new BadRequestException('No se enviaron items para actualizar');
    }

    // Deduplicar por id (si viene repetido, gana el último)
    const map = new Map<number, boolean>();
    for (const it of items) {
      const id = Number(it.id);
      if (!Number.isInteger(id) || id <= 0) continue;
      map.set(id, Boolean(it.hay_stock));
    }

    const ids = Array.from(map.keys());
    if (!ids.length) {
      throw new BadRequestException('No se enviaron IDs válidos');
    }

    // Buscar existentes para devolver notFound
    const existentes = await this.prisma.productos.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const existentesSet = new Set(existentes.map((e) => e.id));
    const notFoundIds = ids.filter((id) => !existentesSet.has(id));

    // Actualizar solo existentes (transaccional)
    const toUpdate = ids
      .filter((id) => existentesSet.has(id))
      .map((id) =>
        this.prisma.productos.update({
          where: { id },
          data: { hay_stock: map.get(id)! },
          select: { id: true, hay_stock: true },
        }),
      );

    if (!toUpdate.length) {
      return { requested: ids.length, updated: 0, notFoundIds, data: [] };
    }

    const updatedRows = await this.prisma.$transaction(toUpdate);

    return {
      requested: ids.length,
      updated: updatedRows.length,
      notFoundIds,
      data: updatedRows,
    };
  }

  /**
   * Batch update de precios por SKU
   * - Actualiza en transacción
   * - Devuelve resumen + lista de SKUs no encontrados
   */
  async batchUpdatePreciosBySku(dto: {
    items: { sku: string; precio: number }[];
  }) {
    const { items } = dto;

    if (!items?.length) {
      throw new BadRequestException('No se enviaron items para actualizar');
    }

    // Normalización y deduplicación por SKU (si viene repetido, gana el último)
    const map = new Map<string, number>();
    for (const it of items) {
      const sku = (it.sku ?? '').trim();
      if (!sku) continue;
      map.set(sku, it.precio);
    }

    const skus = Array.from(map.keys());
    if (!skus.length) {
      throw new BadRequestException('No se enviaron SKUs válidos');
    }

    // Buscar qué SKUs existen (sin traer todo)
    const existentes = await this.prisma.productos.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });

    const existentesSet = new Set(existentes.map((e) => e.sku));
    const notFoundSkus = skus.filter((s) => !existentesSet.has(s));

    // Si querés forzar “todo o nada”, descomentá:
    // if (notFoundSkus.length) {
    //   throw new NotFoundException(`SKUs no encontrados: ${notFoundSkus.join(', ')}`);
    // }

    // Actualizar solo los existentes
    const toUpdate = skus
      .filter((s) => existentesSet.has(s))
      .map((sku) =>
        this.prisma.productos.updateMany({
          where: { sku },
          data: { precio: map.get(sku)! },
        }),
      );

    // Si no hay nada para actualizar (todos faltan)
    if (!toUpdate.length) {
      return {
        requested: skus.length,
        updated: 0,
        notFoundSkus,
      };
    }

    const results = await this.prisma.$transaction(toUpdate);

    // updateMany devuelve { count }, sumamos
    const updated = results.reduce((acc, r) => acc + r.count, 0);

    return {
      requested: skus.length,
      updated,
      notFoundSkus,
    };
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
          { equivalencias: { has: term.toUpperCase() } },
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

    const nextData: Record<string, any> = { ...data };

    if ('equivalencias' in data) {
      nextData.equivalencias = this.normalizeEquivalencias(data.equivalencias);
    }

    return this.prisma.productos.update({
      where: { id },
      data: nextData,
      include: { fabricantes: true, categorias: true, marcas: true },
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
