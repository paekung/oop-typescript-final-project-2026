import { AppointmentEntity } from '../entities/appointment.entity';
import { ServiceEntity } from '../entities/service.entity';

export interface DatabaseSchema {
  services: ServiceEntity[];
  appointments: AppointmentEntity[];
}