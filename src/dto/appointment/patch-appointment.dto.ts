import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '../../enums/appointment-status.enum';

export class PatchAppointmentDto {
  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'สถานะการจองที่ต้องการเปลี่ยน' })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ example: 'ติดธุระด่วน', description: 'เหตุผลการยกเลิก' })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}