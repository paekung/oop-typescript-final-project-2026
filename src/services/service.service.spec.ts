import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseSchema } from '../database/database-schema.interface';
import { JsonDatabaseService } from '../database/json-database.service';
import { CreateServiceDto } from '../dto/service/create-service.dto';
import { UpdateServiceDto } from '../dto/service/update-service.dto';
import { AppointmentEntity } from '../entities/appointment.entity';
import { ServiceEntity } from '../entities/service.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { ServiceCategory } from '../enums/service-category.enum';
import { ServiceService } from './service.service';

const createDatabaseServiceMock = () => ({
  read: jest.fn(),
  write: jest.fn(),
  reset: jest.fn(),
});

const buildService = (overrides: Partial<ServiceEntity> = {}): ServiceEntity => ({
  id: 'service-1',
  name: 'Haircut',
  description: 'Standard haircut',
  category: ServiceCategory.BEAUTY,
  durationMinutes: 60,
  price: 499,
  providerName: 'Salon A',
  availableDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY],
  startTime: '09:00',
  endTime: '12:00',
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
  serviceName: 'Haircut',
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
  ...overrides,
});

const buildCreateServiceDto = (
  overrides: Partial<CreateServiceDto> = {},
): CreateServiceDto => ({
  name: 'Haircut',
  description: 'Standard haircut',
  category: ServiceCategory.BEAUTY,
  durationMinutes: 60,
  price: 499,
  providerName: 'Salon A',
  availableDays: [DayOfWeek.MONDAY],
  startTime: '09:00',
  endTime: '12:00',
  maxConcurrentBookings: 1,
  bufferMinutes: 15,
  isActive: true,
  ...overrides,
});

const buildUpdateServiceDto = (
  overrides: Partial<UpdateServiceDto> = {},
): UpdateServiceDto => ({
  name: 'Haircut',
  description: 'Standard haircut',
  category: ServiceCategory.BEAUTY,
  durationMinutes: 60,
  price: 499,
  providerName: 'Salon A',
  availableDays: [DayOfWeek.MONDAY],
  startTime: '09:00',
  endTime: '12:00',
  maxConcurrentBookings: 1,
  bufferMinutes: 15,
  isActive: true,
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

const buildDatabase = (overrides: Partial<DatabaseSchema> = {}): DatabaseSchema => ({
  services: [],
  appointments: [],
  ...overrides,
});

describe('ServiceService', () => {
  let service: ServiceService;
  let databaseService: ReturnType<typeof createDatabaseServiceMock>;

  beforeEach(async () => {
    databaseService = createDatabaseServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: JsonDatabaseService,
          useValue: databaseService,
        },
      ],
    }).compile();

    service = module.get(ServiceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findAll() should pass filters to repository', async () => {
    const services = [buildService()];
    databaseService.read.mockResolvedValue(buildDatabase({ services }));

    const result = await service.findAll({
      category: ServiceCategory.BEAUTY,
      isActive: true,
    });

    expect(result).toEqual(services);
  });

  it('findById() should return the service when found', async () => {
    const entity = buildService();
    databaseService.read.mockResolvedValue(buildDatabase({ services: [entity] }));

    await expect(service.findById('service-1')).resolves.toEqual(entity);
  });

  it('findById() should throw when service is missing', async () => {
    databaseService.read.mockResolvedValue(buildDatabase());

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create() should create and save a service', async () => {
    const dto = buildCreateServiceDto({ name: 'Massage' });
    const database = buildDatabase();
    databaseService.read.mockResolvedValue(database);

    const result = await service.create(dto);

    expect(result).toMatchObject({
      ...dto,
      name: 'Massage',
    });
    expect(databaseService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [expect.objectContaining({ name: 'Massage' })],
      }),
    );
  });

  it('update() should merge and save the updated service', async () => {
    const entity = buildService();
    const database = buildDatabase({ services: [entity] });
    databaseService.read.mockResolvedValue(database);

    const dto = buildUpdateServiceDto({ name: 'Updated name' });

    const result = await service.update('service-1', dto);

    expect(result).toMatchObject({
      id: 'service-1',
      name: 'Updated name',
    });
    expect(databaseService.write).toHaveBeenCalled();
  });

  it('patch() should merge partial changes and save', async () => {
    const entity = buildService();
    const database = buildDatabase({ services: [entity] });
    databaseService.read.mockResolvedValue(database);

    const result = await service.patch('service-1', { isActive: false });

    expect(result.isActive).toBe(false);
    expect(databaseService.write).toHaveBeenCalled();
  });

  it('delete() should remove service when no active appointments exist', async () => {
    const database = buildDatabase({
      services: [buildService()],
      appointments: [],
    });
    databaseService.read.mockResolvedValue(database);

    await service.delete('service-1');

    expect(databaseService.write).toHaveBeenCalledWith(
      expect.objectContaining({
        services: [],
        appointments: [],
      }),
    );
  });

  it('delete() should reject when active appointments exist', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({
        services: [buildService()],
        appointments: [buildAppointment({ status: AppointmentStatus.PENDING })],
      }),
    );

    await expect(service.delete('service-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(databaseService.write).not.toHaveBeenCalled();
  });

  it('getAvailableSlots() should reject inactive services', async () => {
    databaseService.read.mockResolvedValue(
      buildDatabase({ services: [buildService({ isActive: false })] }),
    );

    await expect(service.getAvailableSlots('service-1', '2099-03-10')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getAvailableSlots() should reject invalid date formats', async () => {
    databaseService.read.mockResolvedValue(buildDatabase({ services: [buildService()] }));

    await expect(service.getAvailableSlots('service-1', '10/03/2099')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getAvailableSlots() should return empty array for closed days', async () => {
    const date = '2099-03-10';
    const requestDay = localDayOfWeek(date);
    const closedDays = Object.values(DayOfWeek).filter((day) => day !== requestDay);
    databaseService.read.mockResolvedValue(
      buildDatabase({ services: [buildService({ availableDays: closedDays })] }),
    );

    await expect(service.getAvailableSlots('service-1', date)).resolves.toEqual([]);
  });

  it('getAvailableSlots() should filter overlaps and keep free slots', async () => {
    const date = '2099-03-10';
    const requestDay = localDayOfWeek(date);
    databaseService.read.mockResolvedValue(
      buildDatabase({
        services: [buildService({
          availableDays: [requestDay],
          startTime: '09:00',
          endTime: '12:00',
          durationMinutes: 60,
          bufferMinutes: 0,
          maxConcurrentBookings: 1,
        })],
        appointments: [
          buildAppointment({
            id: 'appointment-1',
            serviceId: 'service-1',
            appointmentDate: date,
            startTime: '09:00',
            endTime: '10:00',
            status: AppointmentStatus.CONFIRMED,
          }),
          buildAppointment({
            id: 'appointment-2',
            serviceId: 'service-1',
            appointmentDate: date,
            startTime: '11:00',
            endTime: '12:00',
            status: AppointmentStatus.PENDING,
          }),
        ],
      }),
    );

    const result = await service.getAvailableSlots('service-1', date);

    expect(result).toEqual(['10:00']);
  });

  it('getAvailableSlots() should allow concurrent capacity', async () => {
    const date = '2099-03-10';
    const requestDay = localDayOfWeek(date);
    databaseService.read.mockResolvedValue(
      buildDatabase({
        services: [buildService({
          availableDays: [requestDay],
          startTime: '09:00',
          endTime: '11:00',
          durationMinutes: 60,
          bufferMinutes: 0,
          maxConcurrentBookings: 2,
        })],
        appointments: [
          buildAppointment({
            id: 'appointment-1',
            startTime: '09:00',
            endTime: '10:00',
            status: AppointmentStatus.CONFIRMED,
          }),
        ],
      }),
    );

    await expect(service.getAvailableSlots('service-1', date)).resolves.toEqual(['09:00', '10:00']);
  });
});
