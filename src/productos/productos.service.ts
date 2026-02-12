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
    const codigoLoose = this.normalizeSkuLoose(codigoRaw);

    // 1️⃣ Buscar grupo normalizando en SQL
    const grupos = await this.prisma.$queryRaw<{ grupo_id: number }[]>`
    SELECT grupo_id
    FROM equivalencia_codigos
    WHERE UPPER(
      REGEXP_REPLACE(codigo, '[^A-Z0-9]', '', 'g')
    ) = ${codigoLoose}
  `;

    if (!grupos.length) return [];

    const grupoIds = grupos.map((g) => g.grupo_id);

    // 2️⃣ Traer todos los códigos del grupo
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

  private async obtenerEquivalenciasMasivas(
    skusBase: string[],
  ): Promise<string[]> {
    if (!skusBase.length) return [];

    const codigosSet = new Set<string>();

    for (const sku of skusBase) {
      const grupo = await this.obtenerGrupoEquivalencias(sku);
      for (const codigo of grupo) {
        codigosSet.add(this.normalizeSkuLoose(codigo));
      }
    }

    return Array.from(codigosSet);
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
  // BUSCAR
  // =========================
  async buscar(params: BuscarProductosDto) {
    const { q, stock, page = 1, limit = 20 } = params;

    let codigoBuscado: string | null = null;
    let equivalencias: string[] = [];

    // =========================
    // BÚSQUEDA POR CÓDIGO / EQUIVALENCIA
    // =========================
    if (q && this.pareceCodigo(q)) {
      const qLoose = this.normalizeSkuLoose(q);
      codigoBuscado = qLoose;

      // 1️⃣ Buscar SKUs que contengan el fragmento
      const skusEncontrados = await this.prisma.$queryRaw<{ sku: string }[]>`
    SELECT sku
    FROM productos
    WHERE UPPER(
      REGEXP_REPLACE(sku, '[^A-Z0-9]', '', 'g')
    ) LIKE '%' || ${qLoose} || '%'
  `;

      let skusBase: string[] = [];

      if (skusEncontrados.length) {
        // Si existen productos que coinciden
        skusBase = skusEncontrados.map((r) => r.sku);
      } else {
        // 🔥 NUEVO: verificar si el código existe en equivalencias aunque no exista producto
        const existeEnEquivalencias = await this.prisma.$queryRaw<
          { codigo: string }[]
        >`
    SELECT codigo
    FROM equivalencia_codigos
    WHERE UPPER(
      REGEXP_REPLACE(codigo, '[^A-Z0-9]', '', 'g')
    ) = ${qLoose}
    LIMIT 1
  `;

        if (existeEnEquivalencias.length) {
          skusBase = [qLoose];
        }
      }

      if (skusBase.length) {
        // 2️⃣ Obtener todos los códigos equivalentes en una sola consulta
        const codigosBuscar = await this.obtenerEquivalenciasMasivas(skusBase);

        type ProductoRow = {
          sku: string;
          [key: string]: any;
        };

        // 3️⃣ Traer productos existentes de ese grupo
        const data = await this.prisma.$queryRaw<ProductoRow[]>`
      SELECT *
      FROM productos
      WHERE UPPER(
        REGEXP_REPLACE(sku, '[^A-Z0-9]', '', 'g')
      ) = ANY (${codigosBuscar})
      AND (${stock} IS NULL OR hay_stock = ${stock})
    `;

        const encontradosLoose = data.map((p) => this.normalizeSkuLoose(p.sku));

        equivalencias = codigosBuscar.filter(
          (c) => !encontradosLoose.includes(c),
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
    // BÚSQUEDA TEXTO / FILTROS
    // =========================
    const terms =
      q
        ?.trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 1) ?? [];

    const andFilters: Prisma.productosWhereInput[] = [];

    // 🔹 filtros estructurales
    if (params.marca) andFilters.push({ marca: params.marca });
    if (params.categoria) andFilters.push({ categoria: params.categoria });
    if (params.fabricante) andFilters.push({ fabricante: params.fabricante });
    if (stock !== undefined) andFilters.push({ hay_stock: stock });

    // 🔹 búsqueda textual SOLO si hay terms
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

    const data = await this.prisma.productos.findMany({
      where: andFilters.length > 0 ? { AND: andFilters } : undefined,
    });

    if (!data.length) {
      return {
        page,
        limit,
        total: 0,
        q,
        codigoBuscado,
        equivalencias: [],
        sugerencias: [],
        data: [],
      };
    }

    // 🔹 Calcular equivalencias igual que en búsqueda por código
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

    // Traer productos equivalentes que no estén ya en data
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
  AND (${stock} IS NULL OR hay_stock = ${stock})
`;

    const encontradosLoose = data.map((p) => this.normalizeSkuLoose(p.sku));

    equivalencias = codigosBuscar.filter((c) => !encontradosLoose.includes(c));

    return {
      page,
      limit: equivalentes.length,
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
