import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseModule } from '../../shared/modules/base.module';
import { EventStagesRepository } from '../eventStages/eventStages.repository';
import { EventRepository } from '../event/event.repository';
import { LiveManagementController } from './liveManagement.controller';
import { LiveManagementService } from './liveManagement.service';

@Module({
  imports: [
    BaseModule,
    TypeOrmModule.forFeature([EventStagesRepository, EventRepository]),
  ],
  providers: [LiveManagementService],
  controllers: [LiveManagementController],
})
export class LiveManagementModule {}
