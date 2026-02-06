import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
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
  // EQUIVALENCIAS
  // =========================
  private async obtenerGrupoEquivalencias(
    codigoRaw: string,
  ): Promise<string[]> {
    const codigo = this.normalizeSkuLoose(codigoRaw);

    const rows = await this.prisma.equivalencia_codigos.findMany({
      where: { codigo },
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

  async equivalenciasPorCodigo(codigoRaw?: string | null): Promise<string[]> {
    if (!codigoRaw) return [];

    const base = this.normalizeSkuLoose(codigoRaw);
    const todas = await this.obtenerGrupoEquivalencias(codigoRaw);

    return todas.filter((c) => this.normalizeSkuLoose(c) !== base);
  }

  // =========================
  // CREATE / UPDATE / DELETE
  // =========================
  async create(data: CreateProductoDto) {
    return this.prisma.productos.create({
      data: { ...data, sku: this.normalizeCodigo(data.sku) },
      include: { fabricantes: true, categorias: true, marcas: true },
    });
  }

  async batchCreate(dto: BatchCreateProductosDto) {
    if (!dto.productos?.length)
      throw new BadRequestException('No se enviaron productos');

    const created = await this.prisma.$transaction(
      dto.productos.map((p) =>
        this.prisma.productos.create({
          data: { ...p, sku: this.normalizeCodigo(p.sku) },
        }),
      ),
    );

    return { count: created.length, data: created };
  }

  async batchUpdateStock(dto: BatchUpdateStockDto) {
    if (!dto.items?.length)
      throw new BadRequestException('No se enviaron items');

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
    if (!dto.items?.length)
      throw new BadRequestException('No se enviaron items');

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

    if (!producto) throw new NotFoundException('Producto no encontrado');

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
  // BUSCAR (CORREGIDO FINAL)
  // =========================
  async buscar(params: BuscarProductosDto) {
    const { q, stock, page = 1, limit = 20 } = params;

    let codigoBuscado: string | null = null;
    let equivalencias: string[] = [];

    // =========================
    // BÚSQUEDA POR CÓDIGO
    // =========================
    if (q && this.pareceCodigo(q)) {
      const qLoose = this.normalizeSkuLoose(q);
      codigoBuscado = qLoose;

      // 1️⃣ resolver grupo de equivalencias (aunque no exista como producto)
      const grupo = await this.obtenerGrupoEquivalencias(q);

      if (grupo.length) {
        const grupoLoose = grupo.map((c) => this.normalizeSkuLoose(c));

        equivalencias = grupo.filter(
          (c) => this.normalizeSkuLoose(c) !== qLoose,
        );

        // 2️⃣ traer productos reales del grupo (loose match)
        const stockClause =
          stock !== undefined ? `AND hay_stock = ${stock}` : '';
        const data = await this.prisma.$queryRaw<any[]>(
          Prisma.sql`SELECT * FROM productos WHERE UPPER(REGEXP_REPLACE(sku, '[^A-Z0-9]', '', 'g')) = ANY(${Prisma.join(grupoLoose)}) ${Prisma.raw(stockClause)}`,
        );

        return {
          page,
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

    // =========================
    // BÚSQUEDA TEXTO (AND real)
    // =========================
    const terms =
      q
        ?.trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 1) ?? [];

    const where: Prisma.productosWhereInput =
      terms.length > 0
        ? {
            AND: terms.map((term) => ({
              OR: [
                {
                  nombre: {
                    contains: term,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  sku: {
                    contains: term,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            })),
          }
        : {};

    const data = await this.prisma.productos.findMany({
      where: {
        ...where,
        ...(stock !== undefined ? { hay_stock: stock } : {}),
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
