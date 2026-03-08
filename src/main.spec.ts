import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';

describe('main bootstrap', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('should configure cors, filters, validation and swagger before listening', async () => {
    const enableCors = jest.fn();
    const useGlobalFilters = jest.fn();
    const useGlobalPipes = jest.fn();
    const listen = jest.fn().mockResolvedValue(undefined);
    const appMock = {
      enableCors,
      useGlobalFilters,
      useGlobalPipes,
      listen,
    };
    const create = jest.fn().mockResolvedValue(appMock);
    const createDocument = jest.fn().mockReturnValue({ openapi: '3.0.0' });
    const setup = jest.fn();
    const setTitle = jest.fn().mockReturnThis();
    const setDescription = jest.fn().mockReturnThis();
    const setVersion = jest.fn().mockReturnThis();
    const addTag = jest.fn().mockReturnThis();
    const build = jest.fn().mockReturnValue({ title: 'Appointment Booking System API' });

    class MockDocumentBuilder {
      setTitle = setTitle;
      setDescription = setDescription;
      setVersion = setVersion;
      addTag = addTag;
      build = build;
    }

    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: { create },
    }));
    jest.doMock('@nestjs/swagger', () => {
      const actual = jest.requireActual('@nestjs/swagger');

      return {
        ...actual,
        SwaggerModule: {
          ...actual.SwaggerModule,
          createDocument,
          setup,
        },
        DocumentBuilder: MockDocumentBuilder,
      };
    });

    await jest.isolateModulesAsync(async () => {
      await import('./main');
      await new Promise((resolve) => setImmediate(resolve));
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(enableCors).toHaveBeenCalledTimes(1);
    expect(useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(useGlobalPipes).toHaveBeenCalledTimes(1);
    expect(setTitle).toHaveBeenCalledWith('Appointment Booking System API');
    expect(setDescription).toHaveBeenCalledWith('REST API for managing services and appointment bookings');
    expect(setVersion).toHaveBeenCalledWith('1.0');
    expect(addTag).toHaveBeenNthCalledWith(1, 'services', 'Service management endpoints');
    expect(addTag).toHaveBeenNthCalledWith(2, 'appointments', 'Appointment booking endpoints');
    expect(createDocument).toHaveBeenCalledWith(appMock, { title: 'Appointment Booking System API' });
    expect(setup).toHaveBeenCalledWith('api', appMock, { openapi: '3.0.0' });
    expect(listen).toHaveBeenCalledWith(3000);
    expect(console.log).toHaveBeenCalledWith('Application is running on: http://localhost:3000');
    expect(console.log).toHaveBeenCalledWith('Swagger documentation: http://localhost:3000/api');

    const pipe = useGlobalPipes.mock.calls[0][0] as ValidationPipe & {
      validatorOptions?: { whitelist?: boolean; forbidNonWhitelisted?: boolean };
      isTransformEnabled?: boolean;
    };
    expect(pipe.validatorOptions).toEqual(
      expect.objectContaining({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    expect(pipe.isTransformEnabled).toBe(true);

    const filter = useGlobalFilters.mock.calls[0][0] as HttpExceptionFilter;
    expect(typeof filter.catch).toBe('function');
  });
});
