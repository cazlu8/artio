import {
  InsertEvent,
  EntitySubscriberInterface,
  EventSubscriber as Subscriber,
} from 'typeorm';
import { uuid } from 'uuidv4';
import { Sponsor } from './sponsor.entity';

@Subscriber()
export class SponsorSubscriber implements EntitySubscriberInterface<Sponsor> {
  listenTo() {
    return Sponsor;
  }

  beforeInsert(sponsor: InsertEvent<Sponsor>) {
    sponsor.entity.guid = uuid();
  }
}
