import {
  PipeTransform,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EventRepository } from '../../event/event.repository';
import { EventStageScheduleRepository } from '../eventStageSchedule.repository';
import { EventStageSchedule } from '../eventStageSchedule.entity';
import { EventStagesRepository } from '../../eventStages/eventStages.repository';

@Injectable()
export class VerifyDateInBetween implements PipeTransform {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventStageRepository: EventStagesRepository,
    private readonly repository: EventStageScheduleRepository,
  ) {}

  async transform(value: EventStageSchedule): Promise<EventStageSchedule> {
    const { startDate: startDateSchedule, endDate: endDateSchedule } = value;
    const { eventId } = await this.eventStageRepository.findOne({
      select: [`eventId`],
      where: { id: value.eventStageId },
    });
    const { startDate, endDate } = await this.eventRepository.findOne({
      select: [`startDate`, `endDate`],
      where: { id: eventId },
    });
    if (
      +startDate >= +new Date(startDateSchedule) ||
      +new Date(endDateSchedule) >= +endDate
    )
      throw new UnprocessableEntityException(
        `dates out of range of the event dates`,
      );

    const schedulesInBetween = await this.repository.verifyIfScheduleIsInBetween(
      startDateSchedule,
    );
    if (schedulesInBetween.length)
      throw new UnprocessableEntityException(
        `already exists a schedule with dates in between`,
      );
    return value;
  }
}
