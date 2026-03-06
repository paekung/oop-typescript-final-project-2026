import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsInt, Min, IsNumber, Matches, IsArray, ArrayMinSize, IsBoolean, MaxLength } from 'class-validator';
import { ServiceCategory } from '../../enums/service-category.enum';
import { DayOfWeek } from '../../enums/day-of-week.enum';

export class CreateServiceDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;//ชื่อบริการ

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;//รายละเอียดบริการ

  @ApiProperty({ enum: ServiceCategory })
  @IsEnum(ServiceCategory) // ข้อมูลต้องตรงกับค่าใน ServiceCategory (เช่น 'HEALTH', 'BEAUTY') เท่านั้น ส่งอย่างอื่นมาจะ Error
  category: ServiceCategory;//หมวดหมู่บริการ

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  durationMinutes: number;//ระยะเวลาบริการ (นาที)

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;//ราคาบริการ

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  providerName: string;//ชื่อผู้ให้บริการ

  @ApiProperty({ enum: DayOfWeek, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DayOfWeek, { each: true })
  availableDays: DayOfWeek[];//วันที่ให้บริการ (เช่น ['MONDAY', 'WEDNESDAY'])

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;//เวลาเริ่มต้นให้บริการ (รูปแบบ HH:mm)

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;//เวลาสิ้นสุดให้บริการ (รูปแบบ HH:mm)

  @ApiProperty({ default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  maxConcurrentBookings: number;//จำนวนสูงสุดของการจองพร้อมกันในช่วงเวลาเดียวกัน

  @ApiProperty({ default: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  bufferMinutes: number;//เวลาบัฟเฟอร์ระหว่างการจอง (นาที) เพื่อป้องกันการจองติดกันเกินไป

  @ApiProperty({ default: true })
  @IsBoolean()
  isActive: boolean;//สถานะการให้บริการ (เปิดใช้งานหรือไม่)
}
