import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CancelAppointmentDto } from './appointment/cancel-appointment.dto';
import { CreateAppointmentDto } from './appointment/create-appointment.dto';
import { PatchAppointmentDto } from './appointment/patch-appointment.dto';
import { UpdateAppointmentDto } from './appointment/update-appointment.dto';
import {
  CreateServiceDto,
  EndTimeAfterStartTimeConstraint,
} from './service/create-service.dto';
import { PatchServiceDto } from './service/patch-service.dto';
import { UpdateServiceDto } from './service/update-service.dto';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { ServiceCategory } from '../enums/service-category.enum';

describe('DTO validation', () => {
  it('CreateServiceDto should transform and validate a valid payload', async () => {
    const dto = plainToInstance(CreateServiceDto, {
      name: '  Basic   Haircut  ',
      description: '  Wash   and trim  ',
      category: 'beauty',
      durationMinutes: 60,
      price: 499.99,
      providerName: '  Salon   One ',
      availableDays: 'monday',
      startTime: '09:00',
      endTime: '18:00',
      maxConcurrentBookings: 2,
      bufferMinutes: 15,
      isActive: true,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.name).toBe('Basic Haircut');
    expect(dto.description).toBe('Wash and trim');
    expect(dto.category).toBe(ServiceCategory.BEAUTY);
    expect(dto.providerName).toBe('Salon One');
    expect(dto.availableDays).toEqual([DayOfWeek.MONDAY]);
  });

  it('CreateServiceDto should reject invalid HTML, duplicated days and invalid end time', async () => {
    const dto = plainToInstance(CreateServiceDto, {
      name: '<b>Bad</b>',
      description: 'ok',
      category: ServiceCategory.BEAUTY,
      durationMinutes: 60,
      price: 100,
      providerName: 'Provider',
      availableDays: [DayOfWeek.MONDAY, DayOfWeek.MONDAY],
      startTime: '10:00',
      endTime: '09:00',
      maxConcurrentBookings: 1,
      bufferMinutes: 0,
      isActive: true,
    });

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toContain('name must not contain HTML tags');
    expect(messages).toContain('All availableDays\'s elements must be unique');
    expect(messages).toContain('endTime must be after startTime');
  });

  it('CreateAppointmentDto should validate a correct payload', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      serviceId: '123e4567-e89b-12d3-a456-426614174000',
      customerName: 'Somchai Jaidee',
      customerEmail: 'somchai@email.com',
      customerPhone: '0812345678',
      appointmentDate: '2099-03-10',
      startTime: '09:00',
      notes: 'Need quiet room',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('CreateServiceDto should keep invalid non-string availableDays values for validator errors', async () => {
    const dto = plainToInstance(CreateServiceDto, {
      name: 'Valid name',
      description: 'Valid description',
      category: ServiceCategory.BEAUTY,
      durationMinutes: 60,
      price: 100,
      providerName: 'Provider',
      availableDays: { day: 'monday' },
      startTime: '09:00',
      endTime: '10:00',
      maxConcurrentBookings: 1,
      bufferMinutes: 0,
      isActive: true,
    });

    const errors = await validate(dto);
    const availableDaysError = errors.find((error) => error.property === 'availableDays');

    expect(availableDaysError?.constraints).toEqual(
      expect.objectContaining({
        isArray: 'availableDays must be an array',
      }),
    );
  });

  it('CreateAppointmentDto should reject invalid phone and time', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      serviceId: 'not-a-uuid',
      customerName: 'Somchai Jaidee',
      customerEmail: 'invalid-email',
      customerPhone: '12345',
      appointmentDate: '03/10/2099',
      startTime: '9:00',
    });

    const errors = await validate(dto);
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));

    expect(messages).toContain('serviceId must be a UUID');
    expect(messages).toContain('customerEmail must be an email');
    expect(messages).toContain('customerPhone must be a valid Thai phone number (e.g., 0812345678)');
    expect(messages).toContain('AppointmentDate must be in YYYY-MM-DD');
    expect(messages).toContain('startTime must be in HH:mm format (00:00 - 23:59)');
  });

  it('PatchAppointmentDto and CancelAppointmentDto should validate optional and required fields', async () => {
    const patchDto = plainToInstance(PatchAppointmentDto, {
      status: AppointmentStatus.CONFIRMED,
      cancellationReason: 'Need to reschedule',
    });
    const cancelDto = plainToInstance(CancelAppointmentDto, {
      cancellationReason: '',
    });

    const patchErrors = await validate(patchDto);
    const cancelErrors = await validate(cancelDto);

    expect(patchErrors).toHaveLength(0);
    expect(cancelErrors[0].constraints).toEqual(
      expect.objectContaining({
        isNotEmpty: 'Cancellation reason is required',
      }),
    );
  });

  it('should instantiate update and patch dto variants', () => {
    expect(new UpdateServiceDto()).toBeInstanceOf(UpdateServiceDto);
    expect(new PatchServiceDto()).toBeInstanceOf(PatchServiceDto);
    expect(new UpdateAppointmentDto()).toBeInstanceOf(UpdateAppointmentDto);
  });

  it('EndTimeAfterStartTimeConstraint should expose the default message', () => {
    const constraint = new EndTimeAfterStartTimeConstraint();

    expect(constraint.defaultMessage()).toBe('endTime must be after startTime');
    expect(
      constraint.validate('11:00', { object: { startTime: '10:00' } } as any),
    ).toBe(true);
    expect(
      constraint.validate('09:00', { object: { startTime: '10:00' } } as any),
    ).toBe(false);
  });
});
