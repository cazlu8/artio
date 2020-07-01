import {
  InsertEvent,
  EntitySubscriberInterface,
  EventSubscriber as Subscriber,
} from 'typeorm';
import { uuid } from 'uuidv4';
import { Event } from './event.entity';

@Subscriber()
export class EventSubscriber implements EntitySubscriberInterface<Event> {
  listenTo() {
    return Event;
  }

  beforeInsert(event: InsertEvent<Event>) {
    event.entity.guid = uuid();
  }
}
