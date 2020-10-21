import { EntityRepository, Repository } from 'typeorm';
import { EventStages } from './eventStages.entity';

@EntityRepository(EventStages)
export class EventStagesRepository extends Repository<EventStages> {
  async getStagesByEventId(eventId: number) {
    return this.createQueryBuilder('eventStages')
      .select(['id', 'name'])
      .where('eventStages.eventId = :eventId', { eventId })
      .getRawMany();
  }
}
