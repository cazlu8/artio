import { Repository } from 'typeorm';
import { UserModule } from '../../../src/modules/user/user.module';
import { User } from '../../../src/modules/user/user.entity';
import {
  saveUser,
  saveUserError,
  saveAvatarUrl,
  createAvatar,
  createAvatarError,
  linkUserToEventWithRole,
  updateUser,
} from './data';
import Application from '../main.test';
import { UserEventsModule } from '../../../src/modules/userEvents/userEvents.module';
import { UserEvents } from '../../../src/modules/userEvents/userEvents.entity';
import { Event } from '../../../src/modules/event/event.entity';
import { EventModule } from '../../../src/modules/event/event.module';
import { saveEvent } from '../event/data';

describe('Users', () => {
  let app: any;
  let repository: Repository<User>;
  let userEventsRepository: Repository<UserEvents>;
  let eventRepository: Repository<Event>;

  beforeAll(async () => {
    const { server, moduleRef } = await Application([
      EventModule,
      UserModule,
      UserEventsModule,
    ]);
    app = server;
    repository = moduleRef.get('UserRepository');
    userEventsRepository = moduleRef.get('UserEventsRepository');
    eventRepository = moduleRef.get('EventRepository');
  });

  it(`/POST users`, async done => {
    const { email } = saveUser;
    await app
      .post(`/users`)
      .send(saveUser)
      .set('Accept', 'application/json')
      .expect(201);

    const user = await repository.findOne(1);
    expect(user).toEqual(
      expect.objectContaining({
        email,
        id: 1,
        isNew: true,
      }),
    );
    done();
  });

  it(`/POST create user avatar`, async done => {
    await repository.save(saveUser);
    await app
      .post('/users/create-avatar')
      .send(createAvatar)
      .set('Accept', 'application/json')
      .expect(201);

    const user = await repository.findOne(1);
    expect(user).toEqual(
      expect.objectContaining({
        id: 1,
        isNew: true,
      }),
    );
    expect(user.avatarImgUrl).toBeTruthy();
    done();
  });

  it(`/DELETE delete user avatar`, async done => {
    await repository.save(saveUser);
    await app
      .post('/users/create-avatar')
      .send(createAvatar)
      .set('Accept', 'application/json')
      .expect(201);
    await app
      .delete('/users/removeAvatar/1')
      .set('Accept', 'application/json')
      .expect(200);

    const user = await repository.findOne(1);
    expect(user).toEqual(
      expect.objectContaining({
        id: 1,
        isNew: true,
      }),
    );
    expect(user.avatarImgUrl).toBeFalsy();
    done();
  });

  it(`/POST upload users`, async done => {
    await eventRepository.save(saveEvent);
    await app
      .post(`/users/uploadUsers/1`)
      .attach('file', 'test/end-2-end/user/assets/users.csv')
      .expect(201);
    await repository.query(`truncate table "event" restart identity cascade;`);
    done();
  });

  it(`/POST user exists on cognito`, async done => {
    const { body } = await app
      .post(`/users/checkUserExists`)
      .send({
        email: 'otavio@artio.events',
      })
      .set('Accept', 'application/json')
      .expect(201);
    expect(body).toEqual(true);
    done();
  });

  it(`/POST users linkEvent`, async done => {
    await repository.save(saveUser);
    await eventRepository.save(saveEvent);
    await app
      .post(`/users/linkEvent`)
      .send(linkUserToEventWithRole)
      .set('Accept', 'application/json')
      .expect(201);
    const body = await userEventsRepository.findOne({ userId: 1 });
    expect(body).toEqual(
      expect.objectContaining({
        id: 1,
        userId: 1,
        eventId: 1,
        ticketCode: null,
        redeemed: true,
      }),
    );
    await repository.query(`truncate table "event" restart identity cascade;`);
    done();
  });

  it(`/GET user avatar by id`, async done => {
    await repository.save(saveUser);
    await repository.update(
      { email: saveUser.email },
      { avatarImgUrl: saveAvatarUrl },
    );
    const { body } = await app
      .get(`/users/avatar/1`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.avatarImgUrl).toBeTruthy();
    done();
  });

  it('/GET users by email', async done => {
    const { email } = saveUser;
    await repository.save(saveUser);

    const { body } = await app
      .get(`/users/email/${email}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        email,
        id: 1,
        isNew: true,
        socialUrls: {
          urls: [],
        },
      }),
    );
    done();
  });

  it('/GET users by guid', async done => {
    const { guid, email } = saveUser;
    await repository.save(saveUser);

    const { body } = await app
      .get(`/users/${guid}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        email,
        id: 1,
        isNew: true,
        socialUrls: {
          urls: [],
        },
      }),
    );
    done();
  });

  it('/GET events by user id', async done => {
    await repository.save(saveUser);
    await eventRepository.save(saveEvent);

    await app
      .post(`/users/linkEvent`)
      .send(linkUserToEventWithRole)
      .set('Accept', 'application/json')
      .expect(201);

    const { body } = await app
      .get(`/users/events/1`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toBeTruthy();
    await repository.query(`truncate table "event" restart identity cascade;`);

    done();
  });

  it(`/PUT users`, async done => {
    await repository.save(saveUser);

    await app
      .put(`/users/1`)
      .send(updateUser)
      .set('Accept', 'application/json')
      .expect(204);

    const user = await repository.findOne(1);

    expect(user).toEqual(expect.objectContaining(updateUser));

    done();
  });

  // redeem code

  // error cases

  it(`/POST users error`, async done => {
    const { body } = await app
      .post(`/users`)
      .send(saveUserError)
      .set('Accept', 'application/json')
      .expect(400);

    expect(body.message).toHaveLength(2);

    done();
  });

  it(`/POST create user avatar without avatarImgUrl error`, async done => {
    const { body } = await app
      .post('/users/create-avatar')
      .send(createAvatarError)
      .set('Accept', 'application/json')
      .expect(400);

    expect(body.message).toHaveLength(1);

    done();
  });

  it(`/POST create user avatar with wrong userId error`, async done => {
    const { body } = await app
      .post('/users/create-avatar')
      .send(createAvatar)
      .set('Accept', 'application/json')
      .expect(404);

    expect(body.message).toEqual('Not Found');

    done();
  });

  it(`/DELETE user avatar with inexistent userId error`, async done => {
    const { body } = await app
      .delete('/users/removeAvatar/1')
      .set('Accept', 'application/json')
      .expect(404);

    expect(body.message).toEqual('Not Found');

    done();
  });

  // has to be updated
  it(`/POST upload users with invalid csv file`, async done => {
    await eventRepository.save(saveEvent);
    await app
      .post(`/users/uploadUsers/1`)
      .attach('file', 'test/end-2-end/user/assets/invalid.csv')
      .expect(201);
    await repository.query(`truncate table "event" restart identity cascade;`);
    done();
  });

  it(`/POST user exists on cognito malformated email error`, async done => {
    const { body } = await app
      .post(`/users/checkUserExists`)
      .send({
        email: '@artio.events',
      })
      .set('Accept', 'application/json')
      .expect(400);
    expect(body.message).toHaveLength(1);
    done();
  });

  it(`/POST user exists on cognito inexistent email error`, async done => {
    const { body } = await app
      .post(`/users/checkUserExists`)
      .send({
        email: 'test@artio.events',
      })
      .set('Accept', 'application/json')
      .expect(201);
    expect(body).toEqual(false);
    done();
  });

  afterEach(async () => {
    await repository.query(`truncate table "user" restart identity cascade;`);
  });

  afterAll(async () => {
    await app.close();
  });
});
