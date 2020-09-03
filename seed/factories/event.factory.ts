import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { Event } from '../../src/modules/event/event.entity';

define(Event, (faker: typeof Faker) => {
  const event = new Event();
  event.guid = faker.random.uuid();
  event.startDate = faker.date.recent();
  event.endDate = faker.date.future();
  event.name = faker.company.companyName();
  event.timezone = faker.address.stateAbbr();
  return event;
});
