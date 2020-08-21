import * as supertest from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';

export default async function load(module: TestingModule) {
  const app = module.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  // eslint-disable-next-line global-require
  app.register(require('fastify-file-upload'));
  await app.init();
  await app
    .getHttpAdapter()
    .getInstance()
    .ready();
  return supertest.agent(app.getHttpServer());
}
