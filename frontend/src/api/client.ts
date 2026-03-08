import { createActivityId } from '../utils';
import type {
  ActivityLogEntry,
  ApiResponse,
  Appointment,
  AppointmentFilters,
  AppointmentFormValues,
  AppointmentPatchValues,
  Service,
  ServiceFilters,
  ServiceFormValues,
} from '../types';

type ApiClientOptions = {
  baseUrl: string;
  onActivity?: (entry: ActivityLogEntry) => void;
};

export class ApiClientError extends Error {
  status?: number;
  responseBody?: unknown;

  constructor(message: string, status?: number, responseBody?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export function createApiClient(options: ApiClientOptions) {
  const normalizedBaseUrl = options.baseUrl.replace(/\/$/, '');

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${normalizedBaseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const responseBody = await parseBody(response);

    options.onActivity?.({
      id: createActivityId(),
      timestamp: new Date().toISOString(),
      method,
      path,
      status: response.status,
      ok: response.ok,
      requestBody: body,
      responseBody,
    });

    if (!response.ok) {
      throw new ApiClientError(getErrorMessage(responseBody), response.status, responseBody);
    }

    return responseBody as ApiResponse<T>;
  }

  return {
    listServices(filters: ServiceFilters) {
      return request<Service[]>('GET', `/services${toQueryString(filters)}`);
    },
    getService(id: string) {
      return request<Service>('GET', `/services/${id}`);
    },
    createService(payload: ServiceFormValues) {
      return request<Service>('POST', '/services', payload);
    },
    updateService(id: string, payload: ServiceFormValues) {
      return request<Service>('PUT', `/services/${id}`, payload);
    },
    patchService(id: string, payload: Partial<ServiceFormValues>) {
      return request<Service>('PATCH', `/services/${id}`, payload);
    },
    deleteService(id: string) {
      return request<null>('DELETE', `/services/${id}`);
    },
    getAvailableSlots(id: string, date: string) {
      return request<string[]>('GET', `/services/${id}/available-slots${toQueryString({ date })}`);
    },
    listAppointments(filters: AppointmentFilters) {
      return request<Appointment[]>('GET', `/appointments${toQueryString(filters)}`);
    },
    getAppointment(id: string) {
      return request<Appointment>('GET', `/appointments/${id}`);
    },
    createAppointment(payload: AppointmentFormValues) {
      return request<Appointment>('POST', '/appointments', payload);
    },
    updateAppointment(id: string, payload: Partial<AppointmentFormValues>) {
      return request<Appointment>('PUT', `/appointments/${id}`, payload);
    },
    patchAppointment(id: string, payload: AppointmentPatchValues) {
      return request<Appointment>('PATCH', `/appointments/${id}`, payload);
    },
    deleteAppointment(id: string) {
      return request<null>('DELETE', `/appointments/${id}`);
    },
    confirmAppointment(id: string) {
      return request<Appointment>('PATCH', `/appointments/${id}/confirm`);
    },
    cancelAppointment(id: string, cancellationReason: string) {
      return request<Appointment>('PATCH', `/appointments/${id}/cancel`, { cancellationReason });
    },
  };
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function toQueryString(filters: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function getErrorMessage(responseBody: unknown): string {
  if (
    responseBody &&
    typeof responseBody === 'object' &&
    'message' in responseBody &&
    typeof responseBody.message === 'string'
  ) {
    const maybeData = 'data' in responseBody ? responseBody.data : undefined;
    if (
      maybeData &&
      typeof maybeData === 'object' &&
      'errors' in maybeData &&
      Array.isArray(maybeData.errors)
    ) {
      return [responseBody.message, ...maybeData.errors].join(' · ');
    }

    return responseBody.message;
  }

  return 'Request failed';
}
