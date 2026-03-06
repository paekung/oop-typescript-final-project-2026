import { PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';

export class PatchServiceDto extends PartialType(CreateServiceDto) {}