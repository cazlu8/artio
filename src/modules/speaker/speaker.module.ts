import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeakerController } from './speaker.controller';
import { LoggerService } from '../../shared/services/logger.service';
import { SpeakerRepository } from './speaker.repository';
import { EventStageScheduleSpeakerRepository } from '../eventStageScheduleSpeaker/eventStageScheduleSpeaker.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SpeakerRepository,
      EventStageScheduleSpeakerRepository,
    ]),
  ],
  controllers: [SpeakerController],
  providers: [LoggerService],
})
export class SpeakerModule {}
