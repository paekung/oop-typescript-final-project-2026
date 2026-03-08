import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateAppointmentDto } from '../dto/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/appointment/update-appointment.dto';
import { AppointmentEntity } from '../entities/appointment.entity';
import { ServiceEntity } from '../entities/service.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { ServiceCategory } from '../enums/service-category.enum';
import { AppointmentService } from './appointment.service';

const createRepoMock = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const buildService = (overrides: Partial<ServiceEntity> = {}): ServiceEntity => ({
  id: 'service-1',
  name: 'Consultation',
  description: 'Consultation service',
  category: ServiceCategory.CONSULTING,
  durationMinutes: 60,
  price: 1000,
  providerName: 'Provider',
  availableDays: Object.values(DayOfWeek),
  startTime: '09:00',
  endTime: '18:00',
  maxConcurrentBookings: 1,
  bufferMinutes: 15,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  appointments: [],
  ...overrides,
});

const buildAppointment = (overrides: Partial<AppointmentEntity> = {}): AppointmentEntity => ({
  id: 'appointment-1',
  serviceId: 'service-1',
  serviceName: 'Consultation',
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '0812345678',
  appointmentDate: '2099-03-10',
  startTime: '09:00',
  endTime: '10:00',
  status: AppointmentStatus.PENDING,
  notes: '',
  cancellationReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  service: buildService(),
  ...overrides,
});

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

const formatLocalDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

describe('AppointmentService', () => {
  let service: AppointmentService;
  let appointmentRepo: ReturnType<typeof createRepoMock>;
  let serviceRepo: ReturnType<typeof createRepoMock>;

  beforeEach(async () => {
    appointmentRepo = createRepoMock();
    serviceRepo = createRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: getRepositoryToken(AppointmentEntity),
          useValue: appointmentRepo,
        },
        {
          provide: getRepositoryToken(ServiceEntity),
          useValue: serviceRepo,
        },
      ],
    }).compile();

    service = module.get(AppointmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createAppointment() should create a pending appointment with calculated end time', async () => {
    const dto = buildCreateAppointmentDto({
      serviceId: 'service-1',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerPhone: '0812345678',
      appointmentDate: '2099-03-10',
      startTime: '09:30',
      notes: 'Window seat',
    });
    const entity = buildAppointment({
      startTime: '09:30',
      endTime: '10:30',
      notes: 'Window seat',
    });

    serviceRepo.findOneBy.mockResolvedValue(buildService());
    appointmentRepo.find.mockResolvedValue([]);
    appointmentRepo.create.mockReturnValue(entity);
    appointmentRepo.save.mockResolvedValue(entity);

    const result = await service.createAppointment(dto);

    expect(appointmentRepo.create).toHaveBeenCalledWith({
      ...dto,
      serviceName: 'Consultation',
      endTime: '10:30',
      status: AppointmentStatus.PENDING,
    });
    expect(result).toEqual(entity);
  });

  it('createAppointment() should throw when service is missing', async () => {
    serviceRepo.findOneBy.mockResolvedValue(null);

    await expect(
      service.createAppointment(buildCreateAppointmentDto({
        serviceId: 'missing',
        appointmentDate: '2099-03-10',
        startTime: '09:00',
      })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createAppointment() should reject inactive services', async () => {
    serviceRepo.findOneBy.mockResolvedValue(buildService({ isActive: false }));

    await expect(
      service.createAppointment(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
        startTime: '09:00',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createAppointment() should reject past dates', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    serviceRepo.findOneBy.mockResolvedValue(buildService());

    await expect(
      service.createAppointment(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: formatLocalDate(yesterday),
        startTime: '09:00',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createAppointment() should reject unavailable days', async () => {
    const serviceDate = '2099-03-10';
    const actualDayIndex = new Date(serviceDate).getDay();
    const dayNames = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    const unavailableDays = Object.values(DayOfWeek).filter((day) => day !== dayNames[actualDayIndex]);

    serviceRepo.findOneBy.mockResolvedValue(buildService({ availableDays: unavailableDays }));

    await expect(
      service.createAppointment(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: serviceDate,
        startTime: '09:00',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createAppointment() should reject times before service hours', async () => {
    serviceRepo.findOneBy.mockResolvedValue(buildService({ startTime: '10:00' }));

    await expect(
      service.createAppointment(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
        startTime: '09:30',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createAppointment() should reject times after service end', async () => {
    serviceRepo.findOneBy.mockResolvedValue(buildService({ endTime: '10:00' }));

    await expect(
      service.createAppointment(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
        startTime: '09:30',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createAppointment() should reject fully booked overlapping slots', async () => {
    serviceRepo.findOneBy.mockResolvedValue(buildService({ bufferMinutes: 15, maxConcurrentBookings: 1 }));
    appointmentRepo.find.mockResolvedValue([
      buildAppointment({ startTime: '09:00', endTime: '10:00', status: AppointmentStatus.CONFIRMED }),
    ]);

    await expect(
      service.createAppointment(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
        startTime: '10:05',
      })),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findAll() should forward filters to repository', async () => {
    const rows = [buildAppointment()];
    appointmentRepo.find.mockResolvedValue(rows);

    const result = await service.findAll(AppointmentStatus.PENDING, 'service-1', '2099-03-10');

    expect(result).toEqual(rows);
    expect(appointmentRepo.find).toHaveBeenCalledWith({
      where: {
        status: AppointmentStatus.PENDING,
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
      },
    });
  });

  it('findById() should return the appointment when found', async () => {
    const entity = buildAppointment();
    appointmentRepo.findOneBy.mockResolvedValue(entity);

    await expect(service.findById('appointment-1')).resolves.toEqual(entity);
  });

  it('findById() should throw when appointment is missing', async () => {
    appointmentRepo.findOneBy.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update() should reject finalized appointments', async () => {
    appointmentRepo.findOneBy.mockResolvedValue(buildAppointment({ status: AppointmentStatus.COMPLETED }));

    await expect(
      service.update('appointment-1', buildUpdateAppointmentDto({ startTime: '11:00' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('update() should recalculate booking and preserve original status', async () => {
    const existing = buildAppointment({ status: AppointmentStatus.CONFIRMED });
    const saved = buildAppointment({
      status: AppointmentStatus.CONFIRMED,
      startTime: '11:00',
      endTime: '12:00',
      notes: 'Updated note',
    });

    appointmentRepo.findOneBy.mockResolvedValue(existing);
    serviceRepo.findOneBy.mockResolvedValue(buildService());
    appointmentRepo.find.mockResolvedValue([]);
    appointmentRepo.save.mockResolvedValue(saved);

    const result = await service.update('appointment-1', buildUpdateAppointmentDto({
      startTime: '11:00',
      notes: 'Updated note',
    }));

    expect(appointmentRepo.find).toHaveBeenCalledWith({
      where: expect.objectContaining({
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
        id: expect.anything(),
      }),
    });
    expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    expect(result.endTime).toBe('12:00');
  });

  it('update() should reuse the existing schedule when only non-time fields change', async () => {
    const existing = buildAppointment({ status: AppointmentStatus.PENDING });
    const saved = buildAppointment({
      status: AppointmentStatus.PENDING,
      startTime: '09:00',
      endTime: '10:00',
      notes: 'Only notes changed',
    });

    appointmentRepo.findOneBy.mockResolvedValue(existing);
    serviceRepo.findOneBy.mockResolvedValue(buildService());
    appointmentRepo.find.mockResolvedValue([]);
    appointmentRepo.save.mockResolvedValue(saved);

    const result = await service.update('appointment-1', buildUpdateAppointmentDto({
      notes: 'Only notes changed',
    }));

    expect(result.startTime).toBe('09:00');
    expect(result.notes).toBe('Only notes changed');
  });

  it('patch() should reject finalized appointments', async () => {
    appointmentRepo.findOneBy.mockResolvedValue(buildAppointment({ status: AppointmentStatus.CANCELLED }));

    await expect(service.patch('appointment-1', { cancellationReason: 'Later' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('patch() should reject invalid status transitions', async () => {
    appointmentRepo.findOneBy.mockResolvedValue(buildAppointment({ status: AppointmentStatus.PENDING }));

    await expect(
      service.patch('appointment-1', { status: AppointmentStatus.COMPLETED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('patch() should update valid status transitions and cancellation reason', async () => {
    const existing = buildAppointment({ status: AppointmentStatus.PENDING });
    const saved = buildAppointment({
      status: AppointmentStatus.CONFIRMED,
      cancellationReason: 'Moved schedule',
    });
    appointmentRepo.findOneBy.mockResolvedValue(existing);
    appointmentRepo.save.mockResolvedValue(saved);

    const result = await service.patch('appointment-1', {
      status: AppointmentStatus.CONFIRMED,
      cancellationReason: 'Moved schedule',
    });

    expect(appointmentRepo.save).toHaveBeenCalled();
    expect(result).toEqual(saved);
  });

  it('patch() should allow valid status transitions without changing cancellation reason', async () => {
    const existing = buildAppointment({ status: AppointmentStatus.CONFIRMED });
    const saved = buildAppointment({
      status: AppointmentStatus.NO_SHOW,
      cancellationReason: null,
    });
    appointmentRepo.findOneBy.mockResolvedValue(existing);
    appointmentRepo.save.mockResolvedValue(saved);

    const result = await service.patch('appointment-1', {
      status: AppointmentStatus.NO_SHOW,
    });

    expect(result.status).toBe(AppointmentStatus.NO_SHOW);
    expect(result.cancellationReason).toBeNull();
  });

  it('should evaluate status transition helper results', () => {
    const transitionChecker = service as unknown as {
      isValidTransition: (
        currentStatus: AppointmentStatus,
        newStatus: AppointmentStatus,
      ) => boolean;
    };

    expect(
      transitionChecker.isValidTransition(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED),
    ).toBe(true);
    expect(
      transitionChecker.isValidTransition(AppointmentStatus.COMPLETED, AppointmentStatus.PENDING),
    ).toBe(false);
  });

  it('remove() should delete the existing appointment', async () => {
    const existing = buildAppointment();
    appointmentRepo.findOneBy.mockResolvedValue(existing);
    appointmentRepo.remove.mockResolvedValue(existing);

    await service.remove('appointment-1');

    expect(appointmentRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('cancel() should require a cancellation reason', async () => {
    await expect(service.cancel('appointment-1', '')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancel() should delegate to patch with cancelled status', async () => {
    const cancelled = buildAppointment({
      status: AppointmentStatus.CANCELLED,
      cancellationReason: 'Emergency',
    });
    const patchSpy = jest.spyOn(service, 'patch').mockResolvedValue(cancelled);

    const result = await service.cancel('appointment-1', 'Emergency');

    expect(patchSpy).toHaveBeenCalledWith('appointment-1', {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: 'Emergency',
    });
    expect(result).toEqual(cancelled);
  });

  it('confirm() should reject non-pending appointments', async () => {
    appointmentRepo.findOneBy.mockResolvedValue(buildAppointment({ status: AppointmentStatus.CONFIRMED }));

    await expect(service.confirm('appointment-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('confirm() should delegate to patch for pending appointments', async () => {
    appointmentRepo.findOneBy.mockResolvedValue(buildAppointment({ status: AppointmentStatus.PENDING }));
    const confirmed = buildAppointment({ status: AppointmentStatus.CONFIRMED });
    const patchSpy = jest.spyOn(service, 'patch').mockResolvedValue(confirmed);

    const result = await service.confirm('appointment-1');

    expect(patchSpy).toHaveBeenCalledWith('appointment-1', {
      status: AppointmentStatus.CONFIRMED,
    });
    expect(result).toEqual(confirmed);
  });
});
