import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../../enums/appointment-status.enum';

export class PatchAppointmentDto {
  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'The new status of the appointment' })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Urgent personal matters', description: 'Reason for canceling the appointment' })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}