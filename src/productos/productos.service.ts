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

  private normalizeSkuLoose(value: string | null) {
    return (value ?? '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
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
    const { equivalencias: _equivalencias, ...productoData } = data;

    return this.prisma.productos.create({
      data: { ...productoData, sku: this.normalizeCodigo(data.sku) },
      include: { fabricantes: true, categorias: true, marcas: true },
    });
  }

  async batchCreate(dto: BatchCreateProductosDto) {
    if (!dto.productos?.length)
      throw new BadRequestException('No se enviaron productos');

    const created = await this.prisma.$transaction(
      dto.productos.map((p) => {
        const { equivalencias: _equivalencias, ...productoData } = p;

        return this.prisma.productos.create({
          data: { ...productoData, sku: this.normalizeCodigo(p.sku) },
        });
      }),
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
    items: { sku: string; marca: number; precio: number }[];
  }) {
    if (!dto.items?.length)
      throw new BadRequestException('No se enviaron items');

    const normalizedItems = dto.items.map((i) => ({
      sku: this.normalizeCodigo(i.sku),
      marca: i.marca,
      precio: i.precio,
    }));

    const productosExistentes = await this.prisma.productos.findMany({
      where: {
        OR: normalizedItems.map((i) => ({
          sku: i.sku,
          marca: i.marca,
        })),
      },
      select: {
        sku: true,
        marca: true,
      },
    });

    const existingKeys = new Set(
      productosExistentes.map((p) => `${p.sku}_${p.marca}`),
    );

    const itemsParaActualizar = normalizedItems.filter((i) =>
      existingKeys.has(`${i.sku}_${i.marca}`),
    );

    const itemsNoEncontrados = normalizedItems.filter(
      (i) => !existingKeys.has(`${i.sku}_${i.marca}`),
    );

    const res = await this.prisma.$transaction(
      itemsParaActualizar.map((i) =>
        this.prisma.productos.updateMany({
          where: {
            sku: i.sku,
            marca: i.marca,
          },
          data: {
            precio: i.precio,
          },
        }),
      ),
    );

    const updated = res.reduce((a, b) => a + b.count, 0);

    return {
      updated,
      notFound: itemsNoEncontrados.map((i) => ({
        sku: i.sku,
        marca: i.marca,
      })),
    };
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
  // BUSCAR
  // =========================
  async buscar(params: BuscarProductosDto) {
    const { q, stock, page = 1, limit = 20 } = params;
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (currentPage - 1) * pageSize;
    const stockFilter = stock ?? null;

    let codigoBuscado: string | null = null;
    let equivalencias: string[] = [];

    // =========================
    // BUSQUEDA POR CODIGO / EQUIVALENCIA
    // =========================
    if (q && this.pareceCodigo(q)) {
      const qLoose = this.normalizeSkuLoose(q);
      codigoBuscado = qLoose;

      const codigosSet = new Set<string>();

      const skusEncontrados = await this.prisma.$queryRaw<{ sku: string }[]>`
    SELECT sku
    FROM productos
    WHERE UPPER(
      REGEXP_REPLACE(sku, '[^A-Z0-9]', '', 'g')
    ) LIKE ${'%' + qLoose + '%'}
  `;

      for (const row of skusEncontrados) {
        const skuLoose = this.normalizeSkuLoose(row.sku);
        codigosSet.add(skuLoose);

        const grupo = await this.obtenerGrupoEquivalencias(row.sku);
        for (const codigo of grupo) {
          codigosSet.add(this.normalizeSkuLoose(codigo));
        }
      }

      const gruposDesdeEquivalencia =
        await this.prisma.equivalencia_codigos.findMany({
          where: { codigo: qLoose },
          select: { grupo_id: true },
        });

      if (gruposDesdeEquivalencia.length) {
        const grupoIds = gruposDesdeEquivalencia.map((g) => g.grupo_id);

        const codigosGrupo = await this.prisma.equivalencia_codigos.findMany({
          where: { grupo_id: { in: grupoIds } },
          select: { codigo: true },
        });

        for (const c of codigosGrupo) {
          codigosSet.add(this.normalizeSkuLoose(c.codigo));
        }
      }

      if (codigosSet.size > 0) {
        const codigosBuscar = Array.from(codigosSet);

        type ProductoRow = {
          sku: string;
          [key: string]: any;
        };

        const data = await this.prisma.$queryRaw<ProductoRow[]>`
      SELECT *
      FROM productos
      WHERE UPPER(
        REGEXP_REPLACE(sku, '[^A-Z0-9]', '', 'g')
      ) = ANY (${codigosBuscar})
      AND (${stockFilter} IS NULL OR hay_stock = ${stockFilter})
      OFFSET ${skip}
      LIMIT ${pageSize}
    `;

        if (data.length) {
          const encontradosLoose = data.map((p) =>
            this.normalizeSkuLoose(p.sku),
          );

          equivalencias = codigosBuscar.filter(
            (c) => !encontradosLoose.includes(c),
          );

          return {
            page: currentPage,
            limit: pageSize,
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
    // BUSQUEDA TEXTO / FILTROS
    // =========================
    const terms =
      q
        ?.trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 1) ?? [];

    const andFilters: Prisma.productosWhereInput[] = [];

    if (params.marca) andFilters.push({ marca: params.marca });
    if (params.categoria) andFilters.push({ categoria: params.categoria });
    if (params.fabricante) andFilters.push({ fabricante: params.fabricante });
    if (stock !== undefined) andFilters.push({ hay_stock: stock });

    if (terms.length > 0) {
      andFilters.push({
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
      });
    }

    const where = andFilters.length > 0 ? { AND: andFilters } : undefined;

    if (terms.length === 0) {
      const [total, data] = await this.prisma.$transaction([
        this.prisma.productos.count({ where }),
        this.prisma.productos.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { id: 'asc' },
          include: { fabricantes: true, categorias: true, marcas: true },
        }),
      ]);

      return {
        page: currentPage,
        limit: pageSize,
        total,
        q,
        codigoBuscado,
        equivalencias: [],
        sugerencias: [],
        data,
      };
    }

    const data = await this.prisma.productos.findMany({ where });

    if (!data.length) {
      return {
        page: currentPage,
        limit: pageSize,
        total: 0,
        q,
        codigoBuscado,
        equivalencias: [],
        sugerencias: [],
        data: [],
      };
    }

    const codigosSet = new Set<string>();

    for (const producto of data) {
      const skuLoose = this.normalizeSkuLoose(producto.sku);

      codigosSet.add(skuLoose);

      if (producto.sku) {
        const grupo = await this.obtenerGrupoEquivalencias(producto.sku);

        for (const codigo of grupo) {
          codigosSet.add(this.normalizeSkuLoose(codigo));
        }
      }
    }

    const codigosBuscar = Array.from(codigosSet);

    type ProductoRow = {
      sku: string;
      [key: string]: any;
    };

    const equivalentes = await this.prisma.$queryRaw<ProductoRow[]>`
  SELECT *
  FROM productos
  WHERE UPPER(
    REGEXP_REPLACE(sku, '[^A-Z0-9]', '', 'g')
  ) = ANY (${codigosBuscar})
  AND (${stockFilter} IS NULL OR hay_stock = ${stockFilter})
  OFFSET ${skip}
  LIMIT ${pageSize}
`;

    const encontradosLoose = data.map((p) => this.normalizeSkuLoose(p.sku));

    equivalencias = codigosBuscar.filter((c) => !encontradosLoose.includes(c));

    return {
      page: currentPage,
      limit: pageSize,
      total: equivalentes.length,
      q,
      codigoBuscado,
      equivalencias,
      sugerencias: [],
      data: equivalentes,
    };
  }

  async update(id: number, data: UpdateProductoDto) {
    await this.findOne(id);

    const { equivalencias: _equivalencias, ...productoData } = data;

    return this.prisma.productos.update({
      where: { id },
      data: {
        ...productoData,
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
