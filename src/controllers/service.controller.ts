import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,HttpCode,HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ServiceService } from '../services/service.service';
import { CreateServiceDto } from '../dto/service/create-service.dto';
import { UpdateServiceDto } from '../dto/service/update-service.dto';
import { PatchServiceDto } from '../dto/service/patch-service.dto';
import { ApiResponse as CustomApiResponse } from '../interfaces/api-response.interface';
import { ServiceEntity } from '../entities/service.entity';
@ApiTags('services')
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiResponse({ status: 200, description: 'Return all services' })
  async findAll(): Promise<CustomApiResponse<ServiceEntity[]>> {
    const data = await this.serviceService.findAll();
    return { success: true, message: 'Services retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Return a service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findById(@Param('id') id: string): Promise<CustomApiResponse<ServiceEntity>> {
    const data = await this.serviceService.findById(id);
    return { success: true, message: 'Service retrieved successfully', data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateServiceDto): Promise<CustomApiResponse<ServiceEntity>> {
    const data = await this.serviceService.create(dto);
    return { success: true, message: 'Service created successfully', data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service entirely' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto): Promise<CustomApiResponse<any>> {
    const data = await this.serviceService.update(id, dto);
    return { success: true, message: 'Service updated successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service partially' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: PatchServiceDto })
  @ApiResponse({ status: 200, description: 'Service patched successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async patch(@Param('id') id: string, @Body() dto: PatchServiceDto): Promise<CustomApiResponse<any>> {
    const data = await this.serviceService.patch(id, dto);
    return { success: true, message: 'Service patched successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete service with active appointments' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async delete(@Param('id') id: string): Promise<CustomApiResponse<null>> {
    await this.serviceService.delete(id);
    return { success: true, message: 'Service deleted successfully', data: null };
  }

  @Get(':id/available-slots')
  @ApiOperation({ summary: 'Get available time slots for a specific date' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiQuery({ name: 'date', type: 'string', example: '2026-03-10' })
  @ApiResponse({ status: 200, description: 'Return available slots' })
  async getAvailableSlots(
    @Param('id') id: string,
    @Query('date') date: string
  ): Promise<CustomApiResponse<string[]>> {
    const data = await this.serviceService.getAvailableSlots(id, date);
    return { success: true, message: 'Available slots retrieved successfully', data };
  }
}