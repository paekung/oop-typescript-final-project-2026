import { Module } from '@nestjs/common';
import { ServiceController } from './controllers/service.controller';
import { AppointmentController } from './controllers/appointment.controller';
import { ServiceService } from './services/service.service';
import { AppointmentService } from './services/appointment.service';
import { JsonDatabaseService } from './database/json-database.service';

@Module({
  imports: [],
  controllers: [ServiceController, AppointmentController],
  providers: [JsonDatabaseService, ServiceService, AppointmentService],
})
export class AppModule {}
