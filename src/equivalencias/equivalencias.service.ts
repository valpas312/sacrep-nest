import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquivalenciaDto } from './dto/create-equivalencia.dto';
import { MoverCodigoDto } from './dto/mover-codigo.dto';
import { UpdateGrupoCodigosDto } from './dto/update-grupo-codigos.dto';

@Injectable()
export class EquivalenciasService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeCodigo(v?: string) {
    const s = (v ?? '').trim().toUpperCase();
    return s || null;
  }

  // =========================
  // CREATE GRUPO (resource create)
  // =========================
  async create(dto: CreateEquivalenciaDto) {
    const codigos = Array.from(
      new Set(
        (dto.codigos ?? [])
          .map((c) => this.normalizeCodigo(c))
          .filter(Boolean) as string[],
      ),
    );

    if (codigos.length < 2) {
      throw new BadRequestException(
        'Necesitás al menos 2 códigos válidos para crear un grupo',
      );
    }

    // Validar conflictos (código ya pertenece a otro grupo)
    const existentes = await this.prisma.equivalencia_codigos.findMany({
      where: { codigo: { in: codigos } },
      select: { codigo: true, grupo_id: true },
    });

    if (existentes.length) {
      const conflicts = existentes.map(
        (e) => `${e.codigo} (grupo ${e.grupo_id})`,
      );
      throw new BadRequestException(
        `Códigos ya asignados a otro grupo: ${conflicts.join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const grupo = await tx.equivalencia_grupos.create({
        data: {},
        select: { id: true },
      });

      await tx.equivalencia_codigos.createMany({
        data: codigos.map((codigo) => ({ codigo, grupo_id: grupo.id })),
      });

      return { grupo_id: grupo.id, codigos };
    });
  }

  // =========================
  // GET EQUIVALENCIAS POR CODIGO
  // =========================
  async findByCodigo(codigoRaw: string) {
    const codigo = this.normalizeCodigo(codigoRaw) ?? '';
    if (!codigo) throw new BadRequestException('Código inválido');

    const row = await this.prisma.equivalencia_codigos.findUnique({
      where: { codigo },
      select: { grupo_id: true },
    });

    if (!row) {
      return { codigo, grupo_id: null, equivalencias: [] };
    }

    const codigos = await this.prisma.equivalencia_codigos.findMany({
      where: { grupo_id: row.grupo_id },
      select: { codigo: true },
    });

    return {
      codigo,
      grupo_id: row.grupo_id,
      equivalencias: codigos.map((c) => c.codigo).filter((c) => c !== codigo),
    };
  }

  // =========================
  // EDITAR GRUPO: agregar y/o quitar códigos
  // =========================
  async updateCodigos(grupoId: number, dto: UpdateGrupoCodigosDto) {
    const grupo = await this.prisma.equivalencia_grupos.findUnique({
      where: { id: grupoId },
      select: { id: true },
    });

    if (!grupo) throw new NotFoundException('Grupo no encontrado');

    const add = Array.from(
      new Set(
        (dto.add ?? [])
          .map((c) => this.normalizeCodigo(c))
          .filter(Boolean) as string[],
      ),
    );

    const remove = Array.from(
      new Set(
        (dto.remove ?? [])
          .map((c) => this.normalizeCodigo(c))
          .filter(Boolean) as string[],
      ),
    );

    if (!add.length && !remove.length) {
      throw new BadRequestException('No se enviaron cambios (add/remove)');
    }

    // 1) Conflictos: códigos de "add" que ya existen en otro grupo
    //    (si existen en ESTE mismo grupo, no es problema)
    if (add.length) {
      const existentes = await this.prisma.equivalencia_codigos.findMany({
        where: { codigo: { in: add } },
        select: { codigo: true, grupo_id: true },
      });

      const conflicts = existentes.filter((e) => e.grupo_id !== grupoId);
      if (conflicts.length) {
        const msg = conflicts
          .map((c) => `${c.codigo} (grupo ${c.grupo_id})`)
          .join(', ');
        throw new BadRequestException(
          `No se pueden agregar: ya están en otro grupo. Usá mover-codigo. Conflictos: ${msg}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 2) Quitar (delete)
      if (remove.length) {
        await tx.equivalencia_codigos.deleteMany({
          where: { grupo_id: grupoId, codigo: { in: remove } },
        });
      }

      // 3) Agregar (createMany) — si alguno ya estaba en el grupo, skipDuplicates evita error
      if (add.length) {
        await tx.equivalencia_codigos.createMany({
          data: add.map((codigo) => ({ codigo, grupo_id: grupoId })),
          skipDuplicates: true,
        });
      }

      const codigosFinal = await tx.equivalencia_codigos.findMany({
        where: { grupo_id: grupoId },
        select: { codigo: true },
        orderBy: { codigo: 'asc' },
      });

      return {
        grupo_id: grupoId,
        codigos: codigosFinal.map((c) => c.codigo),
      };
    });
  }

  // =========================
  // MOVER CÓDIGO ENTRE GRUPOS (clave por unique(codigo))
  // =========================
  async moverCodigo(dto: MoverCodigoDto) {
    const codigo = this.normalizeCodigo(dto.codigo) ?? '';
    if (!codigo) throw new BadRequestException('Código inválido');

    const destino = await this.prisma.equivalencia_grupos.findUnique({
      where: { id: dto.grupoDestinoId },
      select: { id: true },
    });
    if (!destino) throw new NotFoundException('Grupo destino no encontrado');

    const existente = await this.prisma.equivalencia_codigos.findUnique({
      where: { codigo },
      select: { id: true, grupo_id: true },
    });

    if (!existente) {
      // Si el código no existía, lo creamos directo en el grupo destino
      await this.prisma.equivalencia_codigos.create({
        data: { codigo, grupo_id: dto.grupoDestinoId },
      });
      return { codigo, from_grupo_id: null, to_grupo_id: dto.grupoDestinoId };
    }

    if (existente.grupo_id === dto.grupoDestinoId) {
      return {
        codigo,
        from_grupo_id: existente.grupo_id,
        to_grupo_id: dto.grupoDestinoId,
      };
    }

    await this.prisma.equivalencia_codigos.update({
      where: { codigo },
      data: { grupo_id: dto.grupoDestinoId },
    });

    return {
      codigo,
      from_grupo_id: existente.grupo_id,
      to_grupo_id: dto.grupoDestinoId,
    };
  }

  // CRUD básico que genera resource (opcional)
  findAll() {
    return this.prisma.equivalencia_grupos.findMany({
      include: { codigos: true },
      orderBy: { id: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.equivalencia_grupos.findUnique({
      where: { id },
      include: { codigos: true },
    });
  }

  remove(id: number) {
    return this.prisma.equivalencia_grupos.delete({ where: { id } });
  }
}
