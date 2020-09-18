import * as supertest from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';

export default async function load(module: TestingModule) {
  const fastifyAdapter = new FastifyAdapter();
  fastifyAdapter
    .getInstance()
    .addContentTypeParser('application/octet-stream', (request, done) =>
      done(),
    );
  const app = module.createNestApplication<NestFastifyApplication>(
    fastifyAdapter,
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await app.init();
  await app
    .getHttpAdapter()
    .getInstance()
    .ready();
  return supertest.agent(app.getHttpServer());
}
