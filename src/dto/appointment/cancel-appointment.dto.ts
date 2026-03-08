import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelAppointmentDto {
  @ApiProperty({ example: 'Urgent personal matters', description: 'Reason for canceling the appointment' })
  @IsString()
  @IsNotEmpty({ message: 'Cancellation reason is required' })
  cancellationReason!: string;
}