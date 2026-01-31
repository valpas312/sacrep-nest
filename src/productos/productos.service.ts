import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { BuscarProductosDto } from './dto/buscar-productos.dto';
import { BatchDeleteProductosDto } from './dto/batch-delete-productos.dto';

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
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
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

    const equivalencias = await this.equivalenciasPorCodigo(producto.sku);

    return {
      ...producto,
      equivalencias,
    };
  }

  // =========================
  // BUSCAR (FIX DEFINITIVO)
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
    let equivalencias: string[] = [];
    let codigoBuscado: string | null = null;
    let sugerencias: string[] = [];

    // =========================
    // BÚSQUEDA POR CÓDIGO
    // =========================
    if (q) {
      const termRaw = q.trim();
      const termLoose = this.normalizeSkuLoose(termRaw);
      codigoBuscado = termRaw.toUpperCase();

      if (this.pareceCodigo(termRaw)) {
        // 🔥 buscar producto por SKU loose
        const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
          SELECT id
          FROM productos
          WHERE UPPER(REGEXP_REPLACE(sku, '[^A-Z0-9]', '', 'g'))
          LIKE ${'%' + termLoose + '%'}
          LIMIT 20
        `;

        if (rows.length) {
          const ids = rows.map((r) => r.id);

          const productos = await this.prisma.productos.findMany({
            where: { id: { in: ids } },
            include: {
              marcas: true,
              categorias: true,
              fabricantes: true,
              producto_vehiculos: vehiculo
                ? { include: { vehiculos: true } }
                : false,
            },
          });

          // 🔥 equivalencias usando SKU REAL encontrado
          equivalencias = await this.equivalenciasPorCodigo(productos[0].sku);

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
      }

      // fallback texto
      where.OR = [
        { nombre: { contains: termRaw, mode: 'insensitive' } },
        { sku: { contains: termRaw, mode: 'insensitive' } },
      ];
    }

    // =========================
    // FILTROS
    // =========================
    if (marca) where.marca = marca;
    if (categoria) where.categoria = categoria;
    if (fabricante) where.fabricante = fabricante;
    if (stock !== undefined) where.hay_stock = stock;

    if (vehiculo) {
      where.producto_vehiculos = {
        some: { vehiculo_id: vehiculo },
      };
    }

    // =========================
    // QUERY FINAL
    // =========================
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

    // =========================
    // SUGERENCIAS
    // =========================
    if (!productos.length && q) {
      const qLoose = this.normalizeSkuLoose(q);

      const similares = await this.prisma.$queryRaw<
        Array<{ nombre: string; sku: string }>
      >`
        SELECT nombre, sku
        FROM productos
        WHERE UPPER(REGEXP_REPLACE(sku, '[^A-Z0-9]', '', 'g'))
        LIKE ${'%' + qLoose + '%'}
        LIMIT 5
      `;

      sugerencias = similares.map((p) => `${p.nombre} (${p.sku})`);
    }

    return {
      page,
      limit,
      total,
      q,
      codigoBuscado,
      equivalencias,
      sugerencias,
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
      data: {
        ...data,
        sku: data.sku ? this.normalizeCodigo(data.sku) : undefined,
      },
      include: { fabricantes: true, categorias: true, marcas: true },
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
