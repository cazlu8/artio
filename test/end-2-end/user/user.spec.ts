import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../../src/modules/user/user.module';
import { User } from '../../../src/modules/user/user.entity';
import * as ormconfig from '../ormconfig';
import server from '../server';
import { saveUser, createAvatar, saveAvatarUrl } from './data';
import {
  cognitoConfig,
  s3Config,
  sesConfig,
} from '../../../src/shared/config/AWS';

describe('Users', () => {
  let app: any;
  let repository: Repository<User>;

  beforeAll(async done => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [s3Config, cognitoConfig, sesConfig],
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          useFactory: async () => ormconfig as any,
        }),
        UserModule,
      ],
    }).compile();

    app = await server(moduleRef);
    repository = await moduleRef.get('UserRepository');
    done();
  });

  it(`/POST users`, async done => {
    await app
      .post(`/users`)
      .send(saveUser)
      .set('Accept', 'application/json')
      .expect(201);

    const user = await repository.findOne(1);
    expect(user).toEqual(
      expect.objectContaining({
        email: 'test@hotmail.com',
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
        email: 'test@hotmail.com',
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
        email: 'test@hotmail.com',
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

  // get user avatar
  it(`/GET user avatar by id`, async done => {
    await repository.save(saveUser);
    await repository.update(
      { email: 'test@hotmail.com' },
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

  it(`/GET users by email`, async done => {
    await repository.save(saveUser);

    const { body } = await app
      .get(`/users/email/test@hotmail.com`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        email: 'test@hotmail.com',
        firstName: null,
        gender: null,
        id: 1,
        isNew: true,
        socialUrls: {
          urls: [],
        },
      }),
    );
    done();
  });

  it(`/GET users by guid`, async done => {
    const { guid } = saveUser;
    await repository.save(saveUser);

    const { body } = await app
      .get(`/users/${guid}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toEqual(
      expect.objectContaining({
        email: 'test@hotmail.com',
        firstName: null,
        gender: null,
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
    app.close();
  });
});
