import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsInt, Min, IsNumber, Matches, IsArray, ArrayMinSize, IsBoolean, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ServiceCategory } from '../../enums/service-category.enum';
import { DayOfWeek } from '../../enums/day-of-week.enum';

export class CreateServiceDto {
  @ApiProperty({ maxLength: 50 })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().replace(/\s+/g, ' ')
      : value,
  )//เอาช่องว่างที่เกินออก และแทนที่ด้วยช่องว่างเดียว กับ ช่องว่างหน้าหลังออก
  @IsString()
  @IsNotEmpty({ message: 'name must not be empty or whitespace only' })
  @MaxLength(50) 
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ enum: ServiceCategory })
  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  providerName!: string;

  @ApiProperty({ enum: DayOfWeek, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(DayOfWeek, { each: true })
  availableDays!: DayOfWeek[];

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be in HH:mm format' })
  endTime!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  maxConcurrentBookings!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  bufferMinutes!: number;

  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}
