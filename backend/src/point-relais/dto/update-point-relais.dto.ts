import { PartialType } from '@nestjs/mapped-types';
import { CreatePointRelaisDto } from './create-point-relais.dto';

// DTO pour modifier un point relais
export class UpdatePointRelaisDto extends PartialType(CreatePointRelaisDto) {}
