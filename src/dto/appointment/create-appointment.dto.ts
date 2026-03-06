import { IsNotEmpty, IsString, IsEmail, IsUUID, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID ของบริการ' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ example: 'สมชาย ใจดี', description: 'ชื่อลูกค้า' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ example: 'somchai@email.com', description: 'อีเมลลูกค้า' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @ApiProperty({ example: '0812345678', description: 'เบอร์โทรลูกค้า' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiProperty({ example: '2026-03-10', description: 'วันที่จอง (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'appointmentDate ต้องอยู่ในรูปแบบ YYYY-MM-DD' })
  @IsNotEmpty()
  appointmentDate!: string;

  @ApiProperty({ example: '09:00', description: 'เวลาเริ่ม (HH:mm)' })
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, { message: 'startTime ต้องอยู่ในรูปแบบ HH:mm (00:00 - 23:59)' })
  @IsNotEmpty()
  startTime!: string;

  @ApiPropertyOptional({ example: 'ขอห้องแอร์เย็นๆ', description: 'หมายเหตุเพิ่มเติม' })
  @IsString()
  @IsOptional()
  notes?: string;
}