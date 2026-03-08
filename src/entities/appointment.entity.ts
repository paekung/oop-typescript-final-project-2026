import { AppointmentStatus } from '../enums/appointment-status.enum';
import { ServiceEntity } from './service.entity';

export class AppointmentEntity {
  id!: string;

  serviceId!: string;

  serviceName!: string;

  customerName!: string;

  customerEmail!: string;

  customerPhone!: string;

  appointmentDate!: string;

  startTime!: string;

  endTime!: string;

  status!: AppointmentStatus;

  notes!: string;

  cancellationReason!: string | null;

  createdAt!: Date;

  updatedAt!: Date;

  service?: ServiceEntity;
}