import { Test, TestingModule } from '@nestjs/testing';
import { ServiceController } from './service.controller';
import { ServiceService } from '../services/service.service';
import { ServiceCategory } from '../enums/service-category.enum';

describe('ServiceController', () => {
  let controller: ServiceController;
  const serviceService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    getAvailableSlots: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        {
          provide: ServiceService,
          useValue: serviceService,
        },
      ],
    }).compile();

    controller = module.get(ServiceController);
    jest.clearAllMocks();
  });

  it('findAll() should normalize query parameters', async () => {
    const data = [{ id: 'service-1' }];
    serviceService.findAll.mockResolvedValue(data);

    const result = await controller.findAll('beauty', 'true');

    expect(serviceService.findAll).toHaveBeenCalledWith({
      category: ServiceCategory.BEAUTY,
      isActive: true,
    });
    expect(result).toEqual({
      success: true,
      message: 'Services retrieved successfully',
      data,
    });
  });

  it('findById() should wrap the service response', async () => {
    const data = { id: 'service-1' };
    serviceService.findById.mockResolvedValue(data);

    await expect(controller.findById('service-1')).resolves.toEqual({
      success: true,
      message: 'Service retrieved successfully',
      data,
    });
  });

  it('create() should wrap the created service', async () => {
    const dto = { name: 'Massage' };
    const data = { id: 'service-1', ...dto };
    serviceService.create.mockResolvedValue(data);

    await expect(controller.create(dto as any)).resolves.toEqual({
      success: true,
      message: 'Service created successfully',
      data,
    });
  });

  it('update() should wrap the updated service', async () => {
    const data = { id: 'service-1', name: 'Updated' };
    serviceService.update.mockResolvedValue(data);

    await expect(controller.update('service-1', { name: 'Updated' } as any)).resolves.toEqual({
      success: true,
      message: 'Service updated successfully',
      data,
    });
  });

  it('patch() should wrap the patched service', async () => {
    const data = { id: 'service-1', isActive: false };
    serviceService.patch.mockResolvedValue(data);

    await expect(controller.patch('service-1', { isActive: false })).resolves.toEqual({
      success: true,
      message: 'Service patched successfully',
      data,
    });
  });

  it('delete() should return a success response with null data', async () => {
    serviceService.delete.mockResolvedValue(undefined);

    await expect(controller.delete('service-1')).resolves.toEqual({
      success: true,
      message: 'Service deleted successfully',
      data: null,
    });
  });

  it('getAvailableSlots() should wrap available slot results', async () => {
    const data = ['09:00', '10:00'];
    serviceService.getAvailableSlots.mockResolvedValue(data);

    await expect(controller.getAvailableSlots('service-1', '2099-03-10')).resolves.toEqual({
      success: true,
      message: 'Available slots retrieved successfully',
      data,
    });
  });
});
