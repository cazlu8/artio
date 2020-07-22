import { IoAdapter } from '@nestjs/platform-socket.io';
import * as redisIoAdapter from 'socket.io-redis';

export default class RedisIoAdapter extends IoAdapter {
  private readonly host: any;

  private readonly port: number;

  constructor(app: any, host: string, port: number) {
    super(app);
    this.host = host;
    this.port = port;
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    const redisAdapter = redisIoAdapter({
      host: this.host,
      port: this.port,
    });
    server.adapter(redisAdapter);
    return server;
  }
}
