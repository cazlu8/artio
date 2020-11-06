import { EntityRepository, Repository } from 'typeorm';
import { getDay, getFormattedDate } from './queries';
import { EventStageScheduleSpeaker } from './eventStageScheduleSpeaker.entity';

@EntityRepository(EventStageScheduleSpeaker)
export class EventStageScheduleSpeakerRepository extends Repository<
  EventStageScheduleSpeaker
> {
  getScheduleFromStage(eventStageId: number) {
    return this.createQueryBuilder('eventStageScheduleSpeaker')
      .addSelect('schedule.id', 'id')
      .addSelect('schedule.title', 'title')
      .addSelect('schedule.description', 'description')
      .addSelect('speaker.name', 'speakerName')
      .addSelect('speaker.bio', 'speakerBio')
      .addSelect('speaker.socialUrls', 'speakerSocialUrls')
      .innerJoin('eventStageScheduleSpeaker.schedule', 'schedule')
      .innerJoin('eventStageScheduleSpeaker.speaker', 'speaker')
      .addSelect(getDay, 'day')
      .addSelect(getFormattedDate, 'date')
      .where('schedule.eventStageId = :eventStageId', {
        eventStageId,
      })
      .getRawMany();
  }
}
