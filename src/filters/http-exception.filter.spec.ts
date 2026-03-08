import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as ArgumentsHost;

    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should map validation errors to a normalized payload', () => {
    filter.catch(
      new BadRequestException({
        message: ['name should not be empty', 'price must not be negative'],
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation failed',
      data: {
        errors: ['name should not be empty', 'price must not be negative'],
      },
    });
  });

  it('should map string http exception bodies', () => {
    filter.catch(new BadRequestException('Invalid request body'), host);

    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid request body',
      data: null,
    });
  });

  it('should map object http exception bodies with a single message', () => {
    filter.catch(
      new BadRequestException({
        message: 'Payload rejected',
        error: 'Bad Request',
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Payload rejected',
      data: null,
    });
  });

  it('should map unknown exceptions to internal server error', () => {
    filter.catch(new Error('Boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
      data: null,
    });
  });
});
