import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { EventStageScheduleRepository } from './eventStageSchedule.repository';
import { EventStageScheduleController } from './eventStageSchedule.controller';
import { EventStagesRepository } from '../eventStages/eventStages.repository';
import { EventRepository } from '../event/event.repository';
import { EventStageScheduleService } from './eventStageSchedule.service';
import { EventStageScheduleSpeakerRepository } from '../eventStageScheduleSpeaker/eventStageScheduleSpeaker.repository';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([
      EventStageScheduleRepository,
      EventStagesRepository,
      EventRepository,
      EventStageScheduleSpeakerRepository,
    ]),
  ],
  providers: [EventStageScheduleService],
  controllers: [EventStageScheduleController],
})
export class EventStageScheduleModule {}
