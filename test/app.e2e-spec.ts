import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module';
import { AppointmentEntity } from './../src/entities/appointment.entity';
import { ServiceEntity } from './../src/entities/service.entity';
import { HttpExceptionFilter } from './../src/filters/http-exception.filter';

const formatDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getFutureDate = (daysAhead = 7): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return formatDate(date);
};

describe('Appointment Booking API (e2e)', () => {
  let app: INestApplication;
  let serviceRepo: Repository<ServiceEntity>;
  let appointmentRepo: Repository<AppointmentEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    serviceRepo = moduleFixture.get<Repository<ServiceEntity>>(
      getRepositoryToken(ServiceEntity),
    );
    appointmentRepo = moduleFixture.get<Repository<AppointmentEntity>>(
      getRepositoryToken(AppointmentEntity),
    );
  });

  beforeEach(async () => {
    await appointmentRepo.clear();
    await serviceRepo.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / should return 404', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  it('should return normalized validation errors for invalid service payloads', async () => {
    const response = await request(app.getHttpServer()).post('/services').send({
      name: '',
      description: 'desc',
      category: 'beauty',
      durationMinutes: 60,
      price: 100,
      providerName: 'provider',
      availableDays: ['MONDAY'],
      startTime: '09:00',
      endTime: '10:00',
      maxConcurrentBookings: 1,
      bufferMinutes: 0,
      isActive: true,
      unexpectedField: 'blocked',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Validation failed',
      data: {
        errors: expect.arrayContaining([
          'property unexpectedField should not exist',
          'name must not be empty or whitespace only',
        ]),
      },
    });
  });

  it('should manage service lifecycle and slot availability', async () => {
    const date = getFutureDate();

    const createResponse = await request(app.getHttpServer())
      .post('/services')
      .send({
        name: '  Basic   Haircut  ',
        description: '  Wash and trim  ',
        category: 'beauty',
        durationMinutes: 60,
        price: 350,
        providerName: '  Salon One ',
        availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        startTime: '09:00',
        endTime: '12:00',
        maxConcurrentBookings: 1,
        bufferMinutes: 0,
        isActive: true,
      })
      .expect(201);

    const serviceId = createResponse.body.data.id as string;

    expect(createResponse.body).toMatchObject({
      success: true,
      message: 'Service created successfully',
      data: {
        id: expect.any(String),
        name: 'Basic Haircut',
        description: 'Wash and trim',
        category: 'BEAUTY',
        providerName: 'Salon One',
      },
    });

    const listResponse = await request(app.getHttpServer())
      .get('/services')
      .query({ category: 'beauty', isActive: 'true' })
      .expect(200);

    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(serviceId);

    const detailResponse = await request(app.getHttpServer())
      .get(`/services/${serviceId}`)
      .expect(200);

    expect(detailResponse.body.data.id).toBe(serviceId);

    const slotsResponse = await request(app.getHttpServer())
      .get(`/services/${serviceId}/available-slots`)
      .query({ date })
      .expect(200);

    expect(slotsResponse.body).toEqual({
      success: true,
      message: 'Available slots retrieved successfully',
      data: ['09:00', '10:00', '11:00'],
    });

    const patchResponse = await request(app.getHttpServer())
      .patch(`/services/${serviceId}`)
      .send({ isActive: false })
      .expect(200);

    expect(patchResponse.body.data.isActive).toBe(false);

    await request(app.getHttpServer())
      .get(`/services/${serviceId}/available-slots`)
      .query({ date })
      .expect(400)
      .expect((response: { body: unknown }) => {
        const { body } = response as { body: Record<string, unknown> };
        expect(body).toEqual({
          success: false,
          message: 'Service is currently inactive',
          data: null,
        });
      });
  });

  it('should manage appointment workflow, conflicts, cancellation, and service deletion rules', async () => {
    const date = getFutureDate();

    const serviceResponse = await request(app.getHttpServer())
      .post('/services')
      .send({
        name: 'Consultation',
        description: 'Business consultation',
        category: 'consulting',
        durationMinutes: 60,
        price: 1200,
        providerName: 'Advisor Team',
        availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        startTime: '09:00',
        endTime: '12:00',
        maxConcurrentBookings: 1,
        bufferMinutes: 0,
        isActive: true,
      })
      .expect(201);

    const serviceId = serviceResponse.body.data.id as string;

    const appointmentCreateResponse = await request(app.getHttpServer())
      .post('/appointments')
      .send({
        serviceId,
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '0812345678',
        appointmentDate: date,
        startTime: '09:00',
        notes: 'Initial meeting',
      })
      .expect(201);

    const appointmentId = appointmentCreateResponse.body.data.id as string;

    expect(appointmentCreateResponse.body).toMatchObject({
      success: true,
      message: 'Appointment created successfully',
      data: {
        id: expect.any(String),
        serviceId,
        serviceName: 'Consultation',
        status: 'PENDING',
        endTime: '10:00',
      },
    });

    const appointmentListResponse = await request(app.getHttpServer())
      .get('/appointments')
      .query({ status: 'PENDING', serviceId, date })
      .expect(200);

    expect(appointmentListResponse.body.data).toHaveLength(1);
    expect(appointmentListResponse.body.data[0].id).toBe(appointmentId);

    const appointmentDetailResponse = await request(app.getHttpServer())
      .get(`/appointments/${appointmentId}`)
      .expect(200);

    expect(appointmentDetailResponse.body.data.id).toBe(appointmentId);

    await request(app.getHttpServer())
      .patch(`/appointments/${appointmentId}/confirm`)
      .expect(200)
      .expect((response: { body: unknown }) => {
        const { body } = response as { body: { success: boolean; data: { status: string } } };
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('CONFIRMED');
      });

    await request(app.getHttpServer())
      .post('/appointments')
      .send({
        serviceId,
        customerName: 'John Smith',
        customerEmail: 'john@example.com',
        customerPhone: '0899999999',
        appointmentDate: date,
        startTime: '09:00',
      })
      .expect(409)
      .expect((response: { body: unknown }) => {
        const { body } = response as { body: Record<string, unknown> };
        expect(body).toEqual({
          success: false,
          message: 'Time slot is fully booked',
          data: null,
        });
      });

    await request(app.getHttpServer())
      .delete(`/services/${serviceId}`)
      .expect(400)
      .expect((response: { body: unknown }) => {
        const { body } = response as { body: Record<string, unknown> };
        expect(body).toEqual({
          success: false,
          message: 'Cannot delete service with active appointments',
          data: null,
        });
      });

    await request(app.getHttpServer())
      .patch(`/appointments/${appointmentId}/cancel`)
      .send({ cancellationReason: 'Need to reschedule' })
      .expect(200)
      .expect((response: { body: unknown }) => {
        const { body } = response as {
          body: { success: boolean; data: { status: string; cancellationReason: string } };
        };
        expect(body.success).toBe(true);
        expect(body.data.status).toBe('CANCELLED');
        expect(body.data.cancellationReason).toBe('Need to reschedule');
      });

    await request(app.getHttpServer())
      .get(`/services/${serviceId}/available-slots`)
      .query({ date })
      .expect(200)
      .expect((response: { body: unknown }) => {
        const { body } = response as { body: { data: string[] } };
        expect(body.data).toContain('09:00');
      });

    await request(app.getHttpServer())
      .delete(`/services/${serviceId}`)
      .expect(200)
      .expect((response: { body: unknown }) => {
        const { body } = response as { body: Record<string, unknown> };
        expect(body).toEqual({
          success: true,
          message: 'Service deleted successfully',
          data: null,
        });
      });
  });
});
