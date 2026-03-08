import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseSchema } from '../database/database-schema.interface';
import { JsonDatabaseService } from '../database/json-database.service';
import { CreateAppointmentDto } from '../dto/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/appointment/update-appointment.dto';
import { AppointmentEntity } from '../entities/appointment.entity';
import { ServiceEntity } from '../entities/service.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { ServiceCategory } from '../enums/service-category.enum';
import { AppointmentService } from './appointment.service';

const createDatabaseServiceMock = () => ({
  read: jest.fn(),
  write: jest.fn(),
  reset: jest.fn(),
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

const localDayOfWeek = (dateString: string): DayOfWeek => {
  const [yyyy, mm, dd] = dateString.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  const dayNames = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];

  return dayNames[date.getDay()];
};

const formatLocalDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const buildDatabase = (overrides: Partial<DatabaseSchema> = {}): DatabaseSchema => ({
  services: [],
  appointments: [],
  ...overrides,
});

describe('AppointmentService', () => {
  let service: AppointmentService;
  let databaseService: ReturnType<typeof createDatabaseServiceMock>;

  beforeEach(async () => {
    databaseService = createDatabaseServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: JsonDatabaseService,
          useValue: databaseService,
        },
      ],
    }).compile();

    service = module.get(AppointmentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create() should create a pending appointment with calculated end time', async () => {
    const dto = buildCreateAppointmentDto({
      serviceId: 'service-1',
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
      customerPhone: '0812345678',
      appointmentDate: '2099-03-10',
      startTime: '09:30',
      notes: 'Window seat',
    });
    databaseService.read.mockResolvedValue(
      buildDatabase({
        services: [buildService()],
        appointments: [],
      }),
    );

    const result = await service.create(dto);

    expect(result).toMatchObject({
      ...dto,
      serviceName: 'Consultation',
      endTime: '10:30',
      status: AppointmentStatus.PENDING,
      notes: 'Window seat',
    });
    expect(databaseService.write).toHaveBeenCalled();
  });

  it('create() should throw when service is missing', async () => {
    databaseService.read.mockResolvedValue(buildDatabase());

    await expect(
      service.create(buildCreateAppointmentDto({
        serviceId: 'missing',
        appointmentDate: '2099-03-10',
        startTime: '09:00',
      })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create() should reject inactive services', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({ services: [buildService({ isActive: false })] }),
    );

    await expect(
      service.create(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
        startTime: '09:00',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create() should reject past dates', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    databaseService.read.mockResolvedValue(
      buildDatabase({ services: [buildService()] }),
    );

    await expect(
      service.create(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: formatLocalDate(yesterday),
        startTime: '09:00',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create() should reject invalid date values', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({ services: [buildService()] }),
    );

    await expect(
      service.create(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: '2099-02-30',
        startTime: '09:00',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create() should reject unavailable days', async () => {
    const serviceDate = '2099-03-10';
    const requestDay = localDayOfWeek(serviceDate);
    const unavailableDays = Object.values(DayOfWeek).filter((day) => day !== requestDay);

    databaseService.read.mockResolvedValue(
      buildDatabase({ services: [buildService({ availableDays: unavailableDays })] }),
    );

    await expect(
      service.create(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: serviceDate,
        startTime: '09:00',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create() should reject times before service hours', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({ services: [buildService({ startTime: '10:00' })] }),
    );

    await expect(
      service.create(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
        startTime: '09:30',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create() should reject times after service end', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({ services: [buildService({ endTime: '10:00' })] }),
    );

    await expect(
      service.create(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
        startTime: '09:30',
      })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create() should reject fully booked overlapping slots', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({
        services: [buildService({ bufferMinutes: 15, maxConcurrentBookings: 1 })],
        appointments: [
          buildAppointment({ startTime: '09:00', endTime: '10:00', status: AppointmentStatus.CONFIRMED }),
        ],
      }),
    );

    await expect(
      service.create(buildCreateAppointmentDto({
        serviceId: 'service-1',
        appointmentDate: '2099-03-10',
        startTime: '10:05',
      })),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('findAll() should forward filters to repository', async () => {
    const rows = [buildAppointment()];
    databaseService.read.mockResolvedValue(buildDatabase({ appointments: rows }));

    const result = await service.findAll({
      status: AppointmentStatus.PENDING,
      serviceId: 'service-1',
      date: '2099-03-10',
    });

    expect(result).toEqual(rows);
  });

  it('findById() should return the appointment when found', async () => {
    const entity = buildAppointment();
    databaseService.read.mockResolvedValue(buildDatabase({ appointments: [entity] }));

    await expect(service.findById('appointment-1')).resolves.toEqual(entity);
  });

  it('findById() should throw when appointment is missing', async () => {
    databaseService.read.mockResolvedValue(buildDatabase());

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update() should reject finalized appointments', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({
        appointments: [buildAppointment({ status: AppointmentStatus.COMPLETED })],
      }),
    );

    await expect(
      service.update('appointment-1', buildUpdateAppointmentDto({ startTime: '11:00' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('update() should recalculate booking and preserve original status', async () => {
    const existing = buildAppointment({ status: AppointmentStatus.CONFIRMED });

    databaseService.read.mockResolvedValue(
      buildDatabase({
        appointments: [existing],
        services: [buildService()],
      }),
    );

    const result = await service.update('appointment-1', buildUpdateAppointmentDto({
      startTime: '11:00',
      notes: 'Updated note',
    }));

    expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    expect(result.endTime).toBe('12:00');
    expect(databaseService.write).toHaveBeenCalled();
  });

  it('update() should reuse the existing schedule when only non-time fields change', async () => {
    const existing = buildAppointment({ status: AppointmentStatus.PENDING });

    databaseService.read.mockResolvedValue(
      buildDatabase({
        appointments: [existing],
        services: [buildService()],
      }),
    );

    const result = await service.update('appointment-1', buildUpdateAppointmentDto({
      notes: 'Only notes changed',
    }));

    expect(result.startTime).toBe('09:00');
    expect(result.notes).toBe('Only notes changed');
  });

  it('patch() should reject finalized appointments', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({
        appointments: [buildAppointment({ status: AppointmentStatus.CANCELLED })],
      }),
    );

    await expect(service.patch('appointment-1', { cancellationReason: 'Later' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('patch() should reject invalid status transitions', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({
        appointments: [buildAppointment({ status: AppointmentStatus.PENDING })],
      }),
    );

    await expect(
      service.patch('appointment-1', { status: AppointmentStatus.COMPLETED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('patch() should update cancelled appointments with a cancellation reason', async () => {
    const existing = buildAppointment({ status: AppointmentStatus.PENDING });
    const saved = buildAppointment({
      status: AppointmentStatus.CANCELLED,
      cancellationReason: 'Moved schedule',
    });
    databaseService.read.mockResolvedValue(
      buildDatabase({ appointments: [existing] }),
    );

    const result = await service.patch('appointment-1', {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: 'Moved schedule',
    });

    expect(result).toMatchObject(saved);
    expect(databaseService.write).toHaveBeenCalled();
  });

  it('patch() should reject cancelling without a reason', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({ appointments: [buildAppointment({ status: AppointmentStatus.PENDING })] }),
    );

    await expect(
      service.patch('appointment-1', { status: AppointmentStatus.CANCELLED }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('patch() should reject cancellation reason for non-cancelled statuses', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({ appointments: [buildAppointment({ status: AppointmentStatus.PENDING })] }),
    );

    await expect(
      service.patch('appointment-1', {
        status: AppointmentStatus.CONFIRMED,
        cancellationReason: 'Not needed anymore',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('patch() should allow valid status transitions without changing cancellation reason', async () => {
    const existing = buildAppointment({ status: AppointmentStatus.CONFIRMED });
    const saved = buildAppointment({
      status: AppointmentStatus.NO_SHOW,
      cancellationReason: null,
    });
    databaseService.read.mockResolvedValue(
      buildDatabase({ appointments: [existing] }),
    );

    const result = await service.patch('appointment-1', {
      status: AppointmentStatus.NO_SHOW,
    });

    expect(result).toMatchObject(saved);
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

  it('delete() should delete the existing appointment', async () => {
    const existing = buildAppointment();
    databaseService.read.mockResolvedValue(
      buildDatabase({ appointments: [existing] }),
    );

    await service.delete('appointment-1');

    expect(databaseService.write).toHaveBeenCalledWith(
      expect.objectContaining({ appointments: [] }),
    );
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
    databaseService.read.mockResolvedValue(
      buildDatabase({
        appointments: [buildAppointment({ status: AppointmentStatus.CONFIRMED })],
      }),
    );

    await expect(service.confirm('appointment-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('confirm() should delegate to patch for pending appointments', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({
        appointments: [buildAppointment({ status: AppointmentStatus.PENDING })],
      }),
    );
    const confirmed = buildAppointment({ status: AppointmentStatus.CONFIRMED });
    const patchSpy = jest.spyOn(service, 'patch').mockResolvedValue(confirmed);

    const result = await service.confirm('appointment-1');

    expect(patchSpy).toHaveBeenCalledWith('appointment-1', {
      status: AppointmentStatus.CONFIRMED,
    });
    expect(result).toEqual(confirmed);
  });
});
