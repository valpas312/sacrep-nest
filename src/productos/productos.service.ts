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
  // EQUIVALENCIAS (BASE REAL)
  // =========================
  private async obtenerGrupoEquivalencias(
    codigoRaw: string,
  ): Promise<string[]> {
    const codigoNorm = this.normalizeSkuLoose(codigoRaw);

    const rows = await this.prisma.equivalencia_codigos.findMany({
      where: {
        codigo: codigoNorm,
      },
      select: { grupo_id: true },
    });

    if (!rows.length) return [];

    const grupoIds = rows.map((r) => r.grupo_id);

    const codigos = await this.prisma.equivalencia_codigos.findMany({
      where: { grupo_id: { in: grupoIds } },
      select: { codigo: true },
    });

    return codigos.map((c) => c.codigo);
  }

  // API pública (la usa el controller)
  async equivalenciasPorCodigo(codigoRaw?: string | null): Promise<string[]> {
    if (!codigoRaw) return [];

    const base = this.normalizeSkuLoose(codigoRaw);
    const todas = await this.obtenerGrupoEquivalencias(codigoRaw);

    return todas.filter((c) => this.normalizeSkuLoose(c) !== base);
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

    return { updated: res.reduce((a, b) => a + b.count, 0) };
  }

  async findAll() {
    return this.prisma.productos.findMany({
      include: { fabricantes: true, categorias: true, marcas: true },
    });
  }

  async findOne(id: number) {
    const producto = await this.prisma.productos.findUnique({
      where: { id },
      include: { fabricantes: true, categorias: true, marcas: true },
    });

    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const equivalencias = await this.equivalenciasPorCodigo(producto.sku);

    return { ...producto, equivalencias };
  }

  async destacados() {
    return this.prisma.$queryRaw`
      SELECT *
      FROM productos
      ORDER BY RANDOM()
      LIMIT 8
    `;
  }

  // =========================
  // BUSCAR (CÓDIGO CORRECTO)
  // =========================
  async buscar(params: BuscarProductosDto) {
    const { q, stock, page = 1, limit = 20 } = params;

    let equivalencias: string[] = [];
    let codigoBuscado: string | null = null;

    if (q && this.pareceCodigo(q)) {
      codigoBuscado = q.toUpperCase();

      const grupo = await this.obtenerGrupoEquivalencias(q);

      if (grupo.length) {
        equivalencias = grupo.filter(
          (c) => this.normalizeSkuLoose(c) !== this.normalizeSkuLoose(q),
        );

        const data = await this.prisma.productos.findMany({
          where: {
            sku: { in: grupo },
            ...(stock !== undefined ? { hay_stock: stock } : {}),
          },
        });

        return {
          page: 1,
          limit: data.length,
          total: data.length,
          q,
          codigoBuscado,
          equivalencias,
          sugerencias: [],
          data,
        };
      }
    }

    // fallback texto
    const data = await this.prisma.productos.findMany({
      where: {
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ],
      },
    });

    return {
      page,
      limit,
      total: data.length,
      q,
      codigoBuscado,
      equivalencias: [],
      sugerencias: [],
      data,
    };
  }

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
