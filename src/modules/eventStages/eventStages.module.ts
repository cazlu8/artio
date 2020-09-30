import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { EventStagesRepository } from './eventStages.repository';

@Module({
  imports: [BaseModule, TypeOrmModule.forFeature([EventStagesRepository])],
})
export class EventStagesModule {}
