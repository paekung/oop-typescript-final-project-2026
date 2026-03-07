import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsInt, Min, IsNumber, Matches, IsArray, ArrayMinSize, IsBoolean, MaxLength, Max } from 'class-validator';
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
  @Matches(/^[^<>]*$/, { message: 'name must not contain HTML tags' })
  name!: string;

  @ApiProperty({ maxLength: 500 })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().replace(/\s+/g, ' ')
      : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'description must not be empty or whitespace only' })
  @MaxLength(500)
  @Matches(/^[^<>]*$/, { message: 'description must not contain HTML tags' })
  description!: string;

  @ApiProperty({ enum: ServiceCategory })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(1440)
  durationMinutes!: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price must be a number with up to 2 decimal places' })
  @Min(0)
  @Max(10000000)
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
