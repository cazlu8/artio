import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerService } from '../../shared/services/logger.service';
import { UserEvents } from './userEvents.entity';
import { UserEventsService } from './userEvents.service';
import { UserEventsRepository } from './userEvents.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEvents, UserEventsRepository])],
  providers: [UserEventsService, LoggerService],
  exports: [
    TypeOrmModule.forFeature([UserEvents, UserEventsRepository]),
    UserEventsService,
  ],
})
export class UserEventsModule {}
