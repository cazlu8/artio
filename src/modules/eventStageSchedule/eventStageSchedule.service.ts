import { Injectable } from '@nestjs/common';
import * as groupBy from 'group-by';
import { EventStageScheduleSpeakerRepository } from '../eventStageScheduleSpeaker/eventStageScheduleSpeaker.repository';

@Injectable()
export class EventStageScheduleService {
  constructor(
    private readonly eventStageScheduleSpeakerRepository: EventStageScheduleSpeakerRepository,
  ) {}

  async getScheduleFromStage(eventStageId: number) {
    const schedules = await this.eventStageScheduleSpeakerRepository.getScheduleFromStage(
      eventStageId,
    );
    return groupBy(schedules, 'day');
  }
}
