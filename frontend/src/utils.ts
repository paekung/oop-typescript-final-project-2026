import type {
  ActivityLogEntry,
  AppointmentStatus,
  ServiceFormValues,
} from './types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(value);
}

export function humanizeEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getChangedServiceFields(
  initialValues: ServiceFormValues,
  nextValues: ServiceFormValues,
): Partial<ServiceFormValues> {
  const changedEntries = Object.entries(nextValues).filter(([key, value]) => {
    const initialValue = initialValues[key as keyof ServiceFormValues];
    if (Array.isArray(value) && Array.isArray(initialValue)) {
      return JSON.stringify(value) !== JSON.stringify(initialValue);
    }

    return value !== initialValue;
  });

  return Object.fromEntries(changedEntries) as Partial<ServiceFormValues>;
}

export function getStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'yellow';
    case 'CONFIRMED':
      return 'blue';
    case 'COMPLETED':
      return 'green';
    case 'CANCELLED':
      return 'red';
    case 'NO_SHOW':
      return 'gray';
    default:
      return 'purple';
  }
}

export function createActivityId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function summarizeLog(entry: ActivityLogEntry): string {
  return `${entry.method} ${entry.path} · ${entry.status}`;
}
