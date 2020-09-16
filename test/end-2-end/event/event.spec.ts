import { Repository } from 'typeorm';
import {
  saveEvent,
  updateEvent,
  createHeroImage,
  happeningNowEvents,
  upComingEvents,
  pastEvents,
  saveEvents,
  saveUserEvents,
  saveUserEventsRoles,
} from './data';
import Application from '../main.test';
import { EventModule } from '../../../src/modules/event/event.module';
import { Event } from '../../../src/modules/event/event.entity';
import { UserEventsModule } from '../../../src/modules/userEvents/userEvents.module';
import { RoleModule } from '../../../src/modules/role/role.module';
import { UserEventsRolesModule } from '../../../src/modules/userEventsRoles/userEventsRoles.module';
import { UserEventsRoles } from '../../../src/modules/userEventsRoles/userEventsRoles.entity';
import { UserEvents } from '../../../src/modules/userEvents/userEvents.entity';
import { UserModule } from '../../../src/modules/user/user.module';
import { saveUser } from '../user/data';
import { User } from '../../../src/modules/user/user.entity';
import { saveRoles } from '../role/data';
import { Role } from '../../../src/modules/role/role.entity';

describe('Events', () => {
  let app: any;
  let repository: Repository<Event>;
  let eventRolesRepository: Repository<UserEventsRoles>;
  let roleRepository: Repository<Role>;
  let userEventsRepository: Repository<UserEvents>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const { server, moduleRef } = await Application([
      UserModule,
      EventModule,
      UserEventsModule,
      RoleModule,
      UserEventsRolesModule,
    ]);
    app = server;
    repository = moduleRef.get('EventRepository');
    eventRolesRepository = moduleRef.get('UserEventsRolesRepository');
    roleRepository = moduleRef.get('RoleRepository');
    userRepository = moduleRef.get('UserRepository');
    userEventsRepository = moduleRef.get('UserEventsRepository');
  });

  it(`/POST events`, async done => {
    const { name } = saveEvent();
    await app
      .post(`/events`)
      .send(saveEvent())
      .set('Accept', 'application/json')
      .expect(201);

    const event: Event = await repository.findOne(1);
    expect(+event.endDate).toBeGreaterThan(+new Date());
    expect(event).toEqual(
      expect.objectContaining({
        name,
        id: 1,
        onLive: false,
      }),
    );
    done();
  });

  it(`/PUT events`, async done => {
    const {
      name,
      streetNumber,
      zipCode,
      locationLongitude,
      startDate,
      timezone,
    } = updateEvent;
    await repository.save(saveEvent());

    await app
      .put(`/events/1`)
      .send(updateEvent)
      .set('Accept', 'application/json')
      .expect(204);

    const event: Event = await repository.findOne(1);
    expect(event).toEqual(
      expect.objectContaining({
        id: 1,
        name,
        streetNumber,
        zipCode,
        locationLongitude,
        startDate,
        timezone,
      }),
    );
    done();
  });

  it(`/POST createHeroImage`, async done => {
    await repository.save(saveEvent());

    await app
      .post(`/events/createHeroImage`)
      .send(createHeroImage)
      .set('Accept', 'application/json')
      .expect(201);

    const event: Event = await repository.findOne(1);
    expect(event.heroImgUrl).toBeTruthy();
    done();
  });

  it(`/delete removeHeroImage/1`, async done => {
    await repository.save(saveEvent({ heroImgUrl: 'https:s3/image' }));

    await app
      .delete(`/events/removeHeroImage/1`)
      .set('Accept', 'application/json')
      .expect(200);

    const event: Event = await repository.findOne(1);
    expect(event.heroImgUrl).toBeNull();
    done();
  });

  it(`/GET upcoming/0`, async done => {
    await repository.save([...happeningNowEvents(), ...upComingEvents()]);

    const {
      body: { events },
    } = await app
      .get(`/events/upcoming/0`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 6 }),
        expect.objectContaining({ id: 7 }),
        expect.objectContaining({ id: 8 }),
        expect.objectContaining({ id: 9 }),
        expect.objectContaining({ id: 10 }),
      ]),
    );
    done();
  });

  it(`/GET upcoming/5`, async done => {
    await repository.save([...happeningNowEvents(), ...upComingEvents(10)]);

    const {
      body: { events },
    } = await app
      .get(`/events/upcoming/5`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 11 }),
        expect.objectContaining({ id: 12 }),
        expect.objectContaining({ id: 13 }),
        expect.objectContaining({ id: 14 }),
        expect.objectContaining({ id: 15 }),
      ]),
    );
    done();
  });

  it(`/GET upcoming/1/0`, async done => {
    await userRepository.save(saveUser);
    await repository.save([...upComingEvents(), ...happeningNowEvents()]);
    await userEventsRepository.save(saveUserEvents(10, { redeemed: true }));
    const {
      body: { events },
    } = await app
      .get(`/events/upcoming/1/0`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
        expect.objectContaining({ id: 3 }),
        expect.objectContaining({ id: 4 }),
        expect.objectContaining({ id: 5 }),
      ]),
    );
    done();
  });

  it(`/GET upcoming/1/5`, async done => {
    await userRepository.save(saveUser);
    await repository.save([...upComingEvents(10), ...happeningNowEvents()]);
    await userEventsRepository.save(saveUserEvents(15, { redeemed: true }));
    const {
      body: { events },
    } = await app
      .get(`/events/upcoming/1/5`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 6 }),
        expect.objectContaining({ id: 7 }),
        expect.objectContaining({ id: 8 }),
        expect.objectContaining({ id: 9 }),
        expect.objectContaining({ id: 10 }),
      ]),
    );
    done();
  });

  it(`/GET past/0`, async done => {
    await repository.save([...upComingEvents(), ...pastEvents()]);

    const {
      body: { events },
    } = await app
      .get(`/events/past/0`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 6 }),
        expect.objectContaining({ id: 7 }),
        expect.objectContaining({ id: 8 }),
        expect.objectContaining({ id: 9 }),
        expect.objectContaining({ id: 10 }),
      ]),
    );
    done();
  });

  it(`/GET past/5`, async done => {
    await repository.save([...upComingEvents(), ...pastEvents(10)]);

    const {
      body: { events },
    } = await app
      .get(`/events/past/5`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 11 }),
        expect.objectContaining({ id: 12 }),
        expect.objectContaining({ id: 13 }),
        expect.objectContaining({ id: 14 }),
        expect.objectContaining({ id: 15 }),
      ]),
    );
    done();
  });

  it(`/GET past/1/0`, async done => {
    await userRepository.save(saveUser);
    await repository.save([...upComingEvents(), ...pastEvents()]);
    await userEventsRepository.save(saveUserEvents(10, { redeemed: true }));

    const {
      body: { events },
    } = await app
      .get(`/events/past/1/0`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 6 }),
        expect.objectContaining({ id: 7 }),
        expect.objectContaining({ id: 8 }),
        expect.objectContaining({ id: 9 }),
        expect.objectContaining({ id: 10 }),
      ]),
    );
    done();
  });

  it(`/GET past/1/5`, async done => {
    await userRepository.save(saveUser);
    await repository.save([...upComingEvents(), ...pastEvents(10)]);
    await userEventsRepository.save(saveUserEvents(15, { redeemed: true }));

    const {
      body: { events },
    } = await app
      .get(`/events/past/1/5`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 11 }),
        expect.objectContaining({ id: 12 }),
        expect.objectContaining({ id: 13 }),
        expect.objectContaining({ id: 14 }),
        expect.objectContaining({ id: 15 }),
      ]),
    );
    done();
  });

  it(`/GET details/0`, async done => {
    await repository.save(saveEvent());
    const { name, locationName } = saveEvent();
    const { body: details } = await app
      .get(`/events/details/1`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(details).toEqual(
      expect.objectContaining({
        title: name,
        locationName,
      }),
    );
    done();
  });

  it(`/GET /1`, async done => {
    await repository.save(saveEvent());
    const { name, locationName } = saveEvent();
    const { body: event } = await app
      .get(`/events/1`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(event).toEqual(expect.objectContaining({ name, locationName }));
    done();
  });

  it(`/GET /2 404`, async done => {
    await repository.save(saveEvent());
    await app
      .get(`/events/2`)
      .set('Accept', 'application/json')
      .expect(404);
    done();
  });

  it(`/GET /`, async done => {
    const eventsToSave = saveEvents();
    await repository.save(eventsToSave);

    const { body: events } = await app
      .get(`/events`)
      .set('Accept', 'application/json')
      .expect(200);

    const expectName = eventsToSave.map(({ name }) =>
      expect.objectContaining({ name }),
    );
    expect(events).toEqual(expect.arrayContaining(expectName));
    done();
  });

  it(`/GET user/:userId/role/:roleId`, async done => {
    const eventsToSave = saveEvents();
    await userRepository.save(saveUser);
    await repository.save(eventsToSave);
    await userEventsRepository.save(saveUserEvents());
    await roleRepository.save(saveRoles());
    await eventRolesRepository.save(saveUserEventsRoles());

    const { body: events } = await app
      .get(`/events/user/1/role/2`)
      .set('Accept', 'application/json')
      .expect(200);

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
        expect.objectContaining({ id: 3 }),
        expect.objectContaining({ id: 4 }),
        expect.objectContaining({ id: 5 }),
      ]),
    );
    done();
  });

  afterEach(async () => {
    await repository.query(`truncate table event restart identity cascade;`);
    await repository.query(`truncate "user" restart identity cascade;`);
    await repository.query(`truncate role restart identity cascade;`);
  });

  afterAll(async () => {
    await app.close();
  });
});
