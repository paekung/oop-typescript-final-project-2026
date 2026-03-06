import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ServiceEntity } from '../entities/service.entity';
import { AppointmentEntity } from '../entities/appointment.entity';
import { CreateServiceDto } from '../dto/service/create-service.dto';
import { UpdateServiceDto } from '../dto/service/update-service.dto';
import { PatchServiceDto } from '../dto/service/patch-service.dto';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepo: Repository<AppointmentEntity>,
  ) {}

  async findAll(): Promise<ServiceEntity[]> {
    return this.serviceRepo.find();
  }

  async findById(id: string): Promise<ServiceEntity> {
    const service = await this.serviceRepo.findOneBy({ id });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto): Promise<ServiceEntity> {
    const entity = this.serviceRepo.create(dto);
    return this.serviceRepo.save(entity);
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceEntity> {
    const service = await this.findById(id);//ตรวจสอบว่ามี Service อยู่จริงมั้ย
    const updated = this.serviceRepo.merge(service, dto);
    return this.serviceRepo.save(updated);
  }

  async patch(id: string, dto: PatchServiceDto): Promise<ServiceEntity> {
    const service = await this.findById(id);
    const updated = this.serviceRepo.merge(service, dto);
    return this.serviceRepo.save(updated);
  }

  async delete(id: string): Promise<void> {
    const service = await this.findById(id); //ตรวจสอบว่ามี Service อยู่จริงมั้ย
    
    // Check for active appointments before deleting
    const activeAppointments = await this.appointmentRepo.find({
      where: [
        { serviceId: id, status: AppointmentStatus.PENDING },
        { serviceId: id, status: AppointmentStatus.CONFIRMED }
      ]
    });

    if (activeAppointments.length > 0) {
      throw new BadRequestException('Cannot delete service with active appointments');
    }

    await this.serviceRepo.delete(id);
  }

  async getAvailableSlots(serviceId: string, dateString: string): Promise<string[]> {
    const service = await this.findById(serviceId);

    // เช็กว่า Service เปิดให้บริการอยู่หรือไม่
    if (!service.isActive) {
      throw new BadRequestException('Service is currently inactive');
    }

    // 1. ตรวจสอบรูปแบบวันที่และวันเปิดให้บริการ
    const date = new Date(dateString);
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
    const existingApps = await this.appointmentRepo.find({
      where: { 
        serviceId: serviceId, 
        appointmentDate: dateString,
        status: Not(AppointmentStatus.CANCELLED) 
      }
    });

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