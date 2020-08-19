import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../../src/modules/user/user.module';
import { User } from '../../../src/modules/user/user.entity';
import * as ormconfig from '../ormconfig';
import server from '../server';
import { saveUser } from './data';

describe('Users', () => {
  let app: any;
  let repository: Repository<User>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          useFactory: async () => ormconfig as any,
        }),
        UserModule,
      ],
    }).compile();

    app = await server(moduleRef);
    repository = moduleRef.get('UserRepository');
  });

  it(`/POST users`, async () => {
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
  });

  it(`/GET users`, async () => {
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
  });

  it(`/GET users by email`, async () => {
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
  });

  afterEach(async () => {
    await repository.query(`truncate table "user" restart identity cascade;`);
  });

  afterAll(async () => {
    app.close();
  });
});
