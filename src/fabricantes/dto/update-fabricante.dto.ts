import { PartialType } from '@nestjs/swagger';
import { CreateFabricanteDto } from './create-fabricante.dto';

export class UpdateFabricanteDto extends PartialType(CreateFabricanteDto) {}
