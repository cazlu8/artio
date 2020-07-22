import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { RedisService } from 'nestjs-redis';
import * as Redlock from 'redlock';
import { LoggerService } from '../../shared/services/logger.service';
import { NetworkRoomService } from './networkRoom.service';

@WebSocketGateway(3030)
export class NetworkRoomGateway {
  @WebSocketServer()
  server: Server;

  private readonly redisClient: any;

  private redlock: any;

  constructor(
    @InjectQueue('networkRoom') private readonly networkRoomQueue: Queue,
    private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
  ) {
    this.redisClient = this.redisService.getClient();
    this.redlock = new Redlock([this.redisClient], {
      retryDelay: 100,
      retryCount: Infinity,
    });
    this.redlock.on('clientError', function(err) {
      throw new Error(err);
    });
  }

  @SubscribeMessage('triggerIntermission')
  async triggerIntermission() {
    await this.networkRoomQueue.add('createRooms');
  }

  @SubscribeMessage('requestRoom')
  async requestRoom(client: any) {
    return this.redlock
      .lock('locks:clientsNetworkRoomCounter', 2000)
      .then(async lock => {
        const counter = await this.incrementCounter();
        const room = await this.getRoom(counter);
        client.emit(room);
        return lock.unlock().catch(err => {
          throw new Error(err);
        });
      });
  }

  async getRoom(counter) {
    const lastRoom = await this.redisClient.get('lastRoom');
    if (!lastRoom || counter === 0) return await this.getNewRoom();
    return await this.getLastRoom();
  }

  async incrementCounter(): Promise<number> {
    let counter =
      +(await this.redisClient.get('clientsNetworkRoomCounter')) || 0;
    if (counter === 3) {
      counter = 0;
      await this.redisClient.set('clientsNetworkRoomCounter', 1);
    } else await this.redisClient.incr('clientsNetworkRoomCounter');

    return counter;
  }

  async getLastRoom(): Promise<string> {
    return await this.redisClient.get('lastRoom');
  }

  async getNewRoom(): Promise<string> {
    const newRoom = await this.redisClient.lpop('rooms');
    await this.setRoom('lastRoom', newRoom);
    return newRoom;
  }

  async setRoom(key: string, room: string | number): Promise<void> {
    await this.redisClient.set(key, room);
  }

  private catch;
}
