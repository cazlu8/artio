import * as supertest from 'supertest';
import server from './server';

export default async function load() {
  const app = await server();
  await app.init();
  await app
    .getHttpAdapter()
    .getInstance()
    .ready();
  return supertest.agent(app.getHttpServer());
}
