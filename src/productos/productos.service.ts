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
  private normalizeCodigo(v?: string) {
    const s = (v ?? '').trim().toUpperCase();
    return s || null;
  }

  /**
   * Devuelve códigos equivalentes (strings) para un código dado.
   * - Si el código no pertenece a ningún grupo, devuelve []
   * - Excluye el propio código consultado
   */
  async equivalenciasPorCodigo(codigoRaw?: string): Promise<string[]> {
    const codigo = this.normalizeCodigo(codigoRaw) ?? '';
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
  // BATCH UPDATE stock BY ID
  // =========================
  async batchUpdateStock(dto: BatchUpdateStockDto) {
    const { items } = dto;

    if (!items?.length) {
      throw new BadRequestException('No se enviaron items para actualizar');
    }

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

    const existentes = await this.prisma.productos.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const existentesSet = new Set(existentes.map((e) => e.id));
    const notFoundIds = ids.filter((id) => !existentesSet.has(id));

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

    const map = new Map<string, number>();
    for (const it of items) {
      const sku = this.normalizeCodigo(it.sku) ?? '';
      if (!sku) continue;
      map.set(sku, it.precio);
    }

    const skus = Array.from(map.keys());
    if (!skus.length) {
      throw new BadRequestException('No se enviaron SKUs válidos');
    }

    const existentes = await this.prisma.productos.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });

    const existentesSet = new Set(existentes.map((e) => e.sku));
    const notFoundSkus = skus.filter((s) => !existentesSet.has(s));

    const toUpdate = skus
      .filter((s) => existentesSet.has(s))
      .map((sku) =>
        this.prisma.productos.updateMany({
          where: { sku },
          data: { precio: map.get(sku)! },
        }),
      );

    if (!toUpdate.length) {
      return {
        requested: skus.length,
        updated: 0,
        notFoundSkus,
      };
    }

    const results = await this.prisma.$transaction(toUpdate);
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
          data: {
            ...data,
            sku: this.normalizeCodigo(data.sku),
          },
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
  // FIND ONE (con equivalencias por código)
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

    const equivalencias = await this.equivalenciasPorCodigo(
      producto.sku ?? undefined,
    );

    return {
      ...producto,
      equivalencias, // string[]
    };
  }

  // =========================
  // DESTACADOS (RANDOM)
  // =========================
  async destacados() {
    const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM productos
      ORDER BY RANDOM()
      LIMIT 8
    `;

    const ids = rows.map((r) => r.id);
    if (!ids.length) return [];

    const productos = await this.prisma.productos.findMany({
      where: { id: { in: ids } },
      include: {
        marcas: true,
        categorias: true,
        fabricantes: true,
      },
    });

    const order = new Map(ids.map((id, idx) => [id, idx]));
    productos.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

    return productos;
  }

  // =========================
  // BUSCAR (texto + código parcial + equivalencias)
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

    if (q) {
      const terms = q.trim().split(/\s+/).filter(Boolean);

      // 1 token => tratar como "código" (soporta parciales tipo DF1145)
      if (terms.length === 1) {
        const termRaw = terms[0];
        const termUp = (termRaw ?? '').trim().toUpperCase();
        codigoBuscado = termUp || null;

        // (A) equivalencias por match EXACTO
        equivalencias = await this.equivalenciasPorCodigo(termUp);

        // (B) si el término es lo suficientemente largo, intentar también expandir por "contains"
        //     Ej: DF1145 matchea 3DF1145 en equivalencia_codigos => tomo ese grupo y traigo sus códigos
        if (termUp.length >= 4) {
          const matches = await this.prisma.equivalencia_codigos.findMany({
            where: { codigo: { contains: termUp, mode: 'insensitive' } },
            select: { grupo_id: true },
            take: 5, // evita explosión si hay muchos matches
          });

          const grupoIds = Array.from(new Set(matches.map((m) => m.grupo_id)));
          if (grupoIds.length) {
            const cods = await this.prisma.equivalencia_codigos.findMany({
              where: { grupo_id: { in: grupoIds } },
              select: { codigo: true },
            });

            const extra = cods.map((c) => c.codigo);
            equivalencias = Array.from(
              new Set([...equivalencias, ...extra]),
            ).filter((c) => c !== termUp);
          }
        }

        const codigosExactos = Array.from(
          new Set([termUp, ...equivalencias]),
        ).filter(Boolean);

        // Query:
        // - sku contains term (para DF1145 -> 3DF1145)
        // - o sku in (códigos exactos del grupo) si aplica
        where.AND = [
          {
            OR: [
              { sku: { contains: termRaw, mode: 'insensitive' } },
              ...(codigosExactos.length
                ? [{ sku: { in: codigosExactos } }]
                : []),
            ],
          },
        ];
      } else {
        // Texto libre: búsqueda por palabras
        where.AND = terms.map((term) => ({
          OR: [
            { nombre: { contains: term, mode: 'insensitive' } },
            { sku: { contains: term, mode: 'insensitive' } },
          ],
        }));
      }
    }

    // Filtros
    if (marca) where.marca = marca;
    if (categoria) where.categoria = categoria;
    if (fabricante) where.fabricante = fabricante;

    if (stock !== undefined) {
      where.hay_stock = stock;
    }

    if (vehiculo) {
      where.producto_vehiculos = {
        some: { vehiculo_id: vehiculo },
      };
    }

    // Paginación
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
      q,
      codigoBuscado,
      equivalencias, // <- códigos equivalentes (strings) en la misma respuesta
      data: productos,
    };
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: number, data: UpdateProductoDto) {
    await this.findOne(id);

    const nextData: Record<string, any> = { ...data };

    if ('sku' in data) {
      nextData.sku = this.normalizeCodigo(data.sku);
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
