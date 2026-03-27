import { PartialType } from '@nestjs/mapped-types';
import { CreatePointRelaisDto } from './create-point-relais.dto';

export class UpdatePointRelaisDto extends PartialType(CreatePointRelaisDto) {}
