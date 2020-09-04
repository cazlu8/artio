import * as dotenv from 'dotenv';
import * as fs from 'fs';

const data: any = fs.existsSync('.env')
  ? dotenv.parse(fs.readFileSync('.env'))
  : process.env;

module.exports = {
  type: 'postgres',
  host: data.DATABASE_HOST,
  port: +data.DATABASE_PORT,
  username: data.DATABASE_USER,
  password: data.DATABASE_PASSWORD,
  database: data.DATABASE_DBNAME,
  entities: [`src/modules/**/*.entity{.ts,.js}`],
  seeds: ['seed/seeds/**/*{.ts,.js}'],
  factories: ['seed/factories/**/*{.ts,.js}'],
};
