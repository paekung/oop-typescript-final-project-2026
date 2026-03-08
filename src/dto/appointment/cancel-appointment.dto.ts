import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const normalizeWhitespace = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class CancelAppointmentDto {
  @ApiProperty({ example: 'Urgent personal matters', description: 'Reason for canceling the appointment' })
  @Transform(({ value }) => normalizeWhitespace(value))
  @IsString()
  @IsNotEmpty({ message: 'Cancellation reason is required' })
  cancellationReason!: string;
}