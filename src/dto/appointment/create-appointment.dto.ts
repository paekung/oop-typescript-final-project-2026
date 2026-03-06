import { IsNotEmpty, IsString, IsEmail, IsUUID, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Service UUID' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ example: 'Somchai Jaidee', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'somchai@email.com', description: 'Customer email address' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @ApiProperty({ example: '0812345678', description: 'Customer phone number' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiProperty({ example: '2026-03-10', description: 'Date of appointment(YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'AppointmentDate must be in YYYY-MM-DD' })
  @IsNotEmpty()
  appointmentDate!: string;

  @ApiProperty({ example: '09:00', description: 'Start time (HH:mm)' })
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'startTime must be in HH:mm format (00:00 - 23:59)' })
  @IsNotEmpty()
  startTime!: string;

  @ApiPropertyOptional({ example: 'Prefer a cold air-conditioned room', description: 'Additional notes or special requests' })
  @IsString()
  @IsOptional()
  notes?: string;
}