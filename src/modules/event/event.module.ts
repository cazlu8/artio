import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigService } from '@nestjs/config';
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
import { EventStageScheduleRepository } from '../eventStageSchedule/eventStageSchedule.repository';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        ttl: 5,
        max: 20,
        store: redisStore,
        ...configService.get('redis'),
      }),
      inject: [ConfigService],
    }),
    BaseModule,
    EventQueue,
    NetworkRoomModule,
    BaseModule,
    TypeOrmModule.forFeature([
      EventRepository,
      UserEventsRepository,
      UserRepository,
      EventStagesRepository,
      EventStageScheduleRepository,
    ]),
  ],
  controllers: [EventController],
  providers: [
    EventGateway,
    EventService,
    EventProcessor,
    JwtService,
    UploadService,
  ],
})
export class EventModule {}
