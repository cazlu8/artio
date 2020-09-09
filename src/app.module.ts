import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'nestjs-redis';
import { AuthMiddleware } from './shared/middlewares/auth.middleware';
import { loadModules } from './modules';
import * as ormconfig from './ormconfig';
import redisConfig from './shared/config/redis';
import { JwtService } from './shared/services/jwt.service';
import { cognitoConfig, s3Config, sesConfig } from './shared/config/AWS';
import {
  cloudWatchConfigError,
  cloudWatchConfigInfo,
} from './shared/config/logger';
// read all modules folders and load all available modules
const modules: DynamicModule[] = loadModules();
const providers = [JwtService];

@Module({
  imports: [
    ConfigModule,
    ConfigModule.forRoot({
      load: [
        redisConfig,
        s3Config,
        cognitoConfig,
        sesConfig,
        cloudWatchConfigError,
        cloudWatchConfigInfo,
      ],
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => configService.get('redis'),
      inject: [ConfigService],
    }) as DynamicModule,
    TypeOrmModule.forRootAsync({
      useFactory: async () => ormconfig as any,
    }),
    ...modules,
  ],
  providers,
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    if (process.env.NODE_ENV === 'production')
      consumer
        .apply(AuthMiddleware)
        .exclude(
          { path: '/networkroom/roomStatus', method: RequestMethod.POST },
          { path: '/users', method: RequestMethod.POST },
          { path: '/users/checkUserExists', method: RequestMethod.POST },
          '/health',
          '/swagger',
          '/swagger/(.*)',
          '/swagger/static/(.*)',
        )
        .forRoutes('*');
  }
}
