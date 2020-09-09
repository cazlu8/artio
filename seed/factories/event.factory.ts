import * as Faker from 'faker';
import { define } from 'typeorm-seeding';
import { Event } from '../../src/modules/event/event.entity';

define(Event, (faker: typeof Faker) => {
  const event = new Event();

  event.guid = faker.random.uuid();
  event.name = faker.company.companyName();
  event.heroImgUrl = faker.image.image();
  event.locationName = faker.address.secondaryAddress();
  event.streetName = faker.address.streetName();
  event.streetNumber = faker.random.number(2);
  event.stateAcronym = faker.address.countryCode();
  event.state = faker.address.state();
  event.country = faker.address.state();
  event.city = faker.address.city();
  event.zipCode = faker.address.zipCode();
  event.description = faker.random.word();
  event.additionalInfo = faker.random.word();
  event.locationLatitude = faker.address.latitude();
  event.locationLongitude = faker.address.longitude();
  event.startDate = faker.date.recent();
  event.endDate = faker.date.future();
  event.timezone = faker.address.stateAbbr();
  event.liveUrl = faker.internet.url();
  event.streamKey = faker.internet.url();
  event.streamUrl = faker.internet.url();
  event.onLive = faker.random.boolean();

  return event;
});
