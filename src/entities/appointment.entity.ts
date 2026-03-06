// src/entities/appointment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { ServiceEntity } from './service.entity'; 

@Entity('appointments')
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  serviceId!: string;

  @Column({ length: 200 })
  serviceName!: string;

  @Column({ length: 200 })
  customerName!: string;

  @Column({ length: 200 })
  customerEmail!: string;

  @Column({ length: 20 })
  customerPhone!: string;

  @Column({ length: 10 })
  appointmentDate!: string;

  @Column({ length: 5 })
  startTime!: string;

  @Column({ length: 5 })
  endTime!: string;

  @Column({ type: 'varchar', length: 20, default: AppointmentStatus.PENDING })
  status!: AppointmentStatus;

  @Column({ type: 'text', default: '' })
  notes!: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => ServiceEntity, (service) => service.appointments)
  @JoinColumn({ name: 'serviceId' })
  service!: ServiceEntity;
}