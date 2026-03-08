import { AppointmentEntity } from '../entities/appointment.entity';
import { ServiceEntity } from '../entities/service.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { ServiceCategory } from '../enums/service-category.enum';
import { getMetadataArgsStorage } from 'typeorm';

describe('Domain models', () => {
  it('should allow assigning service entity properties', () => {
    const service = new ServiceEntity();
    service.id = 'service-1';
    service.name = 'Therapy';
    service.description = 'Full consultation';
    service.category = ServiceCategory.HEALTH;
    service.durationMinutes = 45;
    service.price = 1299.5;
    service.providerName = 'Clinic A';
    service.availableDays = [DayOfWeek.MONDAY, DayOfWeek.FRIDAY];
    service.startTime = '08:00';
    service.endTime = '17:00';
    service.maxConcurrentBookings = 2;
    service.bufferMinutes = 10;
    service.isActive = true;
    service.appointments = [];

    expect(service).toMatchObject({
      id: 'service-1',
      category: ServiceCategory.HEALTH,
      availableDays: [DayOfWeek.MONDAY, DayOfWeek.FRIDAY],
      price: 1299.5,
    });
  });

  it('should allow assigning appointment entity properties', () => {
    const appointment = new AppointmentEntity();
    appointment.id = 'appointment-1';
    appointment.serviceId = 'service-1';
    appointment.serviceName = 'Therapy';
    appointment.customerName = 'John Doe';
    appointment.customerEmail = 'john@example.com';
    appointment.customerPhone = '0899999999';
    appointment.appointmentDate = '2099-03-10';
    appointment.startTime = '09:00';
    appointment.endTime = '09:45';
    appointment.status = AppointmentStatus.PENDING;
    appointment.notes = 'First visit';
    appointment.cancellationReason = null;

    expect(appointment).toMatchObject({
      id: 'appointment-1',
      status: AppointmentStatus.PENDING,
      notes: 'First visit',
    });
  });

  it('should expose stable enum values', () => {
    expect(AppointmentStatus.NO_SHOW).toBe('NO_SHOW');
    expect(DayOfWeek.SUNDAY).toBe('SUNDAY');
    expect(ServiceCategory.OTHER).toBe('OTHER');
  });

  it('should expose the price transformer metadata', () => {
    const priceColumn = getMetadataArgsStorage().columns.find(
      (column) => column.target === ServiceEntity && column.propertyName === 'price',
    );
    const transformer = priceColumn?.options.transformer as {
      to: (value: number) => number;
      from: (value: string) => number;
    };

    expect(transformer.to(250.5)).toBe(250.5);
    expect(transformer.from('250.50')).toBe(250.5);
  });
});
