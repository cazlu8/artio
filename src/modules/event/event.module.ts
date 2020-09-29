import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './event.controller';
import { BaseModule } from '../../shared/modules/base.module';
import { EventService } from './event.service';
import { EventRepository } from './event.repository';
import { NetworkRoomModule } from '../networkRoom/networkRoom.module';
import EventQueue from './event.queue';
import { EventProcessor } from './event.processor';
import { EventGateway } from './event.gateway';
import { JwtService } from '../../shared/services/jwt.service';
import { UploadService } from '../../shared/services/upload.service';
import { UserRepository } from '../user/user.repository';
import { UserEventsRepository } from '../userEvents/userEvents.repository';
import { EventStagesRepository } from '../eventStages/eventStages.repository';

@Module({
  imports: [
    BaseModule,
    EventQueue,
    NetworkRoomModule,
    BaseModule,
    TypeOrmModule.forFeature([
      EventRepository,
      UserEventsRepository,
      UserRepository,
      EventStagesRepository,
    ]),
  ],
  controllers: [EventController],
  providers: [
    EventService,
    EventGateway,
    EventProcessor,
    JwtService,
    UploadService,
  ],
})
export class EventModule {}
