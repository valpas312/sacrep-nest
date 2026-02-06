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

  // =========================
  // HELPERS
  // =========================
  private normalizeCodigo(v?: string | null) {
    const s = (v ?? '').trim().toUpperCase();
    return s || null;
  }

  private normalizeSkuLoose(value: string) {
    return value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  }

  private pareceCodigo(term: string) {
    return /[0-9]/.test(term);
  }

  // =========================
  // EQUIVALENCIAS (BIDIRECCIONAL)
  // =========================
  private async equivalenciasIncluyendoCodigo(
    codigoRaw: string,
  ): Promise<string[]> {
    const codigo = this.normalizeSkuLoose(codigoRaw);

    const rows = await this.prisma.equivalencia_codigos.findMany({
      where: {
        codigo: codigo,
      },
      select: { grupo_id: true },
    });

    if (!rows.length) return [];

    const grupoIds = rows.map((r) => r.grupo_id);

    const equivalencias = await this.prisma.equivalencia_codigos.findMany({
      where: {
        grupo_id: { in: grupoIds },
      },
      select: { codigo: true },
    });

    return equivalencias.map((e) => e.codigo);
  }

  // =========================
  // API COMPATIBLE (CONTROLLER)
  // =========================
  async equivalenciasPorCodigo(codigoRaw?: string | null): Promise<string[]> {
    if (!codigoRaw) return [];

    const codigoNorm = this.normalizeSkuLoose(codigoRaw);

    const equivalencias = await this.equivalenciasIncluyendoCodigo(codigoRaw);

    return equivalencias.filter(
      (c) => this.normalizeSkuLoose(c) !== codigoNorm,
    );
  }

  // =========================
  // CREATE
  // =========================
  async create(data: CreateProductoDto) {
    return this.prisma.productos.create({
      data: {
        ...data,
        sku: this.normalizeCodigo(data.sku),
      },
      include: { fabricantes: true, categorias: true, marcas: true },
    });
  }

  // =========================
  // BATCH CREATE
  // =========================
  async batchCreate(dto: BatchCreateProductosDto) {
    if (!dto.productos?.length) {
      throw new BadRequestException('No se enviaron productos');
    }

    const created = await this.prisma.$transaction(
      dto.productos.map((p) =>
        this.prisma.productos.create({
          data: {
            ...p,
            sku: this.normalizeCodigo(p.sku),
          },
        }),
      ),
    );

    return { count: created.length, data: created };
  }

  // =========================
  // BATCH UPDATE STOCK
  // =========================
  async batchUpdateStock(dto: BatchUpdateStockDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('No se enviaron items');
    }

    await this.prisma.$transaction(
      dto.items.map((i) =>
        this.prisma.productos.update({
          where: { id: i.id },
          data: { hay_stock: i.hay_stock },
        }),
      ),
    );

    return { updated: dto.items.length };
  }

  // =========================
  // BATCH UPDATE PRECIOS POR SKU
  // =========================
  async batchUpdatePreciosBySku(dto: {
    items: { sku: string; precio: number }[];
  }) {
    if (!dto.items?.length) {
      throw new BadRequestException('No se enviaron items');
    }

    const res = await this.prisma.$transaction(
      dto.items.map((i) =>
        this.prisma.productos.updateMany({
          where: { sku: this.normalizeCodigo(i.sku) },
          data: { precio: i.precio },
        }),
      ),
    );

    const updated = res.reduce((a, b) => a + b.count, 0);
    return { updated };
  }

  // =========================
  // FIND ALL
  // =========================
  async findAll() {
    return this.prisma.productos.findMany({
      include: { fabricantes: true, categorias: true, marcas: true },
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
      },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const equivalencias = await this.equivalenciasPorCodigo(producto.sku);

    return { ...producto, equivalencias };
  }

  // =========================
  // DESTACADOS
  // =========================
  async destacados() {
    return this.prisma.$queryRaw`
      SELECT *
      FROM productos
      ORDER BY RANDOM()
      LIMIT 8
    `;
  }

  // =========================
  // BUSCAR (CÓDIGO + TEXTO)
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

    let equivalencias: string[] = [];
    let codigoBuscado: string | null = null;

    // =========================
    // BÚSQUEDA POR CÓDIGO (ROBUSTA)
    // =========================
    if (q && this.pareceCodigo(q)) {
      codigoBuscado = q.toUpperCase();

      equivalencias = await this.equivalenciasIncluyendoCodigo(q);

      if (equivalencias.length) {
        const data = await this.prisma.productos.findMany({
          where: {
            sku: { in: equivalencias },
            ...(stock !== undefined ? { hay_stock: stock } : {}),
          },
          take: limit,
          skip: (page - 1) * limit,
        });

        if (data.length) {
          return {
            page,
            limit,
            total: data.length,
            q,
            codigoBuscado,
            equivalencias,
            sugerencias: [],
            data,
          };
        }
      }
    }

    // =========================
    // BÚSQUEDA TEXTO LIBRE
    // =========================
    const where: any = {};

    if (q) {
      const terms = q.trim().split(/\s+/).filter(Boolean);

      where.AND = terms.map((term) => ({
        OR: [
          { nombre: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
        ],
      }));
    }

    if (marca) where.marca = marca;
    if (categoria) where.categoria = categoria;
    if (fabricante) where.fabricante = fabricante;
    if (stock !== undefined) where.hay_stock = stock;

    if (vehiculo) {
      where.producto_vehiculos = {
        some: { vehiculo_id: vehiculo },
      };
    }

    const data = await this.prisma.productos.findMany({
      where,
      include: {
        marcas: true,
        categorias: true,
        fabricantes: true,
        producto_vehiculos: vehiculo ? { include: { vehiculos: true } } : false,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.productos.count({ where });

    return {
      page,
      limit,
      total,
      q,
      codigoBuscado,
      equivalencias: [],
      sugerencias: [],
      data,
    };
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: number, data: UpdateProductoDto) {
    await this.findOne(id);

    return this.prisma.productos.update({
      where: { id },
      data: {
        ...data,
        sku: data.sku ? this.normalizeCodigo(data.sku) : undefined,
      },
    });
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.productos.delete({ where: { id } });
  }

  async batchDelete(dto: BatchDeleteProductosDto) {
    return this.prisma.productos.deleteMany({
      where: { id: { in: dto.ids } },
    });
  }
}
