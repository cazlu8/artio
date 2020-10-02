import {
  InsertEvent,
  EntitySubscriberInterface,
  EventSubscriber as Subscriber,
  UpdateEvent,
} from 'typeorm';
import { uuid } from 'uuidv4';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Event } from './event.entity';
import { EventService } from './event.service';

@Subscriber()
export class EventSubscriber implements EntitySubscriberInterface<Event> {
  constructor(
    private service: EventService,
    @InjectQueue('event') private readonly eventQueue: Queue,
  ) {}

  listenTo() {
    return Event;
  }

  beforeInsert(event: InsertEvent<Event>) {
    event.entity.guid = uuid();
  }

  async afterInsert(event: InsertEvent<Event>) {
    const { id } = event.entity;
    await this.service.addDestroyInfraToQueue(id);
  }
}
