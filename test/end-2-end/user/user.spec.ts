import { Repository } from 'typeorm';
import { UserModule } from '../../../src/modules/user/user.module';
import { User } from '../../../src/modules/user/user.entity';
import { saveUser, saveAvatarUrl, createAvatar } from './data';
import Application from '../main.test';

describe('Users', () => {
  let app: any;
  let repository: Repository<User>;

  beforeAll(async () => {
    const { server, moduleRef } = await Application(UserModule);
    app = server;
    repository = moduleRef.get('UserRepository');
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

  // upload users CSV

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

  // link user to event

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

  it('/GET users', async done => {
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

  // get events by user id

  // update user

  // redeem code

  afterEach(async () => {
    await repository.query(`truncate table "user" restart identity cascade;`);
  });

  afterAll(async () => {
    await app.close();
  });
});
