import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../../enums/appointment-status.enum';

const normalizeWhitespace = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class PatchAppointmentDto {
  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'The new status of the appointment' })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Urgent personal matters', description: 'Reason for canceling the appointment' })
  @Transform(({ value }) => normalizeWhitespace(value))
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}