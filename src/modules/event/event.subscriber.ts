import {
  InsertEvent,
  EntitySubscriberInterface,
  EventSubscriber as Subscriber,
} from 'typeorm';
import { uuid } from 'uuidv4';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Event } from './event.entity';

@Subscriber()
export class EventSubscriber implements EntitySubscriberInterface<Event> {
  constructor(@InjectQueue('event') private readonly eventQueue: Queue) {}

  listenTo() {
    return Event;
  }

  beforeInsert(event: InsertEvent<Event>) {
    event.entity.guid = uuid();
  }
}
