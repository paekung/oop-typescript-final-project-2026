import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseSchema } from '../database/database-schema.interface';
import { JsonDatabaseService } from '../database/json-database.service';
import { AppointmentEntity } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/appointment/update-appointment.dto';
import { PatchAppointmentDto } from '../dto/appointment/patch-appointment.dto';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';

interface AppointmentFilters {
  status?: AppointmentStatus;
  serviceId?: string;
  date?: string;
}

@Injectable()
export class AppointmentService {
  constructor(private readonly databaseService: JsonDatabaseService) {}

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
    const mins = (minutes % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
  }

  private addMinutesToTime(time: string, minutesToAdd: number): string {
    return this.minutesToTime(this.timeToMinutes(time) + minutesToAdd);
  }

  private hasTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
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

  private parseDateString(dateString: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    return parsedDate;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];

    return days[date.getDay()];
  }

  private ensureAppointmentIsModifiable(status: AppointmentStatus): void {
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(status)) {
      throw new BadRequestException('Cannot modify a finalized appointment');
    }
  }

  private validateCancellationInput(
    currentAppointment: AppointmentEntity,
    dto: PatchAppointmentDto,
  ): string | null | undefined {
    const targetStatus = dto.status ?? currentAppointment.status;
    const normalizedReason = dto.cancellationReason?.trim();

    if (dto.cancellationReason !== undefined && targetStatus !== AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cancellation reason can only be set for cancelled appointments');
    }

    if (targetStatus === AppointmentStatus.CANCELLED) {
      const cancellationReason = normalizedReason ?? currentAppointment.cancellationReason ?? undefined;

      if (!cancellationReason) {
        throw new BadRequestException('Cancellation reason is required');
      }

      return cancellationReason;
    }

    return dto.cancellationReason === undefined ? undefined : null;
  }

  private validateBookingRequest(
    data: DatabaseSchema,
    booking: {
      serviceId: string;
      appointmentDate: string;
      startTime: string;
      excludeAppointmentId?: string;
    },
  ): { serviceName: string; endTime: string } {
    const { serviceId, appointmentDate, startTime, excludeAppointmentId } = booking;
    const service = data.services.find((item) => item.id === serviceId);

    if (!service) throw new NotFoundException('Service not found');
    if (!service.isActive) throw new BadRequestException('Service is currently inactive');

    const parsedAppointmentDate = this.parseDateString(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedAppointmentDate < today) {
      throw new BadRequestException('Appointment date cannot be in the past');
    }

    if (parsedAppointmentDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      if (this.timeToMinutes(startTime) <= currentTimeMinutes) {
        throw new BadRequestException('Appointment time cannot be in the past');
      }
    }

    const dayName = this.getDayOfWeek(parsedAppointmentDate);
    if (!service.availableDays.includes(dayName)) {
      throw new BadRequestException(`Service is not available on ${dayName}`);
    }

    if (this.timeToMinutes(startTime) < this.timeToMinutes(service.startTime)) {
      throw new BadRequestException(`Service starts at ${service.startTime}`);
    }

    const endTime = this.addMinutesToTime(startTime, service.durationMinutes);

    if (this.timeToMinutes(endTime) > this.timeToMinutes(service.endTime)) {
      throw new BadRequestException(`Service ends at ${service.endTime}`);
    }

    const existingAppointments = data.appointments.filter((appointment) => {
      if (appointment.serviceId !== serviceId) {
        return false;
      }
      if (appointment.appointmentDate !== appointmentDate) {
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
      const existingEndWithBuffer = this.addMinutesToTime(existing.endTime, service.bufferMinutes);
      if (this.hasTimeOverlap(startTime, endTime, existing.startTime, existingEndWithBuffer)) {
        overlapCount++;
      }
    }

    if (overlapCount >= service.maxConcurrentBookings) {
      throw new ConflictException('Time slot is fully booked');
    }

    return { serviceName: service.name, endTime };
  }

  async create(dto: CreateAppointmentDto): Promise<AppointmentEntity> {
    const data = await this.databaseService.read();
    const { serviceName, endTime } = this.validateBookingRequest(data, {
      serviceId: dto.serviceId,
      appointmentDate: dto.appointmentDate,
      startTime: dto.startTime,
    });

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

  async createAppointment(dto: CreateAppointmentDto): Promise<AppointmentEntity> {
    return this.create(dto);
  }

  async findAll(filter: AppointmentFilters = {}): Promise<AppointmentEntity[]> {
    const data = await this.databaseService.read();

    return data.appointments.filter((appointment) => {
      if (filter.status && appointment.status !== filter.status) {
        return false;
      }
      if (filter.serviceId && appointment.serviceId !== filter.serviceId) {
        return false;
      }
      if (filter.date && appointment.appointmentDate !== filter.date) {
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
    this.ensureAppointmentIsModifiable(existing.status);

    const originalStatus = existing.status;

    const targetServiceId = dto.serviceId ?? existing.serviceId;
    const targetDate = dto.appointmentDate ?? existing.appointmentDate;
    const targetStartTime = dto.startTime ?? existing.startTime;
    const scheduleChanged =
      targetServiceId !== existing.serviceId ||
      targetDate !== existing.appointmentDate ||
      targetStartTime !== existing.startTime;

    const bookingDetails = scheduleChanged
      ? this.validateBookingRequest(data, {
          serviceId: targetServiceId,
          appointmentDate: targetDate,
          startTime: targetStartTime,
          excludeAppointmentId: id,
        })
      : {
          serviceName: existing.serviceName,
          endTime: existing.endTime,
        };

    const updated: AppointmentEntity = {
      ...existing,
      ...dto,
      status: originalStatus,
      serviceName: bookingDetails.serviceName,
      endTime: bookingDetails.endTime,
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
    this.ensureAppointmentIsModifiable(existing.status);

    if (dto.status && !this.isValidTransition(existing.status, dto.status)) {
      throw new BadRequestException(`Cannot change status from ${existing.status} to ${dto.status}`);
    }

    const cancellationReason = this.validateCancellationInput(existing, dto);
    
    const updated: AppointmentEntity = {
      ...existing,
      updatedAt: new Date(),
    };

    if (dto.status) {
      updated.status = dto.status;
    }

    if (cancellationReason !== undefined) {
      updated.cancellationReason = cancellationReason;
    }

    data.appointments[index] = updated;
    await this.databaseService.write(data);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const data = await this.databaseService.read();
    const exists = data.appointments.some((appointment) => appointment.id === id);

    if (!exists) {
      throw new NotFoundException('Appointment not found');
    }

    data.appointments = data.appointments.filter((appointment) => appointment.id !== id);
    await this.databaseService.write(data);
  }

  async remove(id: string): Promise<void> {
    await this.delete(id);
  }

  async cancel(id: string, reason: string): Promise<AppointmentEntity> {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      throw new BadRequestException('Cancellation reason is required');
    }

    return this.patch(id, { status: AppointmentStatus.CANCELLED, cancellationReason: trimmedReason });
  }

  async confirm(id: string): Promise<AppointmentEntity> {
    const existing = await this.findById(id);
    if (existing.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Only PENDING appointments can be confirmed');
    }
    return this.patch(id, { status: AppointmentStatus.CONFIRMED });
  }
}