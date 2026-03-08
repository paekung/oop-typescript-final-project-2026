export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ServiceCategory =
  | 'HEALTH'
  | 'BEAUTY'
  | 'CONSULTING'
  | 'EDUCATION'
  | 'FITNESS'
  | 'OTHER';

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type Service = {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  durationMinutes: number;
  price: number;
  providerName: string;
  availableDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  maxConcurrentBookings: number;
  bufferMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ServiceFormValues = {
  name: string;
  description: string;
  category: ServiceCategory;
  durationMinutes: number;
  price: number;
  providerName: string;
  availableDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  maxConcurrentBookings: number;
  bufferMinutes: number;
  isActive: boolean;
};

export type AppointmentFormValues = {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string;
  startTime: string;
  notes: string;
};

export type ServiceFilters = {
  category: '' | ServiceCategory;
  isActive: '' | 'true' | 'false';
};

export type AppointmentFilters = {
  status: '' | AppointmentStatus;
  serviceId: string;
  date: string;
};

export type AppointmentPatchValues = {
  status?: AppointmentStatus;
  cancellationReason?: string;
};

export type ActivityLogEntry = {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  ok: boolean;
  requestBody?: unknown;
  responseBody?: unknown;
};

export type FormPreset<T> = {
  id: string;
  label: string;
  description: string;
  values: T;
};
