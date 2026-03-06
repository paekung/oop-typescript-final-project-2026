import { Controller, Get, Post, Body, Put, Param, Delete, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentDto } from '../dto/appointment/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/appointment/update-appointment.dto';
import { PatchAppointmentDto } from '../dto/appointment/patch-appointment.dto';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { ApiResponse as CustomApiResponse } from '../interfaces/api-response.interface';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'serviceId', required: false })
  @ApiQuery({ name: 'date', required: false, example: '2026-03-10' })
  @ApiResponse({ status: 200, description: 'Return all appointments' })
  async findAll( 
    @Query('status') status?: AppointmentStatus,
    @Query('serviceId') serviceId?: string,
    @Query('date') date?: string,
  ): Promise<CustomApiResponse<any>> {
    const data = await this.appointmentService.findAll(status, serviceId, date);
    return { success: true, message: 'Appointments retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Return an appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(@Param('id') id: string): Promise<CustomApiResponse<any>> {
    const data = await this.appointmentService.findById(id);
    return { success: true, message: 'Appointment retrieved successfully', data };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or service inactive' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 409, description: 'Time slot conflict' })
  async create(@Body() dto: CreateAppointmentDto): Promise<CustomApiResponse<any>> {
    const data = await this.appointmentService.createAppointment(dto);
    return { success: true, message: 'Appointment created successfully', data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an appointment entirely' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'Time slot conflict' })
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto): Promise<CustomApiResponse<any>> {
    const data = await this.appointmentService.update(id, dto);
    return { success: true, message: 'Appointment updated successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment partially' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment patched successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async patch(@Param('id') id: string, @Body() dto: PatchAppointmentDto): Promise<CustomApiResponse<any>> {
    const data = await this.appointmentService.patch(id, dto);
    return { success: true, message: 'Appointment patched successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async remove(@Param('id') id: string): Promise<CustomApiResponse<null>> {
    await this.appointmentService.remove(id);
    return { success: true, message: 'Appointment deleted successfully', data: null };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment (reason required)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Missing reason or invalid status' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async cancel(@Param('id') id: string, @Body() body: { cancellationReason: string }): Promise<CustomApiResponse<any>> {
    const data = await this.appointmentService.cancel(id, body?.cancellationReason);
    return { success: true, message: 'Appointment cancelled successfully', data };
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm an appointment' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status (must be PENDING)' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async confirm(@Param('id') id: string): Promise<CustomApiResponse<any>> {
    const data = await this.appointmentService.confirm(id);
    return { success: true, message: 'Appointment confirmed successfully', data };
  }
}