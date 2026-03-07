import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindOptionsWhere } from 'typeorm';
import { AppointmentEntity } from '../entities/appointment.entity';
import { ServiceEntity } from '../entities/service.entity';
import { CreateAppointmentDto } from '../dto/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/appointment/update-appointment.dto';
import { PatchAppointmentDto } from '../dto/appointment/patch-appointment.dto';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { DayOfWeek } from '../enums/day-of-week.enum';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly appointmentRepo: Repository<AppointmentEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
  ) {}

  // --- Helper Methods ---

  private addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMins = h * 60 + m + mins;
    const newH = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const newM = (totalMins % 60).toString().padStart(2, '0');
    return `${newH}:${newM}`;
  }

  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  private isValidTransition(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): boolean {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.CONFIRMED]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.CANCELLED]: [],
      [AppointmentStatus.NO_SHOW]: [],
    };
    return validTransitions[currentStatus].includes(newStatus) ?? false;
  }

  // 🌟 แก้ไขจากเดิม: สร้าง Helper ฟังก์ชันรวม Logic การตรวจสอบกฎธุรกิจทั้งหมด
  // ทำให้เช็ค Conflict ได้แม่นยำ ทั้งตอน Create และ Update (ลดโค้ดซ้ำซ้อน)
  private async validateAndCalculateBooking(
    serviceId: string,
    appointmentDateStr: string,
    startTime: string,
    excludeAppointmentId?: string,
  ): Promise<{ serviceName: string; endTime: string }> {
    const service = await this.serviceRepo.findOneBy({ id: serviceId });
    if (!service) throw new NotFoundException('Service not found'); // ป้องกัน Error 500 FK Failed
    if (!service.isActive) throw new BadRequestException('Service is currently inactive');

    const appointmentDate = new Date(appointmentDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    if (appointmentDate < today) throw new BadRequestException('Appointment date cannot be in the past');

    const days: DayOfWeek[] = [
      DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
      DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY
    ];
    const dayName = days[appointmentDate.getDay()];
    if (!service.availableDays.includes(dayName)) {
      throw new BadRequestException(`Service is not available on ${dayName}`);
    }

    if (startTime < service.startTime) throw new BadRequestException(`Service starts at ${service.startTime}`);
    const endTime = this.addMinutes(startTime, service.durationMinutes);
    if (endTime > service.endTime) throw new BadRequestException(`Service ends at ${service.endTime}`);

    // ตรวจสอบ Time Slot Conflict
    const whereClause: FindOptionsWhere<AppointmentEntity> = { 
      serviceId: serviceId, 
      appointmentDate: appointmentDateStr,
      status: Not(AppointmentStatus.CANCELLED) 
    };
    
    // 🌟 แก้ไขจากเดิม: ถ้าระบุ excludeAppointmentId (ตอนทำ Update) จะไม่เอาตัวเองมาคิดเป็นคิวชน
    if (excludeAppointmentId) {
      whereClause.id = Not(excludeAppointmentId);
    }

    const existingAppointments = await this.appointmentRepo.find({ where: whereClause });

    let overlapCount = 0;
    for (const existing of existingAppointments) {
      const existingEndWithBuffer = this.addMinutes(existing.endTime, service.bufferMinutes);
      if (this.isTimeOverlap(startTime, endTime, existing.startTime, existingEndWithBuffer)) {
        overlapCount++;
      }
    }

    if (overlapCount >= service.maxConcurrentBookings) {
      throw new ConflictException('Time slot is fully booked');
    }

    return { serviceName: service.name, endTime };
  }

  // --- Main Service Methods ---

  async createAppointment(dto: CreateAppointmentDto): Promise<AppointmentEntity> {
    // 🌟 แก้ไขจากเดิม: เรียกใช้ Validate Helper ทีเดียวจบ โค้ดสั้นลงมาก
    const { serviceName, endTime } = await this.validateAndCalculateBooking(
      dto.serviceId,
      dto.appointmentDate,
      dto.startTime
    );

    const entity = this.appointmentRepo.create({
      ...dto,
      serviceName,
      endTime,
      status: AppointmentStatus.PENDING,
    });

    return this.appointmentRepo.save(entity);
  }

  async findAll(status?: AppointmentStatus, serviceId?: string, date?: string): Promise<AppointmentEntity[]> {
    const whereClause: FindOptionsWhere<AppointmentEntity> = {};
    if (status) whereClause.status = status;
    if (serviceId) whereClause.serviceId = serviceId;
    if (date) whereClause.appointmentDate = date;
    
    return this.appointmentRepo.find({ where: whereClause });
  }

  async findById(id: string): Promise<AppointmentEntity> {
    const appointment = await this.appointmentRepo.findOneBy({ id });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<AppointmentEntity> {
    const existing = await this.findById(id);
    
    // 🌟 แก้ไขจากเดิม: ห้ามแก้ข้อมูลหากนัดหมายจบสิ้นไปแล้ว
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(existing.status)) {
      throw new BadRequestException('Cannot modify a finalized appointment');
    }

    // 🌟 แก้ไขจากเดิม: จดจำสถานะเดิมไว้ เพื่อป้องกันการแอบเปลี่ยน Status ผ่าน Body โดยไม่ต้องพึ่ง type 'any'
    const originalStatus = existing.status;

    // เช็คข้อมูลใหม่ (ถ้ามี) หรือใช้ของเดิม เพื่อเอาไปคำนวณวัน/เวลา/Service ใหม่
    const targetServiceId = dto.serviceId ?? existing.serviceId;
    const targetDate = dto.appointmentDate ?? existing.appointmentDate;
    const targetStartTime = dto.startTime ?? existing.startTime;

    const { serviceName, endTime } = await this.validateAndCalculateBooking(
      targetServiceId,
      targetDate,
      targetStartTime,
      id // ส่ง ID ตัวเองไปยกเว้นการตรวจสอบคิวชน
    );

    // รวมข้อมูลใหม่เข้ากับของเดิม
    Object.assign(existing, dto);
    
    // 🌟 แก้ไขจากเดิม: ทับค่า Status เดิมกลับไป (ล้างสิ่งที่อาจแฝงมา) พร้อมอัปเดต Service/เวลา ใหม่
    existing.status = originalStatus;
    existing.serviceName = serviceName; 
    existing.endTime = endTime;         

    return this.appointmentRepo.save(existing);
  }

  async patch(id: string, dto: PatchAppointmentDto): Promise<AppointmentEntity> {
    const existing = await this.findById(id);
    
    // 🌟 แก้ไขจากเดิม: ดักไม่ให้ PATCH แก้ไขสถานะได้ ถ้านัดหมายมันจบสิ้นไปแล้ว
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(existing.status)) {
      throw new BadRequestException('Cannot modify a finalized appointment');
    }
    
    if (dto.status) {
      if (!this.isValidTransition(existing.status, dto.status)) {
        throw new BadRequestException(`Cannot change status from ${existing.status} to ${dto.status}`);
      }
      existing.status = dto.status;
    }
    
    if (dto.cancellationReason !== undefined) {
      existing.cancellationReason = dto.cancellationReason;
    }
    
    return this.appointmentRepo.save(existing);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findById(id);
    await this.appointmentRepo.remove(existing);
  }

  async cancel(id: string, reason: string): Promise<AppointmentEntity> {
    if (!reason) throw new BadRequestException('Cancellation reason is required');
    return this.patch(id, { status: AppointmentStatus.CANCELLED, cancellationReason: reason });
  }

  async confirm(id: string): Promise<AppointmentEntity> {
    const existing = await this.findById(id);
    if (existing.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Only PENDING appointments can be confirmed');
    }
    return this.patch(id, { status: AppointmentStatus.CONFIRMED });
  }
}