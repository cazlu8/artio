import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthMiddleware } from './shared/middlewares/auth.middleware';
import { loadModules } from './modules';
import * as ormconfig from './ormconfig';

// read all modules folders and load all available modules
const modules: DynamicModule[] = loadModules();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => ormconfig as any,
    }),
    BullModule.registerQueue({
      name: 'audio',
      redis: {
        host: 'artio-events-staging.fzejto.ng.0001.usw1.cache.amazonaws.com',
        port: 6379,
      },
    }),
    ...modules,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    if (process.env.NODE_ENV !== 'development')
      consumer
        .apply(AuthMiddleware)
        .exclude(
          { path: '/users', method: RequestMethod.POST },
          { path: '/users/checkUserExists', method: RequestMethod.POST },
          // { path: '/users/events/:id', method: RequestMethod.GET },
          { path: '/users/linkEvent', method: RequestMethod.POST },
          { path: '/events', method: RequestMethod.POST },
          { path: '/events', method: RequestMethod.GET },
          { path: '/events/:id', method: RequestMethod.GET },
          '/health',
          '/swagger',
          '/swagger/(.*)',
          '/swagger/static/(.*)',
        )
        .forRoutes('*');
  }
}
