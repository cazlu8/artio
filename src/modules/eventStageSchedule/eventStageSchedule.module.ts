import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { EventStageScheduleRepository } from './eventStageSchedule.repository';
import { EventStageScheduleController } from './eventStageSchedule.controller';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([EventStageScheduleRepository]),
  ],
  controllers: [EventStageScheduleController],
})
export class EventStageScheduleModule {}
