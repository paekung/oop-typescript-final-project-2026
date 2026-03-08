import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

type ValidationErrorPayload = {
  errors: string[];
};

type ErrorBody = {
  message?: string | string[];
  error?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.getStatus(exception);
    const payload = this.buildPayload(exception, status);

    console.error('[HttpExceptionFilter]', exception);
    response.status(status).json(payload);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private buildPayload(
    exception: unknown,
    status: number,
  ): ApiResponse<ValidationErrorPayload | null> {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      const normalizedBody = this.normalizeErrorBody(body);

      if (Array.isArray(normalizedBody.message)) {
        return {
          success: false,
          message: 'Validation failed',
          data: {
            errors: normalizedBody.message,
          },
        };
      }

      return {
        success: false,
        message: normalizedBody.message ?? exception.message,
        data: null,
      };
    }

    return {
      success: false,
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : 'Unexpected error',
      data: null,
    };
  }

  private normalizeErrorBody(body: string | ErrorBody): ErrorBody {
    if (typeof body === 'string') {
      return { message: body };
    }

    return body;
  }
}
