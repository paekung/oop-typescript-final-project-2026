import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsEmail, IsUUID, Matches, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const normalizeWhitespace = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const normalizeThaiMobilePhone = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().replace(/[\s-]+/g, '');

  if (normalized.startsWith('+66')) {
    return `0${normalized.slice(3)}`;
  }

  return normalized;
};

export class CreateAppointmentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Service UUID' })
  @Transform(({ value }) => trimString(value))
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ example: 'Somchai Jaidee', description: 'Customer full name' })
  @Transform(({ value }) => normalizeWhitespace(value))
  @IsString()
  @IsNotEmpty({ message: 'customerName must not be empty or whitespace only' })
  @MaxLength(200)
  @Matches(/^[\p{L}](?:[\p{L}.'-]*)(?: [\p{L}][\p{L}.'-]*)*$/u, {
    message: 'customerName must contain only letters, spaces, apostrophes, dots, or hyphens',
  })
  customerName!: string;

  @ApiProperty({ example: 'somchai@email.com', description: 'Customer email address' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail(
    { allow_display_name: false, require_tld: true },
    { message: 'customerEmail must be a valid email address' },
  )
  @IsNotEmpty({ message: 'customerEmail must not be empty or whitespace only' })
  @MaxLength(200)
  customerEmail!: string;

  @ApiProperty({ example: '0812345678', description: 'Customer phone number' })
  @Transform(({ value }) => normalizeThaiMobilePhone(value))
  @IsString()
  @IsNotEmpty({ message: 'customerPhone must not be empty or whitespace only' })
  @MaxLength(12)
  @Matches(/^0[689]\d{8}$/, {
    message: 'customerPhone must be a valid Thai mobile number (e.g., 0812345678)',
  })
  customerPhone!: string;

  @ApiProperty({ example: '2026-03-10', description: 'Date of appointment(YYYY-MM-DD)' })
  @Transform(({ value }) => trimString(value))
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'AppointmentDate must be in YYYY-MM-DD' })
  @IsNotEmpty()
  appointmentDate!: string;

  @ApiProperty({ example: '09:00', description: 'Start time (HH:mm)' })
  @Transform(({ value }) => trimString(value))
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'startTime must be in HH:mm format (00:00 - 23:59)' })
  @IsNotEmpty()
  startTime!: string;

  @ApiPropertyOptional({ example: 'Prefer a cold air-conditioned room', description: 'Additional notes or special requests' })
  @Transform(({ value }) => normalizeWhitespace(value))
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Matches(/^[^<>]*$/, { message: 'notes must not contain HTML tags' })
  notes?: string;
}