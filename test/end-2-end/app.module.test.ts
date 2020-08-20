import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'nestjs-redis';
import { DynamicModule } from '@nestjs/common';
import * as ormconfig from './ormconfig.test';
import redisConfig from '../../src/shared/config/redis';
import {
  cognitoConfig,
  s3Config,
  sesConfig,
} from '../../src/shared/config/AWS';
import {
  cloudWatchConfigError,
  cloudWatchConfigInfo,
} from '../../src/shared/config/logger';

export default async modules =>
  await Test.createTestingModule({
    imports: [
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
      TypeOrmModule.forRootAsync({
        useFactory: async () => ormconfig as any,
      }),
      RedisModule.forRootAsync({
        useFactory: (configService: ConfigService) =>
          configService.get('redis'),
        inject: [ConfigService],
      }) as DynamicModule,
      ...modules,
    ],
  }).compile();
