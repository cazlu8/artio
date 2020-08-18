import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../../src/modules/user/user.entity';
import { UserEvents } from '../../src/modules/userEvents/userEvents.entity';
import { Event } from '../../src/modules/event/event.entity';

const data: any = fs.existsSync('.env')
  ? dotenv.parse(fs.readFileSync('.env'))
  : process.env;

// Check typeORM documentation for more information.
const config: TypeOrmModuleOptions = {
  type: 'postgres',
  host: data.DATABASE_HOST,
  port: +data.DATABASE_PORT,
  username: data.DATABASE_USER,
  password: data.DATABASE_PASSWORD,
  database: 'test',
  entities: [`${__dirname}/../../src/**/*.entity{.ts,.js}`],
  keepConnectionAlive: true,
  synchronize: false,
  subscribers: [`${__dirname}/../../src/**/*.subscriber{.ts,.js}`],
  migrationsRun: true,
  logging: data.DATABASE_LOGGING === 'true',
  logger: data.DATABASE_LOGGING_TYPE || null,
  migrations: [`${__dirname}/../../src/migrations/**/*{.ts,.js}`],
  cli: {
    migrationsDir: `${__dirname}/../../src/migrations`,
  },
};

export = config;
