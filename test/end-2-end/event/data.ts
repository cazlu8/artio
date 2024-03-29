import * as Factory from 'factory.ts';
import * as faker from 'faker';
import CreateEventDTO from '../../../src/modules/event/dto/event.create.dto';
import UpdateEventDTO from '../../../src/modules/event/dto/event.update.dto';
import CreateHeroImage from '../../../src/modules/event/dto/event.create.heroImage.dto';
import { UserEvents } from '../../../src/modules/userEvents/userEvents.entity';
import { UserEventsRoles } from '../../../src/modules/userEventsRoles/userEventsRoles.entity';
import { Roles } from '../../../src/modules/role/enums/roles.enum';

const createEventDTOFactory = Factory.Sync.makeFactory<CreateEventDTO>({
  name: faker.name.firstName(),
  locationName: faker.commerce.productName(),
  streetName: faker.address.streetName(),
  streetNumber: '0',
  stateAcronym: faker.address.stateAbbr(),
  state: faker.address.state(),
  country: faker.address.country(),
  city: faker.address.city(),
  zipCode: faker.address.zipCode(),
  description: faker.lorem.text().slice(0, 254),
  additionalInfo: faker.lorem.text().slice(0, 254),
  locationLongitude: +faker.address.longitude(),
  locationLatitude: +faker.address.latitude(),
  startDate: faker.date.recent(),
  endDate: faker.date.future(),
  timezone: 'america/sao_paulo',
  onLive: false,
});

const updateEventDTOFactory = Factory.Sync.makeFactory<UpdateEventDTO>({
  name: faker.name.firstName(),
  streetNumber: '823',
  zipCode: faker.address.zipCode(),
  locationLongitude: +faker.address.longitude(),
  startDate: faker.date.recent(),
  timezone: 'america/denver',
});

const createHeroImageFactory = Factory.Sync.makeFactory<CreateHeroImage>({
  id: 1,
  heroImageUrl:
    'data:image/jpeg;base64,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',
});

const createUserEventsFactory = Factory.Sync.makeFactory<Partial<UserEvents>>({
  userId: 1,
  eventId: Factory.each(i => i + 1),
  redeemed: false,
});

const createUserEventsRolesFactory = Factory.Sync.makeFactory<
  Partial<UserEventsRoles>
>({
  userEventsId: Factory.each(i => i + 1),
  userEventsUserId: 1,
  userEventsEventId: Factory.each(i => i + 1),
  roleId: Roles.ADMIN,
});

const happeningNowEvents = (amount = 5) =>
  createEventDTOFactory.buildList(amount);
const upComingEvents = (amount = 5) =>
  createEventDTOFactory.buildList(amount, {
    startDate: faker.date.future(),
    endDate: faker.date.future(),
  });

const pastEvents = (amount = 5) =>
  createEventDTOFactory.buildList(amount, {
    startDate: faker.date.past(),
    endDate: faker.date.past(),
  });
const saveUserEvents = (amount = 5, properties = undefined) => {
  createUserEventsFactory.resetSequenceNumber();
  return createUserEventsFactory.buildList(amount, properties);
};
const saveUserEventsRoles = (amount = 5) => {
  createUserEventsRolesFactory.resetSequenceNumber();
  return createUserEventsRolesFactory.buildList(amount);
};
const saveEvents = (amount = 5) => createEventDTOFactory.buildList(amount);
const saveEvent = (properties = {}) => createEventDTOFactory.build(properties);
const updateEvent = updateEventDTOFactory.build();
const createHeroImage = createHeroImageFactory.build();

export {
  saveEvent,
  updateEvent,
  createHeroImage,
  happeningNowEvents,
  upComingEvents,
  pastEvents,
  saveEvents,
  saveUserEvents,
  saveUserEventsRoles,
};
