import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JsonDatabaseService } from '../database/json-database.service';
import { AppointmentEntity } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/appointment/update-appointment.dto';
import { PatchAppointmentDto } from '../dto/appointment/patch-appointment.dto';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';

@Injectable()
export class AppointmentService {
  constructor(private readonly databaseService: JsonDatabaseService) {}

  private addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMins = h * 60 + m + mins;
    const newH = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const newM = (totalMins % 60).toString().padStart(2, '0');
    return `${newH}:${newM}`;
  }

  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  private isValidTransition(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): boolean {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.CONFIRMED]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: [],
    };
    return validTransitions[currentStatus].includes(newStatus) ?? false;
  }

  private parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private async validateAndCalculateBooking(serviceId: string,appointmentDateStr: string,startTime: string,excludeAppointmentId?: string,):Promise<
  { serviceName: string; endTime: string }> {
    const data = await this.databaseService.read();
    const service = data.services.find((item) => item.id === serviceId);
    if (!service) throw new NotFoundException('Service not found');
    if (!service.isActive) throw new BadRequestException('Service is currently inactive');

    const appointmentDate = this.parseLocalDate(appointmentDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    if (appointmentDate < today) throw new BadRequestException('Appointment date cannot be in the past');

    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
      DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY
    ];
    const dayName = days[appointmentDate.getDay()];
    if (!service.availableDays.includes(dayName)) {
      throw new BadRequestException(`Service is not available on ${dayName}`);
    }

    if (startTime < service.startTime) throw new BadRequestException(`Service starts at ${service.startTime}`);
    const endTime = this.addMinutes(startTime, service.durationMinutes);
    if (endTime > service.endTime) throw new BadRequestException(`Service ends at ${service.endTime}`);

    const existingAppointments = data.appointments.filter((appointment) => {
      if (appointment.serviceId !== serviceId) {
        return false;
      }
      if (appointment.appointmentDate !== appointmentDateStr) {
        return false;
      }
      if (appointment.status === AppointmentStatus.CANCELLED) {
        return false;
      }
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        return false;
      }

      return true;
    });

    let overlapCount = 0;
    for (const existing of existingAppointments) {
      const existingEndWithBuffer = this.addMinutes(existing.endTime, service.bufferMinutes);
      if (this.isTimeOverlap(startTime, endTime, existing.startTime, existingEndWithBuffer)) {
        overlapCount++;
      }
    }

    if (overlapCount >= service.maxConcurrentBookings) {
      throw new ConflictException('Time slot is fully booked');
    }

    return { serviceName: service.name, endTime };
  }

  async createAppointment(dto: CreateAppointmentDto): Promise<AppointmentEntity> {
    const data = await this.databaseService.read();
    const { serviceName, endTime } = await this.validateAndCalculateBooking(
      dto.serviceId,
      dto.appointmentDate,
      dto.startTime
    );

    const now = new Date();
    const entity: AppointmentEntity = {
      ...dto,
      id: randomUUID(),
      serviceName,
      endTime,
      status: AppointmentStatus.PENDING,
      notes: dto.notes ?? '',
      cancellationReason: null,
      createdAt: now,
      updatedAt: now,
    };

    data.appointments.push(entity);
    await this.databaseService.write(data);

    return entity;
  }

  async findAll(status?: AppointmentStatus, serviceId?: string, date?: string): Promise<AppointmentEntity[]> {
    const data = await this.databaseService.read();

    return data.appointments.filter((appointment) => {
      if (status && appointment.status !== status) {
        return false;
      }
      if (serviceId && appointment.serviceId !== serviceId) {
        return false;
      }
      if (date && appointment.appointmentDate !== date) {
        return false;
      }

      return true;
    });
  }

  async findById(id: string): Promise<AppointmentEntity> {
    const data = await this.databaseService.read();
    const appointment = data.appointments.find((item) => item.id === id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<AppointmentEntity> {
    const data = await this.databaseService.read();
    const index = data.appointments.findIndex((appointment) => appointment.id === id);

    if (index === -1) {
      throw new NotFoundException('Appointment not found');
    }

    const existing = data.appointments[index];

    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(existing.status)) {
      throw new BadRequestException('Cannot modify a finalized appointment');
    }

    const originalStatus = existing.status;

    const targetServiceId = dto.serviceId ?? existing.serviceId;
    const targetDate = dto.appointmentDate ?? existing.appointmentDate;
    const targetStartTime = dto.startTime ?? existing.startTime;

    const { serviceName, endTime } = await this.validateAndCalculateBooking(
      targetServiceId,
      targetDate,
      targetStartTime,
      id
    );

    const updated: AppointmentEntity = {
      ...existing,
      ...dto,
      status: originalStatus,
      serviceName,
      endTime,
      notes: dto.notes ?? existing.notes,
      cancellationReason: existing.cancellationReason,
      updatedAt: new Date(),
    };

    data.appointments[index] = updated;
    await this.databaseService.write(data);

    return updated;
  }

  async patch(id: string, dto: PatchAppointmentDto): Promise<AppointmentEntity> {
    const data = await this.databaseService.read();
    const index = data.appointments.findIndex((appointment) => appointment.id === id);

    if (index === -1) {
      throw new NotFoundException('Appointment not found');
    }

    const existing = data.appointments[index];
    
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(existing.status)) {
      throw new BadRequestException('Cannot modify a finalized appointment');
    }
    
    const updated: AppointmentEntity = {
      ...existing,
      updatedAt: new Date(),
    };

    if (dto.status) {
      if (!this.isValidTransition(existing.status, dto.status)) {
        throw new BadRequestException(`Cannot change status from ${existing.status} to ${dto.status}`);
      }
      updated.status = dto.status;
    }
    
    if (dto.cancellationReason !== undefined) {
      updated.cancellationReason = dto.cancellationReason;
    }
    
    data.appointments[index] = updated;
    await this.databaseService.write(data);

    return updated;
  }

  async remove(id: string): Promise<void> {
    const data = await this.databaseService.read();
    const exists = data.appointments.some((appointment) => appointment.id === id);

    if (!exists) {
      throw new NotFoundException('Appointment not found');
    }

    data.appointments = data.appointments.filter((appointment) => appointment.id !== id);
    await this.databaseService.write(data);
  }

  async cancel(id: string, reason: string): Promise<AppointmentEntity> {
    if (!reason) throw new BadRequestException('Cancellation reason is required');
    return this.patch(id, { status: AppointmentStatus.CANCELLED, cancellationReason: reason });
  }

  async confirm(id: string): Promise<AppointmentEntity> {
    const existing = await this.findById(id);
    if (existing.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Only PENDING appointments can be confirmed');
    }
    return this.patch(id, { status: AppointmentStatus.CONFIRMED });
  }
}