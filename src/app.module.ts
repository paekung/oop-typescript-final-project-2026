import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceController } from './controllers/service.controller';
import { AppointmentController } from './controllers/appointment.controller';
import { ServiceEntity } from './entities/service.entity';
import { AppointmentEntity } from './entities/appointment.entity';
import { ServiceService } from './services/service.service';
import { AppointmentService } from './services/appointment.service';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
