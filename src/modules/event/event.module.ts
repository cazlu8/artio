import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './event.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { EventService } from './event.service';
import { EventRepository } from './event.repository';
import { NetworkRoomModule } from '../networkRoom/networkRoom.module';
import { UserEvents } from '../userEvents/userEvents.entity';
import EventQueue from './event.queue';
import { EventProcessor } from './event.processor';

@Module({
  imports: [
    EventQueue,
    NetworkRoomModule,
    BaseModule,
    EventProcessor,
    TypeOrmModule.forFeature([EventRepository, UserEvents]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
