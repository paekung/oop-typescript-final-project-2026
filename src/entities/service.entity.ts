import { ServiceCategory } from '../enums/service-category.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { AppointmentEntity } from './appointment.entity';

export class ServiceEntity {
  id!: string;

  name!: string;

  description!: string;

  category!: ServiceCategory;

  durationMinutes!: number;

  price!: number;

  providerName!: string;

  availableDays!: DayOfWeek[];

  startTime!: string;

  endTime!: string;

  maxConcurrentBookings!: number;

  bufferMinutes!: number;

  isActive!: boolean;

  createdAt!: Date;

  updatedAt!: Date;

  appointments?: AppointmentEntity[];
}