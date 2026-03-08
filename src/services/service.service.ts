import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { JsonDatabaseService } from '../database/json-database.service';
import { ServiceEntity } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/service/create-service.dto';
import { UpdateServiceDto } from '../dto/service/update-service.dto';
import { PatchServiceDto } from '../dto/service/patch-service.dto';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';
import { ServiceCategory } from '../enums/service-category.enum';

@Injectable()
export class ServiceService {
  constructor(private readonly databaseService: JsonDatabaseService) {}

  async findAll(filter: { category?: ServiceCategory; isActive?: boolean } = {}): Promise<ServiceEntity[]> {
    const data = await this.databaseService.read();

    return data.services.filter((service) => {
      if (filter.category && service.category !== filter.category) {
        return false;
      }
      if (filter.isActive !== undefined && service.isActive !== filter.isActive) {
        return false;
      }

      return true;
    });
  }

  async findById(id: string): Promise<ServiceEntity> {
    const data = await this.databaseService.read();
    const service = data.services.find((item) => item.id === id);
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto): Promise<ServiceEntity> {
    const data = await this.databaseService.read();
    const now = new Date();
    const entity: ServiceEntity = {
      ...dto,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      appointments: [],
    };

    data.services.push(entity);
    await this.databaseService.write(data);

    return entity;
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceEntity> {
    const data = await this.databaseService.read();
    const index = data.services.findIndex((service) => service.id === id);

    if (index === -1) {
      throw new NotFoundException('Service not found');
    }

    const current = data.services[index];
    const updated: ServiceEntity = {
      ...current,
      ...dto,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date(),
      appointments: current.appointments,
    };

    data.services[index] = updated;
    await this.databaseService.write(data);

    return updated;
  }

  async patch(id: string, dto: PatchServiceDto): Promise<ServiceEntity> {
    const existing = await this.findById(id);
    const data = await this.databaseService.read();
    const index = data.services.findIndex((service) => service.id === id);
    const updated: ServiceEntity = {
      ...existing,
      ...dto,
      updatedAt: new Date(),
    };

    data.services[index] = updated;
    await this.databaseService.write(data);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const data = await this.databaseService.read();
    const serviceExists = data.services.some((service) => service.id === id);

    if (!serviceExists) {
      throw new NotFoundException('Service not found');
    }

    const activeAppointments = data.appointments.filter(
      (appointment) =>
        appointment.serviceId === id &&
        [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appointment.status),
    );

    if (activeAppointments.length > 0) {
      throw new BadRequestException('Cannot delete service with active appointments');
    }

    data.appointments = data.appointments.filter((appointment) => appointment.serviceId !== id);
    data.services = data.services.filter((service) => service.id !== id);

    await this.databaseService.write(data);
  }

  async getAvailableSlots(serviceId: string, dateString: string): Promise<string[]> {
    const service = await this.findById(serviceId);

    // เช็กว่า Service เปิดให้บริการอยู่หรือไม่
    if (!service.isActive) {
      throw new BadRequestException('Service is currently inactive');
    }

    // 1. ตรวจสอบรูปแบบวันที่และวันเปิดให้บริการ
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    // แยก year/month/day แล้วสร้าง local Date เพื่อป้องกัน UTC offset ทำให้ getDay() คืนวันผิด
    const [yyyy, mm, dd] = dateString.split('-').map(Number);
    const date = new Date(yyyy, mm - 1, dd);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const requestDay = dayNames[date.getDay()] as DayOfWeek;
    
    if (!service.availableDays.includes(requestDay)) {
      // ถ้าไม่ใช่วันเปิดทำการ คืนค่า array ว่าง
      return [];
    }

    // 2. คำนวณช่วงเวลา (Slots) ทั้งหมดที่เป็นไปได้
    const slots: string[] = [];
    let currentMins = this.timeToMins(service.startTime);
    const endMins = this.timeToMins(service.endTime);
    const step = service.durationMinutes + service.bufferMinutes;

    // ลูปสร้างเวลาทีละช่วง
    while (currentMins + service.durationMinutes <= endMins) {
      slots.push(this.minsToTime(currentMins));
      currentMins += step;
    }

    // 3. ดึงคิวการจองที่มีอยู่แล้วในวันนั้น (ที่ไม่ใช่สถานะ CANCELLED)
    const data = await this.databaseService.read();
    const existingApps = data.appointments.filter(
      (appointment) =>
        appointment.serviceId === serviceId &&
        appointment.appointmentDate === dateString &&
        appointment.status !== AppointmentStatus.CANCELLED,
    );

    // 4 & 5. กรองเวลาที่ไม่ว่างออก (ตรวจจับ Overlap)
    return slots.filter(slotTime => {
      const slotStart = this.timeToMins(slotTime);
      const slotEnd = slotStart + service.durationMinutes;
      
      let overlaps = 0;
      for (const app of existingApps) {
        const appStart = this.timeToMins(app.startTime);
        const appEnd = this.timeToMins(app.endTime);
        
        // กฎการเช็ก Overlap: เวลาเริ่มใหม่ต้องน้อยกว่าเวลาจบเดิม AND เวลาจบใหม่ต้องมากกว่าเวลาเริ่มเดิม
        if (slotStart < appEnd && slotEnd > appStart) {
          overlaps++;
        }
      }
      
      // จะคืนค่าเฉพาะช่วงเวลาที่คนจองยังไม่เต็ม maxConcurrentBookings
      return overlaps < service.maxConcurrentBookings;
    });
  }

  // ==========================================
  // Helper functions for time calculation
  // ==========================================
  private timeToMins(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minsToTime(mins: number): string {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}