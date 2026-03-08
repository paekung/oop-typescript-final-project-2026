import { Test, TestingModule } from '@nestjs/testing';
import { CreateAppointmentDto } from '../dto/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/appointment/update-appointment.dto';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from '../services/appointment.service';
import { AppointmentStatus } from '../enums/appointment-status.enum';

const buildCreateAppointmentDto = (
  overrides: Partial<CreateAppointmentDto> = {},
): CreateAppointmentDto => ({
  serviceId: '123e4567-e89b-12d3-a456-426614174000',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '0812345678',
  appointmentDate: '2099-03-10',
  startTime: '09:00',
  notes: '',
  ...overrides,
});

const buildUpdateAppointmentDto = (
  overrides: Partial<UpdateAppointmentDto> = {},
): UpdateAppointmentDto => ({
  ...overrides,
});

describe('AppointmentController', () => {
  let controller: AppointmentController;
  const appointmentService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    cancel: jest.fn(),
    confirm: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        {
          provide: AppointmentService,
          useValue: appointmentService,
        },
      ],
    }).compile();

    controller = module.get(AppointmentController);
    jest.clearAllMocks();
  });

  it('findAll() should return wrapped appointments', async () => {
    const data = [{ id: 'appointment-1' }];
    appointmentService.findAll.mockResolvedValue(data);

    const result = await controller.findAll(AppointmentStatus.PENDING, 'service-1', '2099-03-10');

    expect(appointmentService.findAll).toHaveBeenCalledWith({
      status: AppointmentStatus.PENDING,
      serviceId: 'service-1',
      date: '2099-03-10',
    });
    expect(result).toEqual({
      success: true,
      message: 'Appointments retrieved successfully',
      data,
    });
  });

  it('findOne() should return wrapped appointment data', async () => {
    const data = { id: 'appointment-1' };
    appointmentService.findById.mockResolvedValue(data);

    await expect(controller.findOne('appointment-1')).resolves.toEqual({
      success: true,
      message: 'Appointment retrieved successfully',
      data,
    });
  });

  it('create() should return wrapped created appointment', async () => {
    const dto = buildCreateAppointmentDto({ serviceId: 'service-1' });
    const data = { id: 'appointment-1', ...dto };
    appointmentService.create.mockResolvedValue(data);

    await expect(controller.create(dto)).resolves.toEqual({
      success: true,
      message: 'Appointment created successfully',
      data,
    });
  });

  it('update() should return wrapped updated appointment', async () => {
    const data = { id: 'appointment-1', notes: 'Updated' };
    appointmentService.update.mockResolvedValue(data);

    await expect(controller.update('appointment-1', buildUpdateAppointmentDto({ notes: 'Updated' }))).resolves.toEqual({
      success: true,
      message: 'Appointment updated successfully',
      data,
    });
  });

  it('patch() should return wrapped patched appointment', async () => {
    const data = { id: 'appointment-1', status: AppointmentStatus.CONFIRMED };
    appointmentService.patch.mockResolvedValue(data);

    await expect(controller.patch('appointment-1', { status: AppointmentStatus.CONFIRMED })).resolves.toEqual({
      success: true,
      message: 'Appointment patched successfully',
      data,
    });
  });

  it('remove() should return wrapped delete result', async () => {
    appointmentService.delete.mockResolvedValue(undefined);

    await expect(controller.remove('appointment-1')).resolves.toEqual({
      success: true,
      message: 'Appointment deleted successfully',
      data: null,
    });
  });

  it('cancel() should return wrapped cancelled appointment', async () => {
    const data = { id: 'appointment-1', status: AppointmentStatus.CANCELLED };
    appointmentService.cancel.mockResolvedValue(data);

    await expect(controller.cancel('appointment-1', { cancellationReason: 'Emergency' })).resolves.toEqual({
      success: true,
      message: 'Appointment cancelled successfully',
      data,
    });
  });

  it('confirm() should return wrapped confirmed appointment', async () => {
    const data = { id: 'appointment-1', status: AppointmentStatus.CONFIRMED };
    appointmentService.confirm.mockResolvedValue(data);

    await expect(controller.confirm('appointment-1')).resolves.toEqual({
      success: true,
      message: 'Appointment confirmed successfully',
      data,
    });
  });
});
