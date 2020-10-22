import { EntityRepository, Repository } from 'typeorm';
import { EventStages } from './eventStages.entity';

@EntityRepository(EventStages)
export class EventStagesRepository extends Repository<EventStages> {
  async getStagesByEventId(eventId: number) {
    return this.createQueryBuilder('eventStages')
      .select([
        'eventStages.eventId',
        'eventStages.id',
        'eventStages.name',
        'eventStages.region',
        'eventStages.mediaLiveChannelId',
        'eventStages.mediaLiveInputId',
        'eventStages.cdnDistributionId',
        'eventStages.liveUrl',
        'eventStages.streamKey',
        'eventStages.streamUrl',
        'eventStages.onLive',
        'eventStages.createdAt',
        'eventStages.updatedAt',
      ])
      .where('eventStages.eventId = :eventId', { eventId })
      .getMany();
  }
}
