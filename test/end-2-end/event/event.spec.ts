import { Repository } from 'typeorm';
import { saveEvent, updateEvent, createHeroImage } from './data';
import Application from '../main.test';
import { EventModule } from '../../../src/modules/event/event.module';
import { Event } from '../../../src/modules/event/event.entity';

describe('Events', () => {
  let app: any;
  let repository: Repository<Event>;

  beforeAll(async () => {
    const { server, moduleRef } = await Application(EventModule);
    app = server;
    repository = moduleRef.get('EventRepository');
  });

  it(`/POST events`, async () => {
    const { name } = saveEvent;
    await app
      .post(`/events`)
      .send(saveEvent)
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
  });

  it(`/PUT events`, async () => {
    const {
      name,
      streetNumber,
      zipCode,
      locationLongitude,
      startDate,
      timezone,
    } = updateEvent;
    await repository.save(saveEvent);

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
  });

  it(`/POST events/createHeroImage`, async () => {
    await repository.save(saveEvent);

    await app
      .post(`/events/createHeroImage`)
      .send(createHeroImage)
      .set('Accept', 'application/json')
      .expect(201);

    const event: Event = await repository.findOne(1);
    expect(event.heroImgUrl).toBeTruthy();
  });

  afterEach(async () => {
    await repository.query(`truncate table event restart identity cascade;`);
  });

  afterAll(async () => {
    await app.close();
  });
});
