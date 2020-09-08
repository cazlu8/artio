import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => [
  {
    name: 'default',
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    connectTimeout: 20000,
  },
  {
    name: 'subscriber',
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    connectTimeout: 20000,
  },
  {
    name: 'publisher',
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    connectTimeout: 20000,
  },
]);
