import { Repository } from 'typeorm';
import { saveRole, saveRoleError } from './data';
import Application from '../main.test';
import { Role } from '../../../src/modules/role/role.entity';
import { RoleModule } from '../../../src/modules/role/role.module';

describe('Role', () => {
  let app: any;
  let repository: Repository<Role>;

  beforeAll(async () => {
    const { server, moduleRef } = await Application(RoleModule);
    app = server;
    repository = moduleRef.get('RoleRepository');
  });

  it(`/POST role`, async done => {
    await app
      .post('/role')
      .send(saveRole)
      .set('Accept', 'application/json')
      .expect(201);

    const role = await repository.findOne(1);
    expect(role).toEqual(
      expect.objectContaining({
        id: 1,
        name: 1,
      }),
    );
    done();
  });

  it(`/GET role/:id`, async done => {
    await repository.save(saveRole());
    const { body } = await app
      .get(`/role/1`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body.name).toBeTruthy();
    done();
  });

  it(`/GET role`, async done => {
    await repository.save(saveRole());
    const { body } = await app
      .get(`/role`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toBeTruthy();
    done();
  });

  it(`/POST role error`, async done => {
    const { body } = await app
      .post('/role')
      .send(saveRoleError)
      .set('Accept', 'application/json')
      .expect(400);

    expect(body.message).toHaveLength(1);
    done();
  });

  it(`/GET role/:id error`, async done => {
    const { body } = await app
      .get(`/role/1`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(body.message).toBe('Not Found');
    done();
  });

  it(`/GET role error`, async done => {
    const { body } = await app
      .get(`/role`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).toHaveLength(0);
    done();
  });

  beforeEach(async () => {
    await repository.query(`truncate table "role" restart identity cascade;`);
  });

  afterEach(async () => {
    await repository.query(`truncate table "role" restart identity cascade;`);
  });

  afterAll(async () => {
    await app.close();
  });
});
