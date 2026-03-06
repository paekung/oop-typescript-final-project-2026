import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ServiceCategory } from '../enums/service-category.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { AppointmentEntity } from './appointment.entity';

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  category: ServiceCategory;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 200 })
  providerName: string;

  @Column({ type: 'simple-json' })
  availableDays: DayOfWeek[];

  @Column({ length: 5 })
  startTime: string;

  @Column({ length: 5 })
  endTime: string;

  @Column({ type: 'int', default: 1 })
  maxConcurrentBookings: number;

  @Column({ type: 'int', default: 0 })
  bufferMinutes: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AppointmentEntity, (appointment) => appointment.service)
  appointments: AppointmentEntity[];
}