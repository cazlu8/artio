import { Repository } from 'typeorm';
import { UserModule } from '../../../src/modules/user/user.module';
import { User } from '../../../src/modules/user/user.entity';
import { saveUser } from './data';
import Application from '../main.test';

describe('Users', () => {
  let app: any;
  let repository: Repository<User>;

  beforeAll(async () => {
    const { server, moduleRef } = await Application(UserModule);
    app = server;
    repository = moduleRef.get('UserRepository');
  });

  it(`/POST users`, async () => {
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
  });

  it('/GET users', async () => {
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
  });

  afterEach(async () => {
    await repository.query(`truncate table "user" restart identity cascade;`);
  });

  afterAll(async () => {
    await app.close();
  });
});
