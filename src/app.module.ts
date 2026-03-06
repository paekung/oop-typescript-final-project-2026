import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceController } from './controllers/service.controller';
import { AppointmentController } from './controllers/appointment.controller';
import { ServiceEntity } from './entities/service.entity';
import { AppointmentEntity } from './entities/appointment.entity';
import { ServiceService } from './services/service.service';
import { AppointmentService } from './services/appointment.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'database.sqlite',
      entities: [ServiceEntity, AppointmentEntity],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
