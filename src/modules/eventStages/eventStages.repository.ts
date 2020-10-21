import { EntityRepository, Repository } from 'typeorm';
import { EventStages } from './eventStages.entity';

@EntityRepository(EventStages)
export class EventStagesRepository extends Repository<EventStages> {
  async getStagesByEventId(eventId: number) {
    return this.createQueryBuilder('eventStages')
      .select([
        'eventId',
        'id',
        'name',
        'region',
        'mediaLiveChannelId',
        'mediaLiveInputId',
        'cdnDistributionId',
        'liveUrl',
        'streamKey',
        'streamUrl',
        'onLive',
        'createdAt',
        'updatedAt',
      ])
      .where('eventStages.eventId = :eventId', { eventId })
      .getRawMany();
  }
}
