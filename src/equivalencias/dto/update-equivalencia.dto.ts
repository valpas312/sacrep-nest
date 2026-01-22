import { PartialType } from '@nestjs/swagger';
import { CreateEquivalenciaDto } from './create-equivalencia.dto';

export class UpdateEquivalenciaDto extends PartialType(CreateEquivalenciaDto) {}
