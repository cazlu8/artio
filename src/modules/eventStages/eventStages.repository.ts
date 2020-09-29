import { EntityRepository, Repository } from 'typeorm';
import { EventStages } from './eventStages.entity';

@EntityRepository(EventStages)
export class EventStagesRepository extends Repository<EventStages> {}
