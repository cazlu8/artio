import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import * as fastifyCompress from 'fastify-compress';
import * as fastifyHelmet from 'fastify-helmet';
import * as fastifyRateLimit from 'fastify-rate-limit';
//import * as fastifyCors from 'fastify-cors';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: +process.env.BODY_LIMIT,
      logger: process.env.SERVER_LOGGER,
    }),
  );
  app.enableCors();
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

 /* app.register(fastifyCors, {
    allowedHeaders: process.env.ALLOWED_HEADERS.split(','),
    credentials: true,
    methods: process.env.ALLOWED_METHODS.split(','),
    origin: process.env.ALLOWED_ORIGINS.split(','),
    preflightContinue: false,
  });*/

  app.register(fastifyHelmet, { hidePoweredBy: true });
  app.register(fastifyCompress);

  const swaggerOptions = new DocumentBuilder()
    .setTitle('Engage API')
    .setVersion('1.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('swagger', app, swaggerDocument);

  await app.listen(+process.env.PORT || 8000, '0.0.0.0');
}

bootstrap();
