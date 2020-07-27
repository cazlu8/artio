import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import * as fastifyCompress from 'fastify-compress';
import * as fastifyRateLimit from 'fastify-rate-limit';
import * as fastifyHealthCheck from 'fastify-healthcheck';
import * as fastifyHelmet from 'fastify-helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cluster from 'cluster';
import * as os from 'os';
import { AppModule } from './app.module';
import RedisIoAdapter from './shared/adapters/RedisIO.adapter';

const numCPUs = os.cpus().length;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: +process.env.BODY_LIMIT,
      logger: process.env.SERVER_LOGGER,
    }),
  );
  app.enableCors({
    origin: true,
  });
  app.useWebSocketAdapter(
    new RedisIoAdapter(app, process.env.REDIS_HOST, +process.env.REDIS_PORT),
  );
  app.enableShutdownHooks();
  app.register(fastifyHealthCheck);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.register(fastifyRateLimit, {
    max: +process.env.MAX_RATE_REQUESTS,
    ban: +process.env.TIMES_BAN_RATE_REQUESTS,
    timeWindow: +process.env.TIME_WINDOW_RATE_LIMIT,
  });

  app.register(fastifyHelmet, {
    setTo: '.NET 4.8',
    referrerPolicy: { policy: 'same-origin' },
    permittedPolicies: 'none',
  });

  app.register(fastifyCompress);

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Engage API')
    .setVersion('1.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('swagger', app, swaggerDocument);

  await app.listen(+process.env.PORT || 8000, '0.0.0.0');
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', () => {
    cluster.fork();
  });
} else {
  bootstrap();
  console.log(`Worker ${process.pid} started`);
}
