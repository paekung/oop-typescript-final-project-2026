import type {
  AppointmentFilters,
  AppointmentFormValues,
  AppointmentStatus,
  DayOfWeek,
  FormPreset,
  ServiceCategory,
  ServiceFilters,
  ServiceFormValues,
} from './types';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'HEALTH',
  'BEAUTY',
  'CONSULTING',
  'EDUCATION',
  'FITNESS',
  'OTHER',
];

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export const DEFAULT_SERVICE_FILTERS: ServiceFilters = {
  category: '',
  isActive: '',
};

export const DEFAULT_APPOINTMENT_FILTERS: AppointmentFilters = {
  status: '',
  serviceId: '',
  date: '',
};

export const DEFAULT_SERVICE_FORM: ServiceFormValues = {
  name: '',
  description: '',
  category: 'HEALTH',
  durationMinutes: 60,
  price: 500,
  providerName: '',
  availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  startTime: '09:00',
  endTime: '18:00',
  maxConcurrentBookings: 1,
  bufferMinutes: 0,
  isActive: true,
};

export const DEFAULT_APPOINTMENT_FORM: AppointmentFormValues = {
  serviceId: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  appointmentDate: '',
  startTime: '09:00',
  notes: '',
};

export const SERVICE_FORM_PRESETS: FormPreset<ServiceFormValues>[] = [
  {
    id: 'thai-massage',
    label: 'Thai Massage',
    description: 'บริการสุขภาพแบบมาตรฐาน ใช้ได้ดีกับการเดโม slot และ duration',
    values: {
      name: 'Thai Massage',
      description: 'Traditional Thai massage for relaxation and muscle recovery.',
      category: 'HEALTH',
      durationMinutes: 90,
      price: 799,
      providerName: 'Siam Wellness Studio',
      availableDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      startTime: '10:00',
      endTime: '20:00',
      maxConcurrentBookings: 2,
      bufferMinutes: 15,
      isActive: true,
    },
  },
  {
    id: 'skin-consult',
    label: 'Skin Consultation',
    description: 'บริการแนว beauty/consulting สำหรับทดสอบ category และ provider ต่างกัน',
    values: {
      name: 'Skin Consultation',
      description: 'Professional facial skin analysis with personalized care plan.',
      category: 'BEAUTY',
      durationMinutes: 45,
      price: 1200,
      providerName: 'Glow Clinic',
      availableDays: ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      startTime: '11:00',
      endTime: '19:00',
      maxConcurrentBookings: 1,
      bufferMinutes: 10,
      isActive: true,
    },
  },
  {
    id: 'fitness-coaching',
    label: 'Personal Training',
    description: 'บริการสาย fitness สำหรับเดโม concurrent bookings และราคา',
    values: {
      name: 'Personal Training Session',
      description: 'One-on-one fitness coaching session focused on strength and mobility.',
      category: 'FITNESS',
      durationMinutes: 60,
      price: 1500,
      providerName: 'Core Fitness Lab',
      availableDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      startTime: '06:00',
      endTime: '21:00',
      maxConcurrentBookings: 3,
      bufferMinutes: 0,
      isActive: true,
    },
  },
];

export function createAppointmentFormPresets(serviceId: string, baseDate: string): FormPreset<AppointmentFormValues>[] {
  return [
    {
      id: 'new-customer',
      label: 'New Customer',
      description: 'ลูกค้าใหม่สำหรับทดสอบการสร้าง appointment ปกติ',
      values: {
        serviceId,
        customerName: 'Somchai Jaidee',
        customerEmail: 'somchai.jaidee@example.com',
        customerPhone: '0812345678',
        appointmentDate: baseDate,
        startTime: '10:00',
        notes: 'First visit. Please confirm available parking.',
      },
    },
    {
      id: 'vip-customer',
      label: 'VIP Customer',
      description: 'ลูกค้าประจำพร้อมโน้ตพิเศษ ใช้เดโม notes และ contact info',
      values: {
        serviceId,
        customerName: 'Suda Premium',
        customerEmail: 'suda.premium@example.com',
        customerPhone: '0898765432',
        appointmentDate: shiftDate(baseDate, 1),
        startTime: '14:00',
        notes: 'VIP customer. Please prepare a quiet private room.',
      },
    },
    {
      id: 'corporate-booking',
      label: 'Corporate Booking',
      description: 'ตัวอย่างข้อมูลแนวธุรกิจสำหรับใช้ทดสอบอีกเคสหนึ่ง',
      values: {
        serviceId,
        customerName: 'Narin Techawat',
        customerEmail: 'narin.techawat@example.com',
        customerPhone: '0861122334',
        appointmentDate: shiftDate(baseDate, 2),
        startTime: '16:00',
        notes: 'Corporate client. Needs a receipt under company name.',
      },
    },
  ];
}

function shiftDate(dateString: string, daysToAdd: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}
