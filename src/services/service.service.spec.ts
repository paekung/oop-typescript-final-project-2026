import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity } from '../entities/appointment.entity';
import { ServiceEntity } from '../entities/service.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { ServiceCategory } from '../enums/service-category.enum';
import { ServiceService } from './service.service';

const createRepoMock = () => ({
  find: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  delete: jest.fn(),
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

describe('ServiceService', () => {
  let service: ServiceService;
  let serviceRepo: ReturnType<typeof createRepoMock>;
  let appointmentRepo: ReturnType<typeof createRepoMock>;

  beforeEach(async () => {
    serviceRepo = createRepoMock();
    appointmentRepo = createRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: getRepositoryToken(ServiceEntity),
          useValue: serviceRepo,
        },
        {
          provide: getRepositoryToken(AppointmentEntity),
          useValue: appointmentRepo,
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
    serviceRepo.find.mockResolvedValue(services);

    const result = await service.findAll({
      category: ServiceCategory.BEAUTY,
      isActive: true,
    });

    expect(result).toEqual(services);
    expect(serviceRepo.find).toHaveBeenCalledWith({
      where: { category: ServiceCategory.BEAUTY, isActive: true },
    });
  });

  it('findById() should return the service when found', async () => {
    const entity = buildService();
    serviceRepo.findOneBy.mockResolvedValue(entity);

    await expect(service.findById('service-1')).resolves.toEqual(entity);
  });

  it('findById() should throw when service is missing', async () => {
    serviceRepo.findOneBy.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create() should create and save a service', async () => {
    const dto = { name: 'Massage' } as any;
    const entity = buildService({ name: 'Massage' });
    serviceRepo.create.mockReturnValue(entity);
    serviceRepo.save.mockResolvedValue(entity);

    const result = await service.create(dto);

    expect(serviceRepo.create).toHaveBeenCalledWith(dto);
    expect(serviceRepo.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(entity);
  });

  it('update() should merge and save the updated service', async () => {
    const entity = buildService();
    const merged = buildService({ name: 'Updated name' });
    serviceRepo.findOneBy.mockResolvedValue(entity);
    serviceRepo.merge.mockReturnValue(merged);
    serviceRepo.save.mockResolvedValue(merged);

    const result = await service.update('service-1', { name: 'Updated name' } as any);

    expect(serviceRepo.merge).toHaveBeenCalledWith(entity, { name: 'Updated name' });
    expect(result).toEqual(merged);
  });

  it('patch() should merge partial changes and save', async () => {
    const entity = buildService();
    const merged = buildService({ isActive: false });
    serviceRepo.findOneBy.mockResolvedValue(entity);
    serviceRepo.merge.mockReturnValue(merged);
    serviceRepo.save.mockResolvedValue(merged);

    const result = await service.patch('service-1', { isActive: false });

    expect(serviceRepo.merge).toHaveBeenCalledWith(entity, { isActive: false });
    expect(result).toEqual(merged);
  });

  it('delete() should remove service when no active appointments exist', async () => {
    serviceRepo.findOneBy.mockResolvedValue(buildService());
    appointmentRepo.find.mockResolvedValue([]);
    appointmentRepo.delete.mockResolvedValue({ affected: 0 });
    serviceRepo.delete.mockResolvedValue({ affected: 1 });

    await service.delete('service-1');

    expect(appointmentRepo.find).toHaveBeenCalled();
    expect(appointmentRepo.delete).toHaveBeenCalledWith({ serviceId: 'service-1' });
    expect(serviceRepo.delete).toHaveBeenCalledWith('service-1');
  });

  it('delete() should reject when active appointments exist', async () => {
    serviceRepo.findOneBy.mockResolvedValue(buildService());
    appointmentRepo.find.mockResolvedValue([
      { id: 'appointment-1', status: AppointmentStatus.PENDING },
    ]);

    await expect(service.delete('service-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(serviceRepo.delete).not.toHaveBeenCalled();
  });

  it('getAvailableSlots() should reject inactive services', async () => {
    serviceRepo.findOneBy.mockResolvedValue(buildService({ isActive: false }));

    await expect(service.getAvailableSlots('service-1', '2099-03-10')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getAvailableSlots() should reject invalid date formats', async () => {
    serviceRepo.findOneBy.mockResolvedValue(buildService());

    await expect(service.getAvailableSlots('service-1', '10/03/2099')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getAvailableSlots() should return empty array for closed days', async () => {
    const date = '2099-03-10';
    const requestDay = localDayOfWeek(date);
    const closedDays = Object.values(DayOfWeek).filter((day) => day !== requestDay);
    serviceRepo.findOneBy.mockResolvedValue(buildService({ availableDays: closedDays }));

    await expect(service.getAvailableSlots('service-1', date)).resolves.toEqual([]);
    expect(appointmentRepo.find).not.toHaveBeenCalled();
  });

  it('getAvailableSlots() should filter overlaps and keep free slots', async () => {
    const date = '2099-03-10';
    const requestDay = localDayOfWeek(date);
    serviceRepo.findOneBy.mockResolvedValue(
      buildService({
        availableDays: [requestDay],
        startTime: '09:00',
        endTime: '12:00',
        durationMinutes: 60,
        bufferMinutes: 0,
        maxConcurrentBookings: 1,
      }),
    );
    appointmentRepo.find.mockResolvedValue([
      {
        id: 'appointment-1',
        serviceId: 'service-1',
        appointmentDate: date,
        startTime: '09:00',
        endTime: '10:00',
        status: AppointmentStatus.CONFIRMED,
      },
      {
        id: 'appointment-2',
        serviceId: 'service-1',
        appointmentDate: date,
        startTime: '11:00',
        endTime: '12:00',
        status: AppointmentStatus.PENDING,
      },
    ] as AppointmentEntity[]);

    const result = await service.getAvailableSlots('service-1', date);

    expect(result).toEqual(['10:00']);
    expect(appointmentRepo.find).toHaveBeenCalledWith({
      where: {
        serviceId: 'service-1',
        appointmentDate: date,
        status: expect.anything(),
      },
    });
  });

  it('getAvailableSlots() should allow concurrent capacity', async () => {
    const date = '2099-03-10';
    const requestDay = localDayOfWeek(date);
    serviceRepo.findOneBy.mockResolvedValue(
      buildService({
        availableDays: [requestDay],
        startTime: '09:00',
        endTime: '11:00',
        durationMinutes: 60,
        bufferMinutes: 0,
        maxConcurrentBookings: 2,
      }),
    );
    appointmentRepo.find.mockResolvedValue([
      {
        id: 'appointment-1',
        startTime: '09:00',
        endTime: '10:00',
        status: AppointmentStatus.CONFIRMED,
      },
    ] as AppointmentEntity[]);

    await expect(service.getAvailableSlots('service-1', date)).resolves.toEqual(['09:00', '10:00']);
  });
});
