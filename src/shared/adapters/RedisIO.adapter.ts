import { IoAdapter } from '@nestjs/platform-socket.io';
import * as redisIoAdapter from 'socket.io-redis';

export default class RedisIoAdapter extends IoAdapter {
  private options: any;

  constructor(app: any, options: any) {
    super(app);
    this.options = options;
  }

  createIOServer(port: number): any {
    const server = super.createIOServer(port, {
      connectTimeout: 10000,
    });
    const redisAdapter = redisIoAdapter({
      host: this.options.host,
      port: this.options.port,
      requestsTimeout: 20000,
    });
    server.adapter(redisAdapter);
    server.origins(this.options.origins);
    return server;
  }
}
