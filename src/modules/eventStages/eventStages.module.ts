import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { EventStagesRepository } from './eventStages.repository';
import { EventStagesController } from './eventStages.controller';

@Module({
  imports: [BaseModule, TypeOrmModule.forFeature([EventStagesRepository])],
  controllers: [EventStagesController],
})
export class EventStagesModule {}
