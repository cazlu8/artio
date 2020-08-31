import { Repository } from 'typeorm';
import { SponsorModule } from '../../../src/modules/sponsor/sponsor.module';
import { Sponsor } from '../../../src/modules/sponsor/sponsor.entity';
import {
  saveSponsor,
  createLogo,
  saveLogorUrl,
  updateSponsor,
  saveSponsorError,
  createLogoError,
} from './data';
import Application from '../main.test';
import { UserEventsModule } from '../../../src/modules/userEvents/userEvents.module';
import { Event } from '../../../src/modules/event/event.entity';
import { EventModule } from '../../../src/modules/event/event.module';
import { saveEvent } from '../event/data';

describe('Sponsor', () => {
  let app: any;
  let repository: Repository<Sponsor>;
  let eventRepository: Repository<Event>;

  beforeAll(async () => {
    const { server, moduleRef } = await Application([
      EventModule,
      SponsorModule,
      UserEventsModule,
    ]);
    app = server;
    repository = moduleRef.get('SponsorRepository');
    eventRepository = moduleRef.get('EventRepository');
  });

  it(`/POST sponsors`, async done => {
    await app
      .post(`/sponsors`)
      .send(saveSponsor)
      .set('Accept', 'application/json')
      .expect(201);

    const sponsor = await repository.findOne(1);
    expect(sponsor).toEqual(
      expect.objectContaining({
        id: 1,
        inShowRoom: false,
        textUrl360: null,
        tier: 1,
      }),
    );
    done();
  });

  it(`/POST sponsors/uploadLogo`, async done => {
    await repository.save(saveSponsor);
    await app
      .post('/sponsors/uploadLogo')
      .send(createLogo)
      .set('Accept', 'application/json')
      .expect(201);

    const sponsor = await repository.findOne(1);
    expect(sponsor).toEqual(
      expect.objectContaining({
        id: 1,
      }),
    );
    expect(sponsor.logo).toBeTruthy();
    done();
  });

  it(`/GET sponsors/logo/:id`, async done => {
    await repository.save(saveSponsor);
    await repository.update(
      { email: saveSponsor.email },
      { logo: saveLogorUrl },
    );
    const { body } = await app
      .get(`/sponsors/logo/1`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.logo).toBeTruthy();
    done();
  });

  it('/GET sponsors/email/:email', async done => {
    const { email } = saveSponsor;
    await repository.save(saveSponsor);

    const { body } = await app
      .get(`/sponsors/email/${email}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        email,
        id: 1,
      }),
    );
    done();
  });

  it('/GET sponsors by guid', async done => {
    const { email } = saveSponsor;
    await repository.save(saveSponsor);
    const { guid } = await repository.findOne({
      select: ['guid'],
      where: { id: 1 },
    });

    const { body } = await app
      .get(`/sponsors/${guid}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        email,
        guid,
      }),
    );
    done();
  });

  it(`/PUT sponsors`, async done => {
    await repository.save(saveSponsor);

    await app
      .put(`/sponsors/1`)
      .send(updateSponsor)
      .set('Accept', 'application/json')
      .expect(204);

    const sponsor = await repository.findOne(1);

    expect(sponsor).toEqual(expect.objectContaining(updateSponsor));

    done();
  });

  it(`/DELETE sponsors/removeLogo`, async done => {
    await repository.save(saveSponsor);
    await app
      .post('/sponsors/uploadLogo')
      .send(createLogo)
      .set('Accept', 'application/json')
      .expect(201);
    await app
      .delete('/sponsors/removeLogo/1')
      .set('Accept', 'application/json')
      .expect(200);

    const sponsor = await repository.findOne(1);
    expect(sponsor).toEqual(
      expect.objectContaining({
        id: 1,
      }),
    );
    expect(sponsor.logo).toBeFalsy();
    done();
  });

  // error cases

  it(`/POST sponsors error`, async done => {
    const { body } = await app
      .post(`/sponsors`)
      .send(saveSponsorError)
      .set('Accept', 'application/json')
      .expect(400);

    expect(body.message).toHaveLength(1);
    done();
  });

  it(`/POST create sponsor logo without logo url error`, async done => {
    await repository.save(saveSponsor);
    const { body } = await app
      .post('/sponsors/uploadLogo')
      .send(createLogoError)
      .set('Accept', 'application/json')
      .expect(400);

    expect(body.message).toHaveLength(1);

    done();
  });

  it(`/DELETE sponsor logo with invalid sponsorId error`, async done => {
    const { body } = await app
      .delete('/sponsors/removeLogo/1')
      .set('Accept', 'application/json')
      .expect(404);

    expect(body.message).toEqual('Not Found');

    done();
  });

  it(`/GET sponsors logo by id invalid sponsor error`, async done => {
    const { body } = await app
      .get(`/sponsors/logo/1`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(body.message).toEqual('Not Found');
    done();
  });

  it('/GET sponsors/email/:email with invalid email error', async done => {
    const { email } = saveSponsor;

    const { body } = await app
      .get(`/sponsors/email/${email}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(body.message).toEqual('Not Found');
    done();
  });

  it(`/PUT sponsors with invalid sponsor id`, async done => {
    const { body } = await app
      .put(`/sponsors/1`)
      .send(updateSponsor)
      .set('Accept', 'application/json')
      .expect(404);

    expect(body.message).toEqual('Not Found');

    done();
  });

  it('/GET sponsors by guid with invalid guid error', async done => {
    const { body } = await app
      .get(`/sponsors/2d09879a-0ae9-4cc9-acd0-70b3a563387b`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(body.message).toEqual('Not Found');

    done();
  });

  beforeEach(async () => {
    await eventRepository.save(saveEvent());
  });

  afterEach(async () => {
    await repository.query(`truncate table "event" restart identity cascade;`);
    await repository.query(
      `truncate table "sponsor" restart identity cascade;`,
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
