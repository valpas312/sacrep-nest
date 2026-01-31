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

  async equivalenciasPorCodigo(codigoRaw?: string | null): Promise<string[]> {
    const codigo = this.normalizeCodigo(codigoRaw);
    if (!codigo) return [];

    const row = await this.prisma.equivalencia_codigos.findUnique({
      where: { codigo },
      select: { grupo_id: true },
    });

    if (!row) return [];

    const codigos = await this.prisma.equivalencia_codigos.findMany({
      where: { grupo_id: row.grupo_id },
      select: { codigo: true },
    });

    return codigos.map((c) => c.codigo).filter((c) => c !== codigo);
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

    const updates = dto.items.map((i) =>
      this.prisma.productos.update({
        where: { id: i.id },
        data: { hay_stock: i.hay_stock },
      }),
    );

    await this.prisma.$transaction(updates);
    return { updated: updates.length };
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

    const updates = dto.items.map((i) =>
      this.prisma.productos.updateMany({
        where: { sku: this.normalizeCodigo(i.sku) },
        data: { precio: i.precio },
      }),
    );

    const res = await this.prisma.$transaction(updates);
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
  // BUSCAR (SKU LOOSE + EQUIVALENCIAS OK)
  // =========================
  async buscar(params: BuscarProductosDto) {
    const { q, page = 1, limit = 20 } = params;

    let equivalencias: string[] = [];
    let codigoBuscado: string | null = null;

    if (q && this.pareceCodigo(q)) {
      const qLoose = this.normalizeSkuLoose(q);
      codigoBuscado = q.toUpperCase();

      const productos = await this.prisma.$queryRaw<{ sku?: string }[]>`
        SELECT *
        FROM productos
        WHERE UPPER(REGEXP_REPLACE(sku, '[^A-Z0-9]', '', 'g'))
        LIKE ${'%' + qLoose + '%'}
        LIMIT ${limit}
      `;

      if (productos.length && productos[0].sku) {
        equivalencias = await this.equivalenciasPorCodigo(productos[0].sku);
      }

      return {
        page: 1,
        limit: productos.length,
        total: productos.length,
        q,
        codigoBuscado,
        equivalencias,
        sugerencias: [],
        data: productos,
      };
    }

    const skip = (page - 1) * limit;

    const data = await this.prisma.productos.findMany({
      skip,
      take: limit,
    });

    const total = await this.prisma.productos.count();

    return {
      page,
      limit,
      total,
      q,
      codigoBuscado,
      equivalencias,
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
